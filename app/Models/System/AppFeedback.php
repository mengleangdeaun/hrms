<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;

class AppFeedback extends Model
{
    protected $table = 'app_feedbacks';

    protected $fillable = [
        'employee_id',
        'message',
        'device_info',
        'status',
    ];

    protected $casts = [
        'device_info' => 'array',
    ];

    public function employee()
    {
        return $this->belongsTo(\App\Models\HR\Employee::class);
    }
}
