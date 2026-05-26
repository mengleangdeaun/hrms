<?php

namespace App\Models\HR;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class Termination extends Model
{
    use HasUlids, BelongsToCompany, HasFactory, LogsSystemActivity;

    protected $fillable = [
        'employee_id',
        'termination_type',
        'notice_date',
        'termination_date',
        'notice_period',
        'reason',
        'description',
        'document',
        'status',
        'exit_interview_conducted',
        'exit_interview_date',
        'exit_feedback',
    ];

    protected $casts = [
        'exit_interview_conducted' => 'boolean',
        'notice_date'              => 'date',
        'termination_date'         => 'date',
        'exit_interview_date'      => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
