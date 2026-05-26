<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workshop\JobCard;
use App\Models\Workshop\JobCardItem;
use App\Models\Workshop\JobCardRating;
use App\Models\HR\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TechPerformanceController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->start_date ? Carbon::parse($request->start_date)->startOfDay() : Carbon::now()->startOfMonth();
        $endDate = $request->end_date ? Carbon::parse($request->end_date)->endOfDay() : Carbon::now()->endOfDay();
        $branchId = $request->branch_id;

        // Helper to get authorized branch IDs if not a super-admin
        $user = auth()->user();
        $isSuperAdmin = method_exists($user, 'hasRole') && $user->hasRole('super-admin');
        $authorizedBranchIds = !$isSuperAdmin ? $user->branches()->pluck('branches.id')->toArray() : null;

        // 1. Technician Score Calculation (Weighted Tasks)
        // Score = SUM(1 / number_of_techs_per_item)
        $techScores = Employee::query()
            ->join('job_card_item_technician as jcit', 'employees.id', '=', 'jcit.employee_id')
            ->join('job_card_items as jci', 'jci.id', '=', 'jcit.job_card_item_id')
            ->join('job_cards as jc', 'jc.id', '=', 'jci.job_card_id')
            ->join(DB::raw('(SELECT job_card_item_id, COUNT(*) as total_techs FROM job_card_item_technician GROUP BY job_card_item_id) as task_tech_count'), 
                'task_tech_count.job_card_item_id', '=', 'jci.id')
            ->select(
                'employees.id',
                'employees.full_name as name',
                DB::raw('SUM(1.0 / task_tech_count.total_techs) as total_score'),
                DB::raw('COUNT(jci.id) as total_tasks')
            )
            ->where('jci.status', 'Completed')
            ->whereBetween('jci.completed_at', [$startDate, $endDate])
            ->when($branchId, function($q) use ($branchId) {
                return is_array($branchId) ? $q->whereIn('jc.branch_id', $branchId) : $q->where('jc.branch_id', $branchId);
            })
            ->when(!$branchId && !$isSuperAdmin, fn($q) => $q->whereIn('jc.branch_id', $authorizedBranchIds))
            ->groupBy('employees.id', 'employees.full_name')
            ->orderByDesc('total_score')
            ->get();

        // 2. Global Metrics
        $totalJobs = JobCard::where('status', 'Delivered')
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->when($branchId, function($q) use ($branchId) {
                return is_array($branchId) ? $q->whereIn('branch_id', $branchId) : $q->where('branch_id', $branchId);
            })
            ->count();

        $totalTasks = JobCardItem::where('status', 'Completed')
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->whereHas('jobCard', function($q) use ($branchId, $isSuperAdmin, $authorizedBranchIds) {
                $q->when($branchId, function($sub) use ($branchId) {
                    return is_array($branchId) ? $sub->whereIn('branch_id', $branchId) : $sub->where('branch_id', $branchId);
                });
                // Global scope on JobCard handles the null branch_id case automatically
            })
            ->count();

        $avgCompletionTime = JobCard::where('status', 'Delivered')
            ->whereNotNull('started_at')
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->when($branchId, function($q) use ($branchId) {
                return is_array($branchId) ? $q->whereIn('branch_id', $branchId) : $q->where('branch_id', $branchId);
            })
            ->select(DB::raw('AVG(TIMESTAMPDIFF(SECOND, started_at, completed_at)) as avg_seconds'))
            ->first()
            ->avg_seconds ?? 0;

        $avgRating = JobCardRating::join('job_cards', 'job_cards.id', '=', 'job_card_ratings.job_card_id')
            ->whereBetween('job_card_ratings.created_at', [$startDate, $endDate])
            ->when($branchId, function($q) use ($branchId) {
                return is_array($branchId) ? $q->whereIn('job_cards.branch_id', $branchId) : $q->where('job_cards.branch_id', $branchId);
            })
            ->when(!$branchId && !$isSuperAdmin, fn($q) => $q->whereIn('job_cards.branch_id', $authorizedBranchIds))
            ->select(
                DB::raw('AVG(service_rating) as avg_service'),
                DB::raw('AVG(technical_rating) as avg_technical')
            )
            ->first();

        // Most Popular Part
        $popularPart = JobCardItem::where('jci.status', 'Completed')
            ->from('job_card_items as jci')
            ->join('job_cards as jc', 'jc.id', '=', 'jci.job_card_id')
            ->join('job_parts_master as jpm', 'jpm.id', '=', 'jci.part_id')
            ->whereNotNull('jci.part_id')
            ->whereBetween('jci.completed_at', [$startDate, $endDate])
            ->when($branchId, function($q) use ($branchId) {
                return is_array($branchId) ? $q->whereIn('jc.branch_id', $branchId) : $q->where('jc.branch_id', $branchId);
            })
            ->when(!$branchId && !$isSuperAdmin, fn($q) => $q->whereIn('jc.branch_id', $authorizedBranchIds))
            ->select('jpm.name', DB::raw('count(*) as count'))
            ->groupBy('jci.part_id', 'jpm.name')
            ->orderByDesc('count')
            ->first();

        // 3. Trends (Daily Completion)
        $jobTrends = JobCard::where('status', 'Delivered')
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->when($branchId, function($q) use ($branchId) {
                return is_array($branchId) ? $q->whereIn('branch_id', $branchId) : $q->where('branch_id', $branchId);
            })
            ->select(
                DB::raw('DATE(completed_at) as date'),
                DB::raw('COUNT(*) as jobs')
            )
            ->groupBy('date')
            ->get();

        $taskTrends = JobCardItem::where('status', 'Completed')
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->whereHas('jobCard', function($q) use ($branchId) {
                $q->when($branchId, function($sub) use ($branchId) {
                    return is_array($branchId) ? $sub->whereIn('branch_id', $branchId) : $sub->where('branch_id', $branchId);
                });
            })
            ->select(
                DB::raw('DATE(completed_at) as date'),
                DB::raw('COUNT(*) as tasks')
            )
            ->groupBy('date')
            ->get();

        // Merge Trends
        $allDates = $jobTrends->pluck('date')->merge($taskTrends->pluck('date'))->unique()->sort();
        $mergedTrends = $allDates->map(function($date) use ($jobTrends, $taskTrends) {
            return [
                'date' => $date,
                'jobs' => $jobTrends->firstWhere('date', $date)?->jobs ?? 0,
                'tasks' => $taskTrends->firstWhere('date', $date)?->tasks ?? 0,
            ];
        })->values();

        return response()->json([
            'technicians' => $techScores,
            'summary' => [
                'total_jobs' => $totalJobs,
                'total_tasks' => $totalTasks,
                'avg_completion_hours' => round($avgCompletionTime / 3600, 2),
                'avg_service_rating' => round($avgRating->avg_service ?? 0, 1),
                'avg_technical_rating' => round($avgRating->avg_technical ?? 0, 1),
                'popular_part' => $popularPart ? [
                    'name' => $popularPart->name,
                    'count' => $popularPart->count
                ] : null
            ],
            'trends' => $mergedTrends
        ]);
    }
}
