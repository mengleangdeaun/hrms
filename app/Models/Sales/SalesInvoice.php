<?php

namespace App\Models\Sales;

use App\Models\Auth\User;
use App\Models\CRM\Customer;
use App\Models\HR\Branch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

use App\Traits\ScopesByBranch;

class SalesInvoice extends Model
{
    use SoftDeletes, ScopesByBranch;

    protected $fillable = [
        'ulid',
        'invoice_no',
        'sales_order_id',
        'customer_id',
        'branch_id',
        'invoice_date',
        'due_date',
        'subtotal',
        'tax_total',
        'discount_total',
        'grand_total',
        'paid_amount',
        'balance_amount',
        'status',
        'payment_status',
        'notes',
        'created_by'
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->ulid)) {
                $model->ulid = (string) Str::ulid();
            }
        });
    }

    public function order()
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
