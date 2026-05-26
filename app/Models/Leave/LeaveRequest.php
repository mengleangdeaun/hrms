<?php

namespace App\Models\Leave;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use App\Models\HR\Employee;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class LeaveRequest extends Model
{
    use HasUlids, BelongsToCompany, HasFactory;

    protected $fillable = [
        'employee_id',
        'leave_type_id',
        'duration_type',
        'start_date',
        'end_date',
        'start_time',
        'end_time',
        'total_days',
        'reason',
        'status',
        'approved_by',
        'rejection_reason',
        'attachments',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'total_days' => 'decimal:2',
        'attachments' => 'array',
        'actioned_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(\App\Models\HR\Employee::class)->withoutGlobalScope('branch_isolation');
    }

    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function approver()
    {
        return $this->belongsTo(\App\Models\HR\Employee::class, 'approved_by')->withoutGlobalScope('branch_isolation');
    }

    /**
     * Ensure attachments always return absolute URLs for the PWA.
     */
    public function getAttachmentsAttribute($value)
    {
        if (!$value) return [];
        
        $attachments = is_array($value) ? $value : json_decode($value, true);
        
        if (!is_array($attachments)) return [];

        return collect($attachments)->map(function ($path) {
            if (str_starts_with($path, 'http')) return $path;
            return url($path);
        })->all();
    }
}


