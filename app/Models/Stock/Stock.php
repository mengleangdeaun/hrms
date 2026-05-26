<?php

namespace App\Models\Stock;

use App\Models\Inventory\Product;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class Stock extends Model
{
    protected $table = 'inventory_stocks';

    use HasFactory, LogsSystemActivity;

    protected $fillable = ['product_id', 'location_id', 'quantity', 'last_updated'];

    protected $casts = [
        'quantity' => 'decimal:2',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }
}


