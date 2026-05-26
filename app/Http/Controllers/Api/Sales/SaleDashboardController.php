<?php

namespace App\Http\Controllers\Api\Sales;

use App\Http\Controllers\Controller;
use App\Models\Sales\SalesOrder;
use App\Models\Sales\SalesOrderDeposit;
use App\Models\Sales\SaleShift;
use App\Models\Finance\PaymentAccount;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SaleDashboardController extends Controller
{
    /**
     * Get Sales Dashboard Stats.
     */
    public function getStats(Request $request)
    {
        $branchId = $request->branch_id;
        $fromDate = $request->from_date ? Carbon::parse($request->from_date)->startOfDay() : Carbon::today();
        $toDate = $request->to_date ? Carbon::parse($request->to_date)->endOfDay() : Carbon::today()->endOfDay();

        // 1. Sales Analytics within range
        $salesQuery = SalesOrder::whereBetween('order_date', [$fromDate, $toDate])
            ->where('status', '!=', 'CANCELLED')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        $totalSales = (float)$salesQuery->sum('grand_total');
        $salesCount = $salesQuery->count();

        // 2. Total Collected within range
        $totalCollected = (float)SalesOrderDeposit::whereBetween('deposit_date', [$fromDate, $toDate])
            ->whereHas('order', function($q) use ($branchId) {
                $q->where('status', '!=', 'CANCELLED')
                  ->when($branchId, fn($q) => $q->where('branch_id', $branchId));
            })
            ->sum('amount');

        // 3. Current Outstanding Balance (Filtered by range to match Performance Overview)
        $totalBalanceDue = SalesOrder::where('status', '!=', 'CANCELLED')
            ->whereBetween('order_date', [$fromDate, $toDate])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('balance_amount');

        // 4. Payment Accounts Collections (Calculated from Sale Deposits within range)
        $accounts = PaymentAccount::where('is_active', true)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->withSum(['deposits' => function($q) use ($fromDate, $toDate) {
                $q->whereBetween('deposit_date', [$fromDate, $toDate]);
            }], 'amount')
            ->get()
            ->map(function($account) {
                $account->balance = (float)($account->deposits_sum_amount ?? 0);
                return $account;
            });

        return response()->json([
            'stats' => [
                'total_sales' => $totalSales,
                'sales_count' => $salesCount,
                'total_collected' => $totalCollected,
                'total_balance_due' => (float)$totalBalanceDue,
            ],
            'accounts' => $accounts
        ]);
    }

    /**
     * Get Current Active Shift.
     */
    public function getCurrentShift(Request $request)
    {
        $branchId = $request->branch_id;
        if (!$branchId) {
            return response()->json(['shift' => null]);
        }

        $shift = SaleShift::where('branch_id', $branchId)
            ->active()
            ->first();

        return response()->json(['shift' => $shift]);
    }

    /**
     * Open a new shift.
     */
    public function openShift(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
        ]);

        return DB::transaction(function () use ($request) {
            // Check for existing active shift with lock to prevent race conditions
            $activeShift = SaleShift::where('branch_id', $request->branch_id)
                ->active()
                ->lockForUpdate()
                ->first();

            if ($activeShift) {
                return response()->json([
                    'message' => 'A shift is already open for this branch.',
                    'shift' => $activeShift
                ], 200); // 200 status to allow frontend to sync smoothly
            }

            $shift = SaleShift::create([
                'branch_id' => $request->branch_id,
                'user_id' => auth()->id(),
                'opened_at' => now(),
                'status' => 'open',
            ]);

            // Trigger Telegram notification
            NotificationService::shiftActivity($shift);

            return response()->json([
                'message' => 'Shift opened successfully',
                'shift' => $shift
            ]);
        });
    }

    /**
     * Close the current shift.
     */
    public function closeShift(SaleShift $shift)
    {
        if ($shift->status !== 'open') {
            return response()->json(['message' => 'This shift is already closed.'], 422);
        }

        $now = now();
        $branchId = $shift->branch_id;

        // 1. Count Sales during shift
        $salesCount = SalesOrder::where('branch_id', $branchId)
            ->whereBetween('created_at', [$shift->opened_at, $now])
            ->count();

        // 2. Calculate Total Collected during shift
        $deposits = SalesOrderDeposit::whereHas('order', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            })
            ->whereBetween('created_at', [$shift->opened_at, $now])
            ->get();

        $totalCollected = $deposits->sum('amount');

        // 3. Breakdown by Payment Account
        $summary = $deposits->groupBy('payment_account_id')->map(function ($group) {
            $account = $group->first()->paymentAccount;
            return [
                'name' => $account?->name ?? 'Unknown',
                'amount' => $group->sum('amount')
            ];
        })->values()->toArray();

        // Update shift
        $shift->update([
            'closed_at' => $now,
            'total_sales_count' => $salesCount,
            'total_amount_collected' => $totalCollected,
            'account_summary' => $summary,
            'status' => 'closed',
        ]);

        // Trigger Telegram notification (Summary)
        NotificationService::shiftActivity($shift);

        return response()->json([
            'message' => 'Shift closed successfully',
            'summary' => [
                'sales_count' => $salesCount,
                'total_collected' => $totalCollected,
                'accounts' => $summary
            ]
        ]);
    }
}
