<?php

namespace App\Models\Stock;

use App\Models\Inventory\Product;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class StockTransferItem extends Model
{
    protected $table = 'inventory_stock_transfer_items';

    use HasFactory;

    protected $fillable = [
        'transfer_id',
        'product_id',
        'quantity',
    ];

    public function transfer()
    {
        return $this->belongsTo(StockTransfer::class, 'transfer_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}


