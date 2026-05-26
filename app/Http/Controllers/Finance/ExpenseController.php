<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\Expense;
use App\Models\Finance\ExpenseCategory;
use App\Services\Finance\FinanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ExpenseController extends Controller
{
    protected $financeService;

    public function __construct(FinanceService $financeService)
    {
        $this->financeService = $financeService;
    }

    public function index(Request $request)
    {
        $query = Expense::with([
            'category:id,name', 
            'account:id,ulid,name', 
            'creator:id,name,avatar'
        ])->select(['id', 'ulid', 'expense_category_id', 'payment_account_id', 'amount', 'date', 'description', 'reference_no', 'receipt_path', 'created_by']);

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
                $categoryId = ExpenseCategory::where('ulid', $categoryId)->value('id');
            }
            $query->where('expense_category_id', $categoryId);
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
            'expense_category_id' => 'required', // Can be ID or ULID from frontend
            'payment_account_id' => 'required',  // Can be ID or ULID from frontend
            'amount' => 'required|numeric|min:0.01',
            'date' => 'required|date',
            'description' => 'nullable|string',
            'reference_no' => 'nullable|string',
            'receipt' => 'nullable|file|max:5000',
        ]);

        return DB::transaction(function () use ($request, $validated) {
            $receiptPath = null;
            if ($request->hasFile('receipt')) {
                $receiptPath = $request->file('receipt')->store('expenses', 'public');
            }

            // Resolve IDs from ULIDs if necessary
            $categoryId = $validated['expense_category_id'];
            if (!is_numeric($categoryId)) {
                $categoryId = ExpenseCategory::where('ulid', $categoryId)->value('id');
            }

            $accountId = $validated['payment_account_id'];
            if (!is_numeric($accountId)) {
                $accountId = \App\Models\Finance\PaymentAccount::where('ulid', $accountId)->value('id');
            }

            $expense = $this->financeService->recordExpense([
                'expense_category_id' => $categoryId,
                'payment_account_id' => $accountId,
                'amount' => $validated['amount'],
                'date' => $validated['date'],
                'description' => $validated['description'],
                'reference_no' => $validated['reference_no'] ?? null,
                'receipt_path' => $receiptPath ? '/storage/' . $receiptPath : null,
            ]);

            return response()->json($expense->load(['category', 'account']), 201);
        });
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'expense_category_id' => 'required',
            'payment_account_id' => 'required',
            'amount' => 'required|numeric|min:0.01',
            'date' => 'required|date',
            'description' => 'nullable|string',
            'receipt' => 'nullable|file|max:5000',
        ]);

        $expense = Expense::where('ulid', $id)->orWhere('id', $id)->firstOrFail();

        return DB::transaction(function () use ($request, $validated, $expense) {
            // Revert old transaction
            if ($expense->payment_transaction_id) {
                $this->financeService->revertTransaction($expense->payment_transaction_id);
            }

            $receiptPath = $expense->receipt_path;
            if ($request->hasFile('receipt')) {
                $receiptPath = '/storage/' . $request->file('receipt')->store('expenses', 'public');
            }

            // Resolve IDs
            $categoryId = $validated['expense_category_id'];
            if (!is_numeric($categoryId)) {
                $categoryId = ExpenseCategory::where('ulid', $categoryId)->value('id');
            }

            $accountId = $validated['payment_account_id'];
            if (!is_numeric($accountId)) {
                $accountId = \App\Models\Finance\PaymentAccount::where('ulid', $accountId)->value('id');
            }

            $expense->update([
                'expense_category_id' => $categoryId,
                'payment_account_id' => $accountId,
                'amount' => $validated['amount'],
                'date' => $validated['date'],
                'description' => $validated['description'],
                'reference_no' => $validated['reference_no'],
                'receipt_path' => $receiptPath,
            ]);

            // Record new transaction
            $transaction = $this->financeService->recordTransaction(
                $expense->payment_account_id,
                $expense->amount,
                'OUT',
                get_class($expense),
                $expense->id,
                "Updated Expense: " . ($expense->description ?? "Unnamed"),
                $expense->date
            );

            $expense->update(['payment_transaction_id' => $transaction->id]);

            return response()->json($expense->load(['category', 'account']), 200);
        });
    }

    public function destroy($id)
    {
        $expense = Expense::where('ulid', $id)->orWhere('id', $id)->firstOrFail();

        DB::transaction(function () use ($expense) {
            if ($expense->payment_transaction_id) {
                $this->financeService->revertTransaction($expense->payment_transaction_id);
            }
            $expense->delete();
        });

        return response()->json(null, 204);
    }

    public function categories(Request $request)
    {
        if ($request->has('all')) {
            return ExpenseCategory::all();
        }
        return ExpenseCategory::where('is_active', true)->get();
    }

    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:expense_categories,name',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $category = ExpenseCategory::create($validated);
        return response()->json($category, 201);
    }

    public function updateCategory(Request $request, $id)
    {
        $category = ExpenseCategory::where('ulid', $id)->orWhere('id', $id)->firstOrFail();
        $validated = $request->validate([
            'name' => 'required|string|unique:expense_categories,name,' . $category->id,
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $category->update($validated);
        return response()->json($category);
    }

    public function destroyCategory($id)
    {
        $category = ExpenseCategory::where('ulid', $id)->orWhere('id', $id)->firstOrFail();
        
        // Check if category has expenses
        if ($category->expenses()->count() > 0) {
            return response()->json(['message' => 'Cannot delete category with associated expenses'], 422);
        }

        $category->delete();
        return response()->json(null, 204);
    }
}
