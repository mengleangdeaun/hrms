<?php

namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\CRM\Customer;
use App\Models\CRM\CustomerVehicle;
use App\Models\HR\Branch;
use App\Models\Workshop\Service;

use App\Traits\ScopesByBranch;

class Booking extends Model
{
    use HasFactory, SoftDeletes, ScopesByBranch;

    protected $fillable = [
        'booking_number',
        'customer_id',
        'branch_id',
        'service_id',
        'customer_vehicle_id',
        'new_vehicle_info',
        'booking_date',
        'booking_time',
        'status',
        'notes',
        'internal_notes'
    ];

    protected $casts = [
        'new_vehicle_info' => 'array',
        'booking_date' => 'date',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function service()
    {
        return $this->belongsTo(\App\Models\Workshop\Service::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(\App\Models\CRM\CustomerVehicle::class, 'customer_vehicle_id');
    }
}
