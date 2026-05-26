<?php

namespace App\Models\Attendance;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\HR\Employee;
use App\Models\HR\Branch;
use App\Traits\LogsSystemActivity;

class AttendanceRecord extends Model
{
    use HasUlids, BelongsToCompany, HasFactory;

    protected $fillable = [
        'employee_id',
        'branch_id',
        'date',
        'clock_in_time',
        'session_1_out_time',
        'session_2_in_time',
        'clock_out_time',
        'clock_in_location',
        'session_1_out_location',
        'session_2_in_location',
        'clock_out_location',
        'in_status',
        'out_status',
        'status',
        'early_minutes',
        'late_minutes',
        'warning_minutes',
        'early_departure_minutes',
        'overtime_minutes',
        'stay_late_minutes',
        'total_hours',
        'late_reason',
        'early_departure_reason',
        'shift_config_snapshot',
        'policy_config_snapshot',
    ];

    protected $casts = [
        'date' => 'date',
        'clock_in_time' => 'datetime',
        'session_1_out_time' => 'datetime',
        'session_2_in_time' => 'datetime',
        'clock_out_time' => 'datetime',
        'early_minutes' => 'integer',
        'late_minutes' => 'integer',
        'warning_minutes' => 'integer',
        'early_departure_minutes' => 'integer',
        'overtime_minutes' => 'integer',
        'stay_late_minutes' => 'integer',
        'shift_config_snapshot' => 'array',
        'policy_config_snapshot' => 'array',
    ];


    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
