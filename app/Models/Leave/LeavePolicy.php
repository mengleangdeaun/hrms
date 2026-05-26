<?php

namespace App\Models\Leave;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\LogsSystemActivity;

class LeavePolicy extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'leave_type_id',
        'accrual_type',
        'accrual_rate',
        'carry_forward_limit',
        'min_days_per_app',
        'max_days_per_app',
        'allow_half_day',
        'allow_hourly',
        'require_approval',
        'status',
    ];

    protected $casts = [
        'accrual_rate' => 'decimal:2',
        'carry_forward_limit' => 'integer',
        'min_days_per_app' => 'integer',
        'max_days_per_app' => 'integer',
        'allow_half_day' => 'boolean',
        'allow_hourly' => 'boolean',
        'require_approval' => 'boolean',
        'status' => 'boolean',
    ];

    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class);
    }
}


