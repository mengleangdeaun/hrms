<?php

namespace App\Http\Controllers;

use App\Models\Workshop\JobCard;
use App\Models\Workshop\JobCardItem;
use App\Models\QualityControl\JobCardQCReport;
use App\Models\QualityControl\JobCardQCItem;
use App\Models\Workshop\JobCardDamage;
use App\Models\Workshop\JobCardMaterialUsage;
use App\Models\HR\Employee;
use App\Models\Inventory\ProductSerial;
use App\Models\Inventory\SerialMovement;
use App\Services\Inventory\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class JobCardQCController extends Controller
{
    public function index(Request $request)
    {
        $query = JobCardQCReport::with([
            'jobCard.customer', 
            'jobCard.leadTechnician',
            'jobCard.branch',
            'qcPerson', 
            'reworkTechnician',
            'qcItems.jobCardItem.part',
            'qcItems.reworkTechnician',
            'qcItems.damageType'
        ]);
        
        $this->applyQCFilters($query, $request);

        // Calculate stats based on filtered query (excluding pagination)
        $statsQuery = clone $query;
        $stats = [
            'total_failures' => (clone $statsQuery)->where('decision', 'FAIL')->count(),
            'avg_rating' => round((clone $statsQuery)->avg('rating') ?: 0, 1),
            'total_audits' => (clone $statsQuery)->count(),
            'rework_tasks' => (clone $statsQuery)->whereNotNull('rework_technician_id')->count(),
        ];

        /** @var \Illuminate\Pagination\LengthAwarePaginator $paginated */
        $paginated = $query->latest()->paginate($request->per_page ?? 15);

        return response()->json(array_merge($paginated->toArray(), ['stats' => $stats]));
    }

    private function applyQCFilters($query, Request $request)
    {
        // 1. Mandatory Branch Isolation for non-super-admins
        $user = Auth::user();
        $isSuperAdmin = method_exists($user, 'hasRole') && $user->hasRole('super-admin');

        if (!$isSuperAdmin) {
            $authorizedBranchIds = [];
            if (method_exists($user, 'branches')) {
                $authorizedBranchIds = $user->branches()->pluck('branches.id')->toArray();
            }
            if (empty($authorizedBranchIds) && isset($user->branch_id)) {
                $authorizedBranchIds = [$user->branch_id];
            }

            if (empty($authorizedBranchIds)) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereHas('jobCard', function($q) use ($authorizedBranchIds) {
                    $q->whereIn('branch_id', $authorizedBranchIds);
                });
            }
        }

        // Archival Filter
        $query->where('is_archived', $request->boolean('archived', false));

        // Request-based Branch Filter (if provided and authorized)
        if ($request->filled('branch_id')) {
            $requestedBranchId = $request->branch_id;
            $query->whereHas('jobCard', function($q) use ($requestedBranchId) {
                if (is_array($requestedBranchId)) {
                    $q->whereIn('branch_id', $requestedBranchId);
                } else {
                    $q->where('branch_id', $requestedBranchId);
                }
            });
        }

        // Auditor Filter
        if ($request->filled('qc_person_id')) {
            $query->where('qc_person_id', $request->qc_person_id);
        }

        // Date Range Filter
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [
                $request->start_date . ' 00:00:00',
                $request->end_date . ' 23:59:59'
            ]);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('jobCard', function($q) use ($search) {
                    $q->where('job_no', 'like', "%{$search}%");
                })
                ->orWhereHas('reworkTechnician', function($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                      ->orWhere('name', 'like', "%{$search}%");
                })
                ->orWhereHas('qcPerson', function($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                      ->orWhere('name', 'like', "%{$search}%");
                });
            });
        }

        if ($request->has('decision')) {
            $query->where('decision', $request->decision);
        }

        if ($request->has('technician_id')) {
            $query->whereHas('reworkTechnician', function($q) use ($request) {
                $q->where('id', $request->technician_id);
            });
        }

        if ($request->boolean('has_damage')) {
            $query->whereNotNull('damages')
                  ->where('damages', '!=', '[]')
                  ->where('damages', '!=', 'null');
        }
    }

    public function exportQC(Request $request)
    {
        $query = JobCardQCReport::with([
            'jobCard.customer', 
            'jobCard.branch',
            'qcPerson'
        ]);

        $this->applyQCFilters($query, $request);

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=qc_audit_reports_" . date('Y-m-d') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['#', 'Audit Date', 'Job Card #', 'Customer', 'Branch', 'QC Person', 'Decision', 'Rating', 'Notes'];

        $callback = function() use($query, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            $index = 1;
            $query->latest()->chunk(200, function($reports) use($file, &$index) {
                foreach ($reports as $report) {
                    fputcsv($file, [
                        $index++,
                        $report->created_at->format('Y-m-d H:i'),
                        $report->jobCard->job_no ?? 'N/A',
                        $report->jobCard->customer->name ?? 'N/A',
                        $report->jobCard->branch->name ?? 'N/A',
                        $report->qcPerson->full_name ?? 'N/A',
                        $report->decision,
                        $report->rating . ' / 5',
                        $report->notes
                    ]);
                }
            });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'job_card_id' => 'required|exists:job_cards,id',
            'qc_person_id' => 'required|exists:employees,id',
            'rating' => 'required|integer|min:1|max:5',
            'decision' => 'required|in:PASS,FAIL',
            'damages' => 'nullable|array',
            'item_evaluations' => 'nullable|array',
            'item_evaluations.*.status' => 'required|in:PASS,FAIL',
            'item_evaluations.*.rating' => 'required|integer|min:1|max:5',
            'item_evaluations.*.damage_type_id' => 'nullable|integer',
            'item_evaluations.*.rework_technician_ids' => 'nullable|array',
            'item_evaluations.*.notes' => 'nullable|string',
            'item_evaluations.*.serial_id' => 'nullable|exists:inventory_product_serials,id',
            'item_evaluations.*.width' => 'nullable|numeric',
            'item_evaluations.*.height' => 'nullable|numeric',
            'item_evaluations.*.quantity' => 'nullable|numeric',
            'rework_technician_id' => 'nullable|exists:employees,id', // Legacy/Default for report
            'rework_technician_ids' => 'nullable|array', // Default for report
            'notes' => 'nullable|string'
        ]);

        return DB::transaction(function() use ($validated) {
            $report = JobCardQCReport::create($validated);
            
            $jobCard = JobCard::findOrFail($validated['job_card_id']);
            $newStatus = $validated['decision'] === 'PASS' ? 'Ready' : 'Rework';
            
            $jobCard->update([
                'status' => $newStatus,
                'notes' => $validated['notes'] ? $jobCard->notes . "\nQC Notes: " . $validated['notes'] : $jobCard->notes
            ]);

            // Save item-level evaluations to the new table
            if (!empty($validated['item_evaluations'])) {
                foreach ($validated['item_evaluations'] as $itemId => $evaluation) {
                    JobCardQCItem::create([
                        'qc_report_id' => $report->id,
                        'job_card_item_id' => $itemId,
                        'rating' => $evaluation['rating'] ?? 5,
                        'status' => $evaluation['status'] ?? 'PASS',
                        'damage_type_id' => $evaluation['damage_type_id'] ?? $evaluation['replacement_reason_id'] ?? null,
                        'rework_technician_id' => !empty($evaluation['rework_technician_ids']) ? $evaluation['rework_technician_ids'][0] : null,
                        'notes' => $evaluation['notes'] ?? null,
                    ]);

                    if (isset($evaluation['status']) && $evaluation['status'] === 'FAIL') {
                        $item = JobCardItem::findOrFail($itemId);
                        
                        // Handle replacement_reason_id if sent from frontend instead of damage_type_id
                        $reasonId = $evaluation['damage_type_id'] ?? $evaluation['replacement_reason_id'] ?? null;
                        
                        // Capture Mistake Technicians
                        $mistakeTechIds = $item->technicians()->pluck('employees.id')->toArray();
                        if (empty($mistakeTechIds) && $item->technician_id) {
                            $mistakeTechIds = [$item->technician_id];
                        }

                        // Create Dedicated Damage Record
                        $damage = JobCardDamage::create([
                            'job_card_id' => $jobCard->id,
                            'job_card_item_id' => $itemId,
                            'qc_report_id' => $report->id,
                            'mistake_staff_ids' => $mistakeTechIds,
                            'rework_staff_ids' => $evaluation['rework_technician_ids'] ?? [],
                            'damage_type_id' => $reasonId,
                            'serial_id' => $evaluation['serial_id'] ?? null,
                            'width' => $evaluation['width'] ?? null,
                            'height' => $evaluation['height'] ?? null,
                            'quantity' => $evaluation['quantity'] ?? null,
                            'rating' => $evaluation['rating'] ?? 1,
                            'notes' => $evaluation['notes'] ?? null,
                            'status' => 'unfixed'
                        ]);

                        // --- STOCK DEDUCTION IF SERIAL PROVIDED ---
                        if (!empty($evaluation['serial_id']) && !empty($evaluation['quantity'])) {
                            resolve(StockService::class)->updateStock(
                                $item->product_id,
                                $jobCard->branch?->locations()->where('is_primary', true)->first()?->id ?? Location::first()->id, // Fallback to location logic
                                (float) $evaluation['quantity'],
                                'DAMAGE_REPORT',
                                $damage,
                                'QC Failure: ' . ($evaluation['notes'] ?? 'No notes'),
                                Auth::id(),
                                (int) $evaluation['serial_id']
                            );
                        }

                        // --- AUTO MATERIAL REPLICATION ---
                        // Find original materials for this item and create rework copies
                        $originalMaterials = JobCardMaterialUsage::where('job_card_id', $jobCard->id)
                            ->where('job_card_item_id', $itemId)
                            ->where('is_damage', false)
                            ->get();

                        foreach ($originalMaterials as $mat) {
                            JobCardMaterialUsage::create([
                                'job_card_id' => $jobCard->id,
                                'job_card_item_id' => $itemId,
                                'product_id' => $mat->product_id,
                                'unit' => $mat->unit,
                                'spent_qty' => $mat->spent_qty, // Carry over the default qty
                                'width_on_car' => $mat->width_on_car, // Preset dimensions if available
                                'height_on_car' => $mat->height_on_car,
                                'is_damage' => true
                            ]);
                        }

                        $item->update([
                            'status' => 'Reworking',
                            'completion_percentage' => 95 // Set back slightly for rework
                        ]);

                        if (!empty($evaluation['rework_technician_ids'])) {
                            $item->technicians()->sync($evaluation['rework_technician_ids']);
                        }
                    }
                }
            }

            $report->load(['qcPerson', 'jobCard.vehicle', 'jobCard.customer']);

            // Broadcast QC Audit Completion
            $qcKey = $validated['decision'] === 'PASS' ? 'services.qc_passed' : 'services.qc_failed';
            resolve(\App\Services\TelegramService::class)->broadcast($qcKey, $report);

            // If there were damages, broadcast Damage Report (using the first damage or summary)
            if (!empty($validated['item_evaluations'])) {
                $hasFailures = collect($validated['item_evaluations'])->contains('status', 'FAIL');
                if ($hasFailures) {
                    // We can broadcast a general damage alert or for each item. 
                    // To avoid spam, we broadcast one alert for the report.
                    resolve(\App\Services\TelegramService::class)->broadcast('services.damage_reported', $report);
                }
            }

            return $report->load(['qcPerson', 'reworkTechnician']);
        });
    }

    public function show($jobCardId)
    {
        return JobCardQCReport::with([
                'qcPerson', 
                'reworkTechnician',
                'qcItems.jobCardItem.part',
                'qcItems.reworkTechnician',
                'qcItems.damageType'
            ])
            ->where('job_card_id', $jobCardId)
            ->latest()
            ->first();
    }


    public function archive($id)
    {
        $report = JobCardQCReport::findOrFail($id);
        $report->update(['is_archived' => true]);
        return response()->json(['message' => 'Report archived successfully']);
    }

    public function unarchive($id)
    {
        $report = JobCardQCReport::findOrFail($id);
        $report->update(['is_archived' => false]);
        return response()->json(['message' => 'Report restored successfully']);
    }

    public function bulkArchive(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'exists:job_card_qc_reports,id']);
        JobCardQCReport::whereIn('id', $request->ids)->update(['is_archived' => true]);
        return response()->json(['message' => count($request->ids) . ' reports archived successfully']);
    }

    public function bulkUnarchive(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'exists:job_card_qc_reports,id']);
        JobCardQCReport::whereIn('id', $request->ids)->update(['is_archived' => false]);
        return response()->json(['message' => count($request->ids) . ' reports restored successfully']);
    }
}


