<?php

namespace App\Models\Attendance;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class WorkingShift extends Model
{
    use HasUlids, BelongsToCompany, HasFactory;

    protected $fillable = [
        'name',
        'shift_type',
        'working_days',
        'status',
        'description',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'working_days' => 'array',
        ];
    }
}
