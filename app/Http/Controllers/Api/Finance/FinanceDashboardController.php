<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\Expense;
use App\Models\Finance\Income;
use App\Models\Finance\PaymentAccount;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FinanceDashboardController extends Controller
{
    public function getStats(Request $request)
    {
        // Helper to get authorized branch IDs if not a super-admin
        $user = auth()->user();
        $isSuperAdmin = method_exists($user, 'hasRole') && $user->hasRole('super-admin');
        
        $fromDate = $request->from_date ? Carbon::parse($request->from_date)->startOfDay() : Carbon::now()->startOfMonth();
        $toDate = $request->to_date ? Carbon::parse($request->to_date)->endOfDay() : Carbon::now()->endOfDay();
        $branchId = $request->branch_id;

        $authorizedBranchIds = [];
        if (!$isSuperAdmin) {
            if (method_exists($user, 'branches')) {
                $authorizedBranchIds = $user->branches()->pluck('branches.id')->toArray();
            }
            if (empty($authorizedBranchIds) && isset($user->branch_id)) {
                $authorizedBranchIds = [$user->branch_id];
            }
        }

        // 1. Account Balances (Always current, but can be filtered by branch)
        $accountsQuery = PaymentAccount::where('is_active', true);
        
        if (!$isSuperAdmin || $branchId) {
            $accountsQuery->where(function($q) use ($branchId, $authorizedBranchIds, $isSuperAdmin) {
                if (!$isSuperAdmin) {
                    if (empty($authorizedBranchIds)) {
                        $q->whereRaw('1 = 0');
                    } else {
                        $q->whereIn('branch_id', $authorizedBranchIds);
                    }
                }
                
                if ($branchId) {
                    if (is_array($branchId)) {
                        $q->whereIn('branch_id', $branchId);
                    } else {
                        $q->where('branch_id', $branchId);
                    }
                }
            });
        }
        
        $accounts = $accountsQuery->get();
        $totalBalance = (float) $accounts->sum('balance');
        
        // 2. Period Income/Expense
        $incomeQuery = Income::whereBetween('date', [$fromDate, $toDate]);
        $expenseQuery = Expense::whereBetween('date', [$fromDate, $toDate]);

        if (!$isSuperAdmin || $branchId) {
            $branchFilter = function($q) use ($branchId, $authorizedBranchIds, $isSuperAdmin) {
                $q->whereHas('account', function($aq) use ($branchId, $authorizedBranchIds, $isSuperAdmin) {
                    if (!$isSuperAdmin) {
                        if (empty($authorizedBranchIds)) {
                            $aq->whereRaw('1 = 0');
                        } else {
                            $aq->whereIn('branch_id', $authorizedBranchIds);
                        }
                    }
                    
                    if ($branchId) {
                        if (is_array($branchId)) {
                            $aq->whereIn('branch_id', $branchId);
                        } else {
                            $aq->where('branch_id', $branchId);
                        }
                    }
                });
            };
            
            $incomeQuery->where($branchFilter);
            $expenseQuery->where($branchFilter);
        }

        $periodIncome = (float) (clone $incomeQuery)->sum('amount');
        $periodExpense = (float) (clone $expenseQuery)->sum('amount');
            
        // 3. Trends
        $days = [];
        $tempDate = $fromDate->copy();
        while ($tempDate->lte($toDate)) {
            $days[] = $tempDate->format('Y-m-d');
            $tempDate->addDay();
        }
        
        // Limit to last 60 days if the range is too large
        if (count($days) > 60) {
            $days = array_slice($days, -60);
        }
        
        $trends = [];
        
        $dailyIncome = (clone $incomeQuery)
            ->select(DB::raw('DATE(date) as day'), DB::raw('SUM(amount) as total'))
            ->groupBy('day')
            ->pluck('total', 'day');
            
        $dailyExpense = (clone $expenseQuery)
            ->select(DB::raw('DATE(date) as day'), DB::raw('SUM(amount) as total'))
            ->groupBy('day')
            ->pluck('total', 'day');
            
        foreach ($days as $day) {
            $trends[] = [
                'date' => $day,
                'income' => (float) ($dailyIncome[$day] ?? 0),
                'expense' => (float) ($dailyExpense[$day] ?? 0),
            ];
        }
        
        // 4. Category Breakdown (Expenses)
        $categoryStats = (clone $expenseQuery)
            ->with('category')
            ->select('expense_category_id', DB::raw('SUM(amount) as total'))
            ->groupBy('expense_category_id')
            ->get()
            ->map(function($item) {
                return [
                    'name' => $item->category->name ?? 'Uncategorized',
                    'total' => (float) $item->total,
                ];
            });

        return response()->json([
            'summary' => [
                'total_balance' => $totalBalance,
                'monthly_income' => $periodIncome,
                'monthly_expense' => $periodExpense,
                'net_flow' => $periodIncome - $periodExpense,
            ],
            'accounts' => $accounts,
            'trends' => $trends,
            'category_stats' => $categoryStats,
        ]);
    }
}
