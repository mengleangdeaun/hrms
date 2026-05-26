<?php

namespace App\Models\Stock;

use App\Models\Inventory\Product;
use App\Models\Inventory\ProductSerial;

use App\Models\Auth\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class StockMovement extends Model
{
    protected $table = 'inventory_stock_movements';

    use HasFactory, LogsSystemActivity;

    protected $fillable = [
        'product_id',
        'location_id',
        'serial_id',
        'user_id',
        'movement_type',
        'quantity',
        'previous_quantity',
        'current_quantity',
        'reference_type',
        'reference_id',
        'reason',
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'previous_quantity' => 'decimal:4',
        'current_quantity' => 'decimal:4',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\Auth\User::class);
    }

    public function reference()
    {
        return $this->morphTo();
    }

    public function serial()
    {
        return $this->belongsTo(ProductSerial::class, 'serial_id');
    }
}




