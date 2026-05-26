<?php

namespace App\Models\Stock;

use App\Models\Auth\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class StockAdjustment extends Model
{
    protected $table = 'inventory_stock_adjustments';

    use HasFactory, LogsSystemActivity;

    protected $fillable = [
        'adjustment_no',
        'date',
        'user_id',
        'notes',
        'status',
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

    public function items()
    {
        return $this->hasMany(StockAdjustmentItem::class, 'adjustment_id');
    }
}




