<?php

namespace App\Models\Sales;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\LogsSystemActivity;

class SaleRemark extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'color_code',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function salesOrders()
    {
        return $this->hasMany(\App\Models\Sales\SalesOrder::class);
    }
}

