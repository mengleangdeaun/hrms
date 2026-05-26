<?php

namespace App\Models\Finance;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Auth\User;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

class Expense extends Model
{
    use HasFactory, HasUlids;

    public function getRouteKeyName()
    {
        return 'ulid';
    }

    public function uniqueIds(): array
    {
        return ['ulid'];
    }

    protected $fillable = [
        'expense_category_id',
        'payment_account_id',
        'amount',
        'date',
        'description',
        'reference_no',
        'receipt_path',
        'payment_transaction_id',
        'created_by'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date' => 'datetime',
    ];

    public function category()
    {
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
    }

    public function account()
    {
        return $this->belongsTo(PaymentAccount::class, 'payment_account_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function transaction()
    {
        return $this->belongsTo(PaymentTransaction::class, 'payment_transaction_id');
    }
}
