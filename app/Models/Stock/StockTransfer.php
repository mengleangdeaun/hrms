<?php

namespace App\Models\Stock;

use App\Models\Auth\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class StockTransfer extends Model
{
    protected $table = 'inventory_stock_transfers';

    use HasFactory, LogsSystemActivity;

    protected $fillable = [
        'transfer_no',
        'from_location_id',
        'to_location_id',
        'date',
        'status',
        'notes',
        'user_id',
        'approved_by_id',
        'approved_at',
        'rejected_by_id',
        'rejected_at',
        'rejected_reason',
    ];

    protected $casts = [
        'date' => 'date',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\Auth\User::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(\App\Models\Auth\User::class, 'approved_by_id');
    }

    public function rejectedBy()
    {
        return $this->belongsTo(\App\Models\Auth\User::class, 'rejected_by_id');
    }

    public function fromLocation()
    {
        return $this->belongsTo(Location::class, 'from_location_id');
    }

    public function toLocation()
    {
        return $this->belongsTo(Location::class, 'to_location_id');
    }

    public function items()
    {
        return $this->hasMany(StockTransferItem::class, 'transfer_id');
    }
}




