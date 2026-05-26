<?php

namespace App\Models\Workshop;

use App\Models\HR\Employee;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class JobCardItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_card_id',
        'service_id',
        'part_id',
        'technician_id',
        'status',
        'completion_percentage',
        'started_at',
        'completed_at',
        'notes'
    ];

    protected $casts = [
        'completion_percentage' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function jobCard()
    {
        return $this->belongsTo(\App\Models\Workshop\JobCard::class);
    }

    public function service()
    {
        return $this->belongsTo(\App\Models\Workshop\Service::class);
    }

    public function part()
    {
        return $this->belongsTo(\App\Models\Workshop\JobPartMaster::class, 'part_id');
    }

    public function technician()
    {
        return $this->belongsTo(\App\Models\HR\Employee::class, 'technician_id');
    }

    public function materialUsage()
    {
        return $this->hasMany(\App\Models\Workshop\JobCardMaterialUsage::class, 'job_card_item_id');
    }

    public function technicians()
    {
        return $this->belongsToMany(\App\Models\HR\Employee::class, 'job_card_item_technician', 'job_card_item_id', 'employee_id')
                    ->withTimestamps();
    }
}



