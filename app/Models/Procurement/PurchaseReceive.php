<?php

namespace App\Models\Procurement;

use App\Models\Stock\Location;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class PurchaseReceive extends Model
{
    protected $table = 'inventory_purchase_receives';

    use HasFactory;

    protected $fillable = [
        'purchase_order_id', 'location_id', 'receive_number', 'receive_date', 'reference_number', 'receiving_note', 'status', 'created_by'
    ];

    protected $casts = [
        'receive_date' => 'datetime',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }

    public function location()
    {
        return $this->belongsTo(Location::class, 'location_id');
    }

    public function items()
    {
        return $this->hasMany(PurchaseReceiveItem::class, 'purchase_receive_id');
    }

    public function creator()
    {
        return $this->belongsTo(\App\Models\Auth\User::class, 'created_by');
    }
}


