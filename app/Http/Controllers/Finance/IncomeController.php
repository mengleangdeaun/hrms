<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\Income;
use App\Models\Finance\IncomeCategory;
use App\Services\Finance\FinanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class IncomeController extends Controller
{
    protected $financeService;

    public function __construct(FinanceService $financeService)
    {
        $this->financeService = $financeService;
    }

    public function index(Request $request)
    {
        $query = Income::with([
            'category:id,name', 
            'account:id,ulid,name', 
            'creator:id,name,avatar'
        ])->select(['id', 'ulid', 'income_category_id', 'payment_account_id', 'amount', 'date', 'description', 'reference_no', 'created_by']);

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

        if ($request->from_date && $request->to_date) {
            $query->whereBetween('date', [$request->from_date . ' 00:00:00', $request->to_date . ' 23:59:59']);
        }

        if ($request->category_id) {
            $categoryId = $request->category_id;
            if (!is_numeric($categoryId)) {
                $categoryId = IncomeCategory::where('ulid', $categoryId)->value('id');
            }
            $query->where('income_category_id', $categoryId);
        }

        if ($request->payment_account_id) {
            $accountId = $request->payment_account_id;
            if (!is_numeric($accountId)) {
                $accountId = \App\Models\Finance\PaymentAccount::where('ulid', $accountId)->value('id');
            }
            $query->where('payment_account_id', $accountId);
        }

        if ($request->search) {
            $q = $request->search;
            $query->where(function ($query) use ($q) {
                $query->where('description', 'like', "%$q%")
                    ->orWhere('reference_no', 'like', "%$q%")
                    ->orWhereHas('category', function ($query) use ($q) {
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

        return $query->paginate($request->per_page ?? 15);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'income_category_id' => 'required',
            'payment_account_id' => 'required',
            'amount' => 'required|numeric|min:0.01',
            'date' => 'required|date',
            'description' => 'nullable|string',
            'reference_no' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            // Resolve IDs
            $categoryId = $validated['income_category_id'];
            if (!is_numeric($categoryId)) {
                $categoryId = IncomeCategory::where('ulid', $categoryId)->value('id');
            }

            $accountId = $validated['payment_account_id'];
            if (!is_numeric($accountId)) {
                $accountId = \App\Models\Finance\PaymentAccount::where('ulid', $accountId)->value('id');
            }

            $income = $this->financeService->recordIncome([
                'income_category_id' => $categoryId,
                'payment_account_id' => $accountId,
                'amount' => $validated['amount'],
                'date' => $validated['date'],
                'description' => $validated['description'],
                'reference_no' => $validated['reference_no'] ?? null,
            ]);

            return response()->json($income->load(['category', 'account']), 201);
        });
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'income_category_id' => 'required',
            'payment_account_id' => 'required',
            'amount' => 'required|numeric|min:0.01',
            'date' => 'required|date',
            'description' => 'nullable|string',
            'reference_no' => 'nullable|string',
        ]);

        $income = Income::where('ulid', $id)->orWhere('id', $id)->firstOrFail();

        return DB::transaction(function () use ($validated, $income) {
            // Revert old transaction
            if ($income->payment_transaction_id) {
                $this->financeService->revertTransaction($income->payment_transaction_id);
            }

            // Resolve IDs
            $categoryId = $validated['income_category_id'];
            if (!is_numeric($categoryId)) {
                $categoryId = IncomeCategory::where('ulid', $categoryId)->value('id');
            }

            $accountId = $validated['payment_account_id'];
            if (!is_numeric($accountId)) {
                $accountId = \App\Models\Finance\PaymentAccount::where('ulid', $accountId)->value('id');
            }

            $income->update([
                'income_category_id' => $categoryId,
                'payment_account_id' => $accountId,
                'amount' => $validated['amount'],
                'date' => $validated['date'],
                'description' => $validated['description'],
                'reference_no' => $validated['reference_no'],
            ]);

            // Record new transaction
            $transaction = $this->financeService->recordTransaction(
                $income->payment_account_id,
                $income->amount,
                'IN',
                get_class($income),
                $income->id,
                "Updated Income: " . ($income->description ?? "Unnamed"),
                $income->date
            );

            $income->update(['payment_transaction_id' => $transaction->id]);

            return response()->json($income->load(['category', 'account']), 200);
        });
    }

    public function destroy($id)
    {
        $income = Income::where('ulid', $id)->orWhere('id', $id)->firstOrFail();

        DB::transaction(function () use ($income) {
            if ($income->payment_transaction_id) {
                $this->financeService->revertTransaction($income->payment_transaction_id);
            }
            $income->delete();
        });

        return response()->json(null, 204);
    }

    public function categories(Request $request)
    {
        if ($request->has('all')) {
            return IncomeCategory::all();
        }
        return IncomeCategory::where('is_active', true)->get();
    }

    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:income_categories,name',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $category = IncomeCategory::create($validated);
        return response()->json($category, 201);
    }

    public function updateCategory(Request $request, $id)
    {
        $category = IncomeCategory::where('ulid', $id)->orWhere('id', $id)->firstOrFail();
        $validated = $request->validate([
            'name' => 'required|string|unique:income_categories,name,' . $category->id,
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $category->update($validated);
        return response()->json($category);
    }

    public function destroyCategory($id)
    {
        $category = IncomeCategory::where('ulid', $id)->orWhere('id', $id)->firstOrFail();
        
        // Check if category has incomes
        if ($category->incomes()->count() > 0) {
            return response()->json(['message' => 'Cannot delete category with associated incomes'], 422);
        }

        $category->delete();
        return response()->json(null, 204);
    }
}
