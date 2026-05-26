<?php

namespace App\Models\System;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Model;
use App\Models\HR\Employee;
use App\Traits\LogsSystemActivity;

class EmpPreference extends Model
{
    protected $table = 'emp_preferences';

    protected $fillable = [
        'employee_id',
        'font_family',
        'font_size',
        'color_theme',
        'dark_mode',
        'notifications_enabled',
        'location_enabled',
        'camera_enabled',
        'locale',
    ];

    protected $casts = [
        'dark_mode' => 'boolean',
        'notifications_enabled' => 'boolean',
        'location_enabled' => 'boolean',
        'camera_enabled' => 'boolean',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}



