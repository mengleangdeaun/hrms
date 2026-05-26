<?php

namespace App\Models\Attendance;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class AttendancePolicy extends Model
{
    use HasUlids, BelongsToCompany, HasFactory;

    protected $fillable = [
        'name',
        'late_tolerance_minutes',
        'early_departure_tolerance_minutes',
        'overtime_minimum_minutes',
        'status',
        'description',
    ];
}
