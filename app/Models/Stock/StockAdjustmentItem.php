<?php

namespace App\Models\Stock;

use App\Models\Inventory\Product;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class StockAdjustmentItem extends Model
{
    protected $table = 'inventory_stock_adjustment_items';

    use HasFactory;

    protected $fillable = [
        'adjustment_id',
        'product_id',
        'location_id',
        'serial_id',
        'current_qty',
        'adjustment_qty',
        'new_qty',
        'reason',
    ];

    public function adjustment()
    {
        return $this->belongsTo(StockAdjustment::class, 'adjustment_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function location()
    {
        return $this->belongsTo(Location::class, 'location_id');
    }

    public function serial()
    {
        return $this->belongsTo(\App\Models\Inventory\ProductSerial::class, 'serial_id');
    }
}


