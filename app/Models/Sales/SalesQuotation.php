<?php

namespace App\Models\Sales;

use App\Models\HR\Branch;
use App\Models\Auth\User;
use App\Models\CRM\Customer;
use App\Models\CRM\CustomerVehicle;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

use App\Traits\ScopesByBranch;

class SalesQuotation extends Model
{
    use HasFactory, SoftDeletes, \App\Traits\LogsSystemActivity, ScopesByBranch;

    protected $fillable = [
        'ulid',
        'quotation_no',
        'customer_id',
        'branch_id',
        'vehicle_id',
        'quotation_date',
        'expiry_date',
        'subtotal',
        'subtotal_khr',
        'tax_total',
        'discount_total',
        'grand_total',
        'grand_total_khr',
        'exchange_rate',
        'status',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'quotation_date' => 'date',
        'expiry_date' => 'date',
        'subtotal' => 'decimal:2',
        'subtotal_khr' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'grand_total_khr' => 'decimal:2',
        'exchange_rate' => 'decimal:2',
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
        return $this->belongsTo(CustomerVehicle::class, 'vehicle_id');
    }

    public function items()
    {
        return $this->hasMany(SalesQuotationItem::class, 'sales_quotation_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
