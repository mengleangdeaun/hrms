<?php

namespace App\Models\Sales;

use App\Models\Auth\User;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class SalesOrderDeposit extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_order_id',
        'amount',
        'payment_account_id',
        'receipt_path',
        'deposit_date',
        'notes',
        'created_by',
        'payment_transaction_id'
    ];

    protected $appends = ['receipt_url'];

    public function getReceiptUrlAttribute()
    {
        if (!$this->receipt_path) {
            return null;
        }

        if (filter_var($this->receipt_path, FILTER_VALIDATE_URL)) {
            return $this->receipt_path;
        }

        // Handle legacy paths that might have /storage/ hardcoded
        $path = $this->receipt_path;
        if (str_starts_with($path, '/storage/')) {
            $path = substr($path, 9);
        } elseif (str_starts_with($path, 'storage/')) {
            $path = substr($path, 8);
        }

        return \Illuminate\Support\Facades\Storage::disk('public')->url($path);
    }

    public function paymentAccount()
    {
        return $this->belongsTo(\App\Models\Finance\PaymentAccount::class, 'payment_account_id');
    }

    public function creator()
    {
        return $this->belongsTo(\App\Models\Auth\User::class, 'created_by');
    }

    public function order()
    {
        return $this->belongsTo(\App\Models\Sales\SalesOrder::class, 'sales_order_id');
    }
}


