<?php

namespace App\Models\Procurement;

use App\Models\Inventory\Product;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class PurchaseReceiveItem extends Model
{
    protected $table = 'inventory_purchase_receive_items';

    use HasFactory;

    protected $fillable = [
        'purchase_receive_id', 'purchase_order_item_id', 'product_id', 'qty_received'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function poItem()
    {
        return $this->belongsTo(PurchaseOrderItem::class, 'purchase_order_item_id');
    }
}


