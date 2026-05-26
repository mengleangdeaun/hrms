<?php

namespace App\Models\Workshop;

use App\Models\Inventory\Product;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Traits\LogsSystemActivity;

class ServiceMaterial extends Model
{
    use HasFactory, LogsSystemActivity;

    protected $fillable = ['service_id', 'product_id', 'suggested_qty'];

    public function service()
    {
        return $this->belongsTo(\App\Models\Workshop\Service::class);
    }

    public function product()
    {
        return $this->belongsTo(\App\Models\Inventory\Product::class, 'product_id');
    }
}




