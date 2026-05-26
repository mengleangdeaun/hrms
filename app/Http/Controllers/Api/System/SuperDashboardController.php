<?php

namespace App\Http\Controllers\Api\System;

use App\Http\Controllers\Controller;
use App\Models\CRM\Lead;
use App\Models\Sales\SalesOrder;
use App\Models\Finance\Income;
use App\Models\Attendance\AttendanceRecord;
use App\Models\Workshop\JobCard;
use App\Models\Workshop\JobCardItem;
use App\Models\Workshop\JobCardRating;
use App\Models\Stock\StockMovement;
use App\Models\Stock\StockAdjustment;
use App\Models\Workshop\JobCardDamage;
use App\Models\System\DailyReport;
use App\Models\HR\Employee;
use App\Services\TelegramService;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class SuperDashboardController extends Controller
{
    public function getStats(Request $request)
    {
        $date = $request->date ? Carbon::parse($request->date) : Carbon::today();
        $branchId = $request->branch_id;

        if (!$branchId) {
            return response()->json(['message' => 'Branch ID is required'], 400);
        }

        // Check if report already exists
        $existingReport = DailyReport::where('branch_id', $branchId)
            ->where('report_date', $date->format('Y-m-d'))
            ->first();

        if ($existingReport) {
            return response()->json([
                'is_submitted' => true,
                'report' => $existingReport,
                'data' => $existingReport->data
            ]);
        }

        $stats = [
            'crm' => $this->getLeadStats($date, $branchId),
            'sales' => $this->getSaleStats($date, $branchId),
            'finance' => $this->getFinanceStats($date, $branchId),
            'hr' => $this->getHRStats($date, $branchId),
            'workshop' => $this->getWorkshopStats($date, $branchId),
            'inventory' => $this->getInventoryStats($date, $branchId),
        ];

        return response()->json([
            'is_submitted' => false,
            'data' => $stats
        ]);
    }

    public function submitReport(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'date' => 'required|date',
            'data' => 'required|array'
        ]);

        $reportDate = Carbon::parse($request->date)->format('Y-m-d');

        // Double check existence
        $exists = DailyReport::where('branch_id', $request->branch_id)
            ->where('report_date', $reportDate)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Report for this day and branch has already been submitted.'], 422);
        }

        $report = DailyReport::create([
            'branch_id' => $request->branch_id,
            'report_date' => $reportDate,
            'data' => $request->data,
            'submitted_by' => Auth::id(),
            'telegram_sent' => false
        ]);

        // Trigger Telegram Notification
        try {
            $telegramService = app(TelegramService::class);
            $telegramService->sendDailyReport($report);
            $report->update(['telegram_sent' => true]);
        } catch (\Exception $e) {
            \Log::error('Failed to send Telegram daily report: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Report submitted successfully',
            'report' => $report
        ]);
    }

    private function getLeadStats($date, $branchId)
    {
        $total = Lead::where('branch_id', $branchId)
            ->whereDate('created_at', $date)
            ->count();

        $lostLeads = Lead::where('branch_id', $branchId)
            ->whereDate('updated_at', $date)
            ->where('stage_id', 9)
            ->select('lost_reason')
            ->get();

        $lostCount = $lostLeads->count();
        $reasons = $lostLeads->groupBy('lost_reason')->map->count();

        return [
            'total' => $total,
            'lost' => $lostCount,
            'lost_reasons' => $reasons
        ];
    }

    private function getSaleStats($date, $branchId)
    {
        $salesOrdersCount = SalesOrder::where('branch_id', $branchId)
            ->whereDate('created_at', $date)
            ->count();

        // For breakdown, we still need to iterate items, but we only select what we need
        $items = DB::table('sales_order_items')
            ->join('sales_orders', 'sales_order_items.sales_order_id', '=', 'sales_orders.id')
            ->where('sales_orders.branch_id', $branchId)
            ->whereDate('sales_orders.created_at', $date)
            ->select('sales_order_items.item_name', 'sales_order_items.sales_order_id')
            ->get();

        $serviceBreakdown = [];
        $ordersProcessed = [];

        foreach ($items as $item) {
            $orderId = $item->sales_order_id;
            $serviceName = $item->item_name;
            
            if (!$serviceName) continue;
            
            // We want to count how many ORDERS contain this service
            $key = "{$orderId}_{$serviceName}";
            if (!isset($ordersProcessed[$key])) {
                if (!isset($serviceBreakdown[$serviceName])) {
                    $serviceBreakdown[$serviceName] = 0;
                }
                $serviceBreakdown[$serviceName]++;
                $ordersProcessed[$key] = true;
            }
        }

        return [
            'total_count' => $salesOrdersCount,
            'breakdown' => $serviceBreakdown
        ];
    }

    private function getFinanceStats($date, $branchId)
    {
        $collected = Income::whereHas('account', function($q) use ($branchId) {
            $q->where('branch_id', $branchId);
        })
        ->whereDate('date', $date)
        ->sum('amount');

        return [
            'collected' => (float)$collected
        ];
    }

    private function getHRStats($date, $branchId)
    {
        $present = AttendanceRecord::where('branch_id', $branchId)
            ->whereDate('date', $date)
            ->where(function($q) {
                $q->where('status', 'like', '%Present%')
                  ->orWhere('status', 'like', '%Late%');
            })
            ->count();

        $totalActive = Employee::where('branch_id', $branchId)
            ->where('is_active', true)
            ->count();

        return [
            'present' => $present,
            'absent' => max(0, $totalActive - $present)
        ];
    }

    private function getWorkshopStats($date, $branchId)
    {
        $completedJobsQuery = JobCard::where('branch_id', $branchId)
            ->whereIn('status', ['Completed', 'Ready', 'Delivered', 'QC Review'])
            ->whereDate('completed_at', $date);

        $completedCount = (clone $completedJobsQuery)->count();
        $jobIds = (clone $completedJobsQuery)->pluck('id');

        $breakdown = JobCardItem::whereIn('job_card_id', $jobIds)
            ->join('services', 'job_card_items.service_id', '=', 'services.id')
            ->select('services.name', DB::raw('count(*) as total'))
            ->groupBy('services.name')
            ->pluck('total', 'name');

        $totalTasks = JobCardItem::whereHas('jobCard', function($q) use ($branchId, $date) {
            $q->where('branch_id', $branchId)->whereDate('created_at', $date);
        })->count();

        $ratings = JobCardRating::whereIn('job_card_id', $jobIds)
            ->select(DB::raw('avg(service_rating) as avg_service, avg(technical_rating) as avg_tech'))
            ->first();

        // Calculate Average Completion Time
        $jobsWithDuration = (clone $completedJobsQuery)
            ->whereNotNull('started_at')
            ->whereNotNull('completed_at')
            ->select('started_at', 'completed_at')
            ->get();

        $totalMinutes = 0;
        $countWithDuration = 0;

        foreach ($jobsWithDuration as $job) {
            $start = Carbon::parse($job->started_at);
            $end = Carbon::parse($job->completed_at);
            $duration = $start->diffInMinutes($end);
            if ($duration > 0) {
                $totalMinutes += $duration;
                $countWithDuration++;
            }
        }

        $avgMinutes = $countWithDuration > 0 ? round($totalMinutes / $countWithDuration) : 0;
        $hours = floor($avgMinutes / 60);
        $mins = $avgMinutes % 60;
        $avgDurationFormatted = $hours > 0 ? "{$hours}h {$mins}m" : "{$mins}m";

        return [
            'completed_jobs' => $completedCount,
            'breakdown' => $breakdown,
            'total_tasks' => $totalTasks,
            'avg_service_rating' => round($ratings->avg_service ?: 0, 1),
            'avg_technical_rating' => round($ratings->avg_tech ?: 0, 1),
            'avg_completion_time' => $avgDurationFormatted,
            'avg_completion_minutes' => $avgMinutes
        ];
    }

    private function getInventoryStats($date, $branchId)
    {
        $locationIds = \App\Models\Stock\Location::where('branch_id', $branchId)->pluck('id');

        $movementQuery = StockMovement::with(['product', 'serial'])
            ->whereIn('location_id', $locationIds)
            ->whereDate('created_at', $date);

        $movementCount = (clone $movementQuery)->count();
        $movementRecords = $movementQuery->latest()->limit(15)->get()->map(function ($m) {
            return [
                'id' => $m->id,
                'product_name' => $m->product?->name,
                'serial_number' => $m->serial?->serial_number,
                'type' => $m->movement_type,
                'quantity' => (float)$m->quantity,
                'balance' => (float)$m->current_quantity,
                'created_at' => $m->created_at?->format('H:i'),
            ];
        });

        $popularPart = JobCardItem::whereHas('jobCard', function($q) use ($branchId, $date) {
                $q->where('branch_id', $branchId)->whereDate('created_at', $date);
            })
            ->whereNotNull('part_id')
            ->join('job_parts_master', 'job_card_items.part_id', '=', 'job_parts_master.id')
            ->select('job_parts_master.name', DB::raw('count(*) as total'))
            ->groupBy('job_parts_master.name')
            ->orderByDesc('total')
            ->first();

        // Get damage reports: both job-card-linked (by branch) and general stock losses (by serial branch)
        $damageQuery = JobCardDamage::with(['serial.product', 'damageType', 'jobCard'])
            ->whereDate('created_at', $date)
            ->where(function ($q) use ($branchId) {
                $q->whereHas('jobCard', function ($q2) use ($branchId) {
                    $q2->where('branch_id', $branchId);
                })->orWhereHas('serial', function ($q2) use ($branchId) {
                    $q2->where('branch_id', $branchId);
                });
            });

        $damageCount = (clone $damageQuery)->count();

        $damageRecords = $damageQuery->latest()->limit(10)->get()->map(function ($d) {
            $staffIds = array_unique(array_merge($d->mistake_staff_ids ?? [], $d->rework_staff_ids ?? []));
            $staffNames = Employee::whereIn('id', $staffIds)->pluck('full_name', 'id');

            return [
                'id' => $d->id,
                'serial_number' => $d->serial?->serial_number,
                'product_name' => $d->serial?->product?->name ?? $d->jobCardItem?->part?->name ?? null,
                'quantity' => $d->quantity ? (float) $d->quantity : null,
                'damage_type' => $d->damageType?->name,
                'job_no' => $d->jobCard?->job_no,
                'mistake_by' => collect($d->mistake_staff_ids)->map(fn($id) => $staffNames[$id] ?? null)->filter()->values()->toArray(),
                'rework_by' => collect($d->rework_staff_ids)->map(fn($id) => $staffNames[$id] ?? null)->filter()->values()->toArray(),
                'created_at' => $d->created_at?->format('H:i'),
            ];
        });

        return [
            'movements' => $movementCount,
            'movement_records' => $movementRecords,
            'popular_part' => $popularPart ? $popularPart->name : 'N/A',
            'damages' => $damageCount,
            'damage_records' => $damageRecords,
        ];
    }
}
