<?php

namespace App\Models\Leave;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\HR\Employee;
use App\Traits\LogsSystemActivity;

class LeaveBalance extends Model
{
    use HasUlids, BelongsToCompany, HasFactory;

    protected $fillable = [
        'employee_id',
        'leave_type_id',
        'total_accrued',
        'total_taken',
        'balance',
        'year',
    ];

    protected $casts = [
        'total_accrued' => 'decimal:2',
        'total_taken' => 'decimal:2',
        'balance' => 'decimal:2',
        'year' => 'integer',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class);
    }
}


