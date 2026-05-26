<?php

namespace App\Models\Procurement;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    protected $table = 'inventory_purchase_orders';

    use HasFactory, \App\Traits\LogsSystemActivity, \App\Traits\ScopesByBranch;

    protected $fillable = [
        'supplier_id', 'branch_id', 'po_number', 'order_date', 'expected_delivery_date', 'status', 'total_amount', 'note', 'created_by'
    ];

    protected $casts = [
        'order_date' => 'datetime',
        'expected_delivery_date' => 'date',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function branch()
    {
        return $this->belongsTo(\App\Models\HR\Branch::class, 'branch_id');
    }

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class, 'purchase_order_id');
    }

    public function creator()
    {
        return $this->belongsTo(\App\Models\Auth\User::class, 'created_by');
    }
}


