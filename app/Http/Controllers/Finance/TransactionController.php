<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\PaymentTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = PaymentTransaction::with([
            'account:id,ulid,name,logo,branch_id', 
            'creator:id,name,avatar', 
            'reference' => function ($morphTo) {
                $morphTo->morphWith([
                    \App\Models\Sales\SalesOrderDeposit::class => ['order:id,order_no'],
                    \App\Models\Finance\Income::class => ['category:id,name'],
                    \App\Models\Finance\Expense::class => ['category:id,name'],
                ]);
            }
        ])->select([
            'id', 'ulid', 'payment_account_id', 'amount', 'type', 
            'reference_type', 'reference_id', 'balance_before', 'balance_after', 
            'description', 'date', 'created_by'
        ]);

        // Mandatory Branch Security & Filter
        $user = Auth::user();
        $isSuperAdmin = method_exists($user, 'hasRole') && $user->hasRole('super-admin');

        if (!$isSuperAdmin || $request->filled('branch_id')) {
            $authorizedBranchIds = [];
            if (!$isSuperAdmin) {
                if (method_exists($user, 'branches')) {
                    $authorizedBranchIds = $user->branches()->pluck('branches.id')->toArray();
                }
                if (empty($authorizedBranchIds) && isset($user->branch_id)) {
                    $authorizedBranchIds = [$user->branch_id];
                }
            }

            $requestedBranchId = $request->branch_id;
            
            $query->whereHas('account', function ($q) use ($authorizedBranchIds, $requestedBranchId, $isSuperAdmin) {
                if (!$isSuperAdmin) {
                    if (empty($authorizedBranchIds)) {
                        $q->whereRaw('1 = 0');
                    } else {
                        $q->whereIn('branch_id', $authorizedBranchIds);
                    }
                }
                
                if ($requestedBranchId) {
                    if (is_array($requestedBranchId)) {
                        $q->whereIn('branch_id', $requestedBranchId);
                    } else {
                        $q->where('branch_id', $requestedBranchId);
                    }
                }
            });
        }

        if ($request->payment_account_id) {
            $accountId = $request->payment_account_id;
            // If it's a ULID string, find the actual ID
            if (!is_numeric($accountId)) {
                $accountId = \App\Models\Finance\PaymentAccount::where('ulid', $accountId)->value('id');
            }
            $query->where('payment_account_id', $accountId);
        }

        if ($request->from_date && $request->to_date) {
            $query->whereBetween('date', [$request->from_date . ' 00:00:00', $request->to_date . ' 23:59:59']);
        }

        if ($request->type && $request->type !== 'ALL') {
            $query->where('type', $request->type);
        }

        if ($request->search) {
            $q = $request->search;
            $query->where(function ($query) use ($q) {
                $query->where('description', 'like', "%$q%")
                    ->orWhere('reference_no', 'like', "%$q%")
                    ->orWhereHas('account', function ($query) use ($q) {
                        $query->where('name', 'like', "%$q%");
                    });
            });
        }

        $sortBy = $request->sort_by ?? 'date';
        $sortDir = $request->sort_dir ?? 'desc';
        $query->orderBy($sortBy, $sortDir)->orderBy('id', $sortDir);

        if ($request->has('all')) {
            return $query->get();
        }

        return $query->paginate($request->per_page ?? 20);
    }
}
