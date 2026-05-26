<?php

namespace App\Models\Sales;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class SalesOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_order_id',
        'itemable_id',
        'itemable_type',
        'product_id',
        'job_part_id',
        'item_name',
        'description',
        'quantity',
        'unit_price',
        'discount_amount',
        'tax_amount',
        'subtotal',
        'original_item_id',
        'damage_type_id'
    ];

    public function order()
    {
        return $this->belongsTo(\App\Models\Sales\SalesOrder::class, 'sales_order_id');
    }

    public function itemable()
    {
        return $this->morphTo();
    }

    public function product()
    {
        return $this->belongsTo(\App\Models\Inventory\Product::class, 'product_id');
    }

    public function jobPart()
    {
        return $this->belongsTo(\App\Models\Workshop\JobPartMaster::class, 'job_part_id');
    }
}

