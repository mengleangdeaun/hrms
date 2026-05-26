<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DayOffRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'request_type',
        'current_days_off',
        'requested_days_off',
        'frequency',
        'weeks_of_month',
        'specific_dates',
        'effective_from',
        'effective_to',
        'reason',
        'status',
        'approved_by',
        'rejection_reason',
    ];

    protected $casts = [
        'current_days_off' => 'array',
        'requested_days_off' => 'array',
        'weeks_of_month' => 'array',
        'specific_dates' => 'array',
        'effective_from' => 'date',
        'effective_to' => 'date',
        'actioned_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class)->withoutGlobalScope('branch_isolation');
    }

    public function approver()
    {
        return $this->belongsTo(Employee::class, 'approved_by')->withoutGlobalScope('branch_isolation');
    }
}
