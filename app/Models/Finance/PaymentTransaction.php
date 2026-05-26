<?php

namespace App\Models\Finance;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Auth\User;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

class PaymentTransaction extends Model
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
        'payment_account_id',
        'amount',
        'type',
        'reference_type',
        'reference_id',
        'balance_before',
        'balance_after',
        'description',
        'date',
        'created_by',
    ];

    protected $appends = [
        'reference_no',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'date' => 'datetime',
    ];

    public function getReferenceNoAttribute()
    {
        if (!$this->reference) {
            return null;
        }

        // Check for reference_no field (Income, Expense)
        if (isset($this->reference->reference_no)) {
            return $this->reference->reference_no;
        }

        // Check for order reference (SalesOrderDeposit)
        if ($this->reference_type === \App\Models\Sales\SalesOrderDeposit::class) {
            return $this->reference->order ? $this->reference->order->order_no : null;
        }

        return null;
    }

    public function account()
    {
        return $this->belongsTo(PaymentAccount::class, 'payment_account_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reference()
    {
        return $this->morphTo();
    }
}
