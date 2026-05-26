<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;
use App\Models\HR\Employee;
use App\Traits\LogsSystemActivity;

class AnnouncementView extends Model
{
    protected $fillable = [
        'announcement_id',
        'employee_id',
        'viewed_at',
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
    ];

    public function announcement()
    {
        return $this->belongsTo(\App\Models\System\Announcement::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}




