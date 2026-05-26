<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SalaryMovement extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_id',
        'previous_salary',
        'new_salary',
        'increment_amount',
        'effective_date',
        'type',
        'source_id',
        'source_type',
        'reason',
        'status',
        'is_applied',
    ];

    protected $casts = [
        'previous_salary' => 'decimal:2',
        'new_salary' => 'decimal:2',
        'increment_amount' => 'decimal:2',
        'effective_date' => 'date',
        'is_applied' => 'boolean',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the parent source model (e.g. Promotion).
     */
    public function source()
    {
        return $this->morphTo();
    }
}
