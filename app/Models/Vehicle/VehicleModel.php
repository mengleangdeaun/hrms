<?php

namespace App\Models\Vehicle;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class VehicleModel extends Model
{
    use HasFactory;

    protected $fillable = ['brand_id', 'name', 'segment', 'is_active'];

    public function brand()
    {
        return $this->belongsTo(\App\Models\Vehicle\VehicleBrand::class, 'brand_id');
    }
}



