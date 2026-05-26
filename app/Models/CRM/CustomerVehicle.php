<?php

namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\LogsSystemActivity;
use App\Models\Vehicle\VehicleBrand;
use App\Models\Vehicle\VehicleModel;
use App\Models\CRM\Customer;

class CustomerVehicle extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'customer_id',
        'brand_id',
        'model_id',
        'plate_number',
        'vin_last_4',
        'color',
        'year',
        'current_mileage',
        'notes'
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function brand()
    {
        return $this->belongsTo(VehicleBrand::class, 'brand_id');
    }

    public function model()
    {
        return $this->belongsTo(VehicleModel::class, 'model_id');
    }

    public function setCurrentMileageAttribute($value)
    {
        $this->attributes['current_mileage'] = $value ?? 0;
    }
}

