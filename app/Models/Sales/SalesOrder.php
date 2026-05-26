<?php

namespace App\Models\Sales;

use App\Models\HR\Branch;
use App\Models\Auth\User;
use App\Models\CRM\Customer;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

use App\Traits\ScopesByBranch;

class SalesOrder extends Model
{
    use HasFactory, SoftDeletes, \App\Traits\LogsSystemActivity, ScopesByBranch;

    protected $fillable = [
        'order_no',
        'customer_id',
        'branch_id',
        'vehicle_id',
        'order_date',
        'subtotal',
        'tax_total',
        'discount_total',
        'grand_total',
        'taxable_amount',
        'tax_percent',
        'discount_type',
        'discount_value',
        'paid_amount',
        'balance_amount',
        'invoice_image_path',
        'status',
        'payment_status',
        'notes',
        'sale_remark_id',
        'created_by',
        'exchange_rate',
        'subtotal_khr',
        'grand_total_khr',
    ];

    protected $appends = ['invoice_image_url'];

    public function getInvoiceImageUrlAttribute()
    {
        if (!$this->invoice_image_path) {
            return null;
        }

        if (filter_var($this->invoice_image_path, FILTER_VALIDATE_URL)) {
            return $this->invoice_image_path;
        }

        $path = $this->invoice_image_path;
        if (str_starts_with($path, '/storage/')) {
            $path = substr($path, 9);
        } elseif (str_starts_with($path, 'storage/')) {
            $path = substr($path, 8);
        }

        return \Illuminate\Support\Facades\Storage::disk('public')->url($path);
    }

    protected $casts = [
        'exchange_rate' => 'decimal:2',
        'subtotal_khr' => 'decimal:2',
        'grand_total_khr' => 'decimal:2',
        'order_date' => 'datetime',
    ];

    public function saleRemark()
    {
        return $this->belongsTo(\App\Models\Sales\SaleRemark::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(\App\Models\CRM\CustomerVehicle::class, 'vehicle_id');
    }

    public function items()
    {
        return $this->hasMany(\App\Models\Sales\SalesOrderItem::class);
    }

    public function jobCard()
    {
        return $this->hasOne(\App\Models\Workshop\JobCard::class);
    }

    public function invoice()
    {
        return $this->hasOne(SalesInvoice::class, 'sales_order_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function deposits()
    {
        return $this->hasMany(\App\Models\Sales\SalesOrderDeposit::class);
    }
}

