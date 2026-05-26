<?php

namespace App\Models\Leave;

use App\Models\HR\Employee;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class EmployeeLeaveAllocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'leave_policy_id',
        'effective_date',
        'expiration_date',
        'is_active',
        'approved_by',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'expiration_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function employee()
    {
        return $this->belongsTo(\App\Models\HR\Employee::class);
    }

    public function leavePolicy()
    {
        return $this->belongsTo(LeavePolicy::class);
    }

    public function approver()
    {
        return $this->belongsTo(\App\Models\HR\Employee::class, 'approved_by')->withoutGlobalScope('branch_isolation');
    }
}


