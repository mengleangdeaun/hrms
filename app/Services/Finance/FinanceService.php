<?php

namespace App\Services\Finance;

use App\Models\Finance\PaymentAccount;
use App\Models\Finance\PaymentTransaction;
use App\Models\Finance\Income;
use App\Models\Finance\Expense;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class FinanceService
{
    /**
     * Record an income and its associated transaction.
     */
    public function recordIncome(array $data)
    {
        return DB::transaction(function () use ($data) {
            $income = Income::create([
                'income_category_id' => $data['income_category_id'],
                'payment_account_id' => $data['payment_account_id'],
                'amount' => $data['amount'],
                'date' => $data['date'] ?? now(),
                'description' => $data['description'] ?? null,
                'reference_no' => $data['reference_no'] ?? null,
                'created_by' => Auth::id() ?? 1,
            ]);

            $transaction = $this->recordTransaction(
                $income->payment_account_id,
                $income->amount,
                'IN',
                get_class($income),
                $income->id,
                $income->description ?? "Income recording",
                $income->date
            );

            $income->update(['payment_transaction_id' => $transaction->id]);

            return $income;
        });
    }

    /**
     * Record an expense and its associated transaction.
     */
    public function recordExpense(array $data)
    {
        return DB::transaction(function () use ($data) {
            $expense = Expense::create([
                'expense_category_id' => $data['expense_category_id'],
                'payment_account_id' => $data['payment_account_id'],
                'amount' => $data['amount'],
                'date' => $data['date'] ?? now(),
                'description' => $data['description'] ?? null,
                'reference_no' => $data['reference_no'] ?? null,
                'receipt_path' => $data['receipt_path'] ?? null,
                'created_by' => Auth::id() ?? 1,
            ]);

            $transaction = $this->recordTransaction(
                $expense->payment_account_id,
                $expense->amount,
                'OUT',
                get_class($expense),
                $expense->id,
                $expense->description ?? "Expense recording",
                $expense->date
            );

            $expense->update(['payment_transaction_id' => $transaction->id]);

            return $expense;
        });
    }

    /**
     * Record a financial transaction and update the account balance.
     */
    public function recordTransaction(
        int $paymentAccountId,
        float $amount,
        string $type, // IN or OUT
        string $referenceType,
        int $referenceId,
        string $description = '',
        ?string $date = null
    ) {
        return DB::transaction(function () use ($paymentAccountId, $amount, $type, $referenceType, $referenceId, $description, $date) {
            $account = PaymentAccount::lockForUpdate()->findOrFail($paymentAccountId);
            
            $balanceBefore = $account->balance;
            
            if ($type === 'IN') {
                $account->balance += $amount;
            } else {
                $account->balance -= $amount;
            }
            
            $balanceAfter = $account->balance;
            $account->save();
            
            return PaymentTransaction::create([
                'payment_account_id' => $paymentAccountId,
                'amount' => $amount,
                'type' => $type,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'description' => $description,
                'date' => $date ?? now(),
                'created_by' => Auth::id() ?? 1,
            ]);
        });
    }

    /**
     * Revert a transaction.
     */
    public function revertTransaction(int $transactionId)
    {
        return DB::transaction(function () use ($transactionId) {
            $transaction = PaymentTransaction::findOrFail($transactionId);
            $account = PaymentAccount::lockForUpdate()->findOrFail($transaction->payment_account_id);
            
            // Revert the balance
            if ($transaction->type === 'IN') {
                $account->balance -= $transaction->amount;
            } else {
                $account->balance += $transaction->amount;
            }
            
            $account->save();
            $transaction->delete();
            
            return true;
        });
    }
}
