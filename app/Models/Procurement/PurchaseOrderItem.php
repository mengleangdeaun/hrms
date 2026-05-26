<?php

namespace App\Models\Procurement;

use App\Models\Inventory\Product;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class PurchaseOrderItem extends Model
{
    protected $table = 'inventory_purchase_order_items';

    use HasFactory;

    protected $fillable = [
        'purchase_order_id', 'product_id', 'order_qty', 'unit_cost', 'total_cost', 'received_qty'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }}



