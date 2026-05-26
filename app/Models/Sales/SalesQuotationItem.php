<?php

namespace App\Models\Sales;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesQuotationItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_quotation_id',
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
    ];

    public function quotation()
    {
        return $this->belongsTo(SalesQuotation::class, 'sales_quotation_id');
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
