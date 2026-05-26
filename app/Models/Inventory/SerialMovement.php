<?php

namespace App\Models\Inventory;

use App\Models\Auth\User;

use App\Models\Stock\Location;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class SerialMovement extends Model
{
    protected $table = 'inventory_serial_movements';

    protected $fillable = [
        'serial_id',
        'product_id',
        'location_id',
        'user_id',
        'movement_type',
        'quantity',
        'width',
        'height',
        'previous_quantity',
        'current_quantity',
        'reference_type',
        'reference_id',
        'reason',
    ];

    public function serial()
    {
        return $this->belongsTo(ProductSerial::class, 'serial_id');
    }

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
}


