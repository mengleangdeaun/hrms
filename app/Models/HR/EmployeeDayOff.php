<?php

namespace App\Models\HR;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeDayOff extends Model
{
    use HasUlids, BelongsToCompany, HasFactory;

    protected $fillable = [
        'employee_id',
        'days_off',
        'frequency',
        'weeks_of_month',
        'specific_dates',
        'effective_from',
        'effective_to',
        'assigned_by',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'days_off' => 'array',
        'weeks_of_month' => 'array',
        'specific_dates' => 'array',
        'effective_from' => 'date',
        'effective_to' => 'date',
        'is_active' => 'boolean',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class)->withoutGlobalScope('branch_isolation');
    }

    public function assignedByEmployee()
    {
        return $this->belongsTo(Employee::class, 'assigned_by')->withoutGlobalScope('branch_isolation');
    }

    /**
     * Scope: currently active assignments (today falls within effective range).
     */
    public function scopeActive($query, $date = null)
    {
        $date = $date ?? now()->toDateString();

        return $query->where('is_active', true)
            ->where('effective_from', '<=', $date)
            ->where(function ($q) use ($date) {
                $q->whereNull('effective_to')
                  ->orWhere('effective_to', '>=', $date);
            });
    }

    /**
     * Check if a specific day name (e.g. "Sunday") is a day off in this assignment.
     */
    public function isDayOff(string $dayName): bool
    {
        return in_array($dayName, $this->days_off ?? []);
    }

    /**
     * Check if a specific date is a day off based on frequency.
     */
    public function isDateADayOff($date): bool
    {
        $carbonDate = \Illuminate\Support\Carbon::parse($date);
        $dayName = $carbonDate->format('l');

        if ($this->frequency === 'weekly') {
            return $this->isDayOff($dayName);
        }

        if ($this->frequency === 'monthly') {
            if (!$this->isDayOff($dayName)) {
                return false;
            }

            $weekOfMonth = (int) ceil($carbonDate->day / 7);
            $weeks = $this->weeks_of_month ?? [];

            // Check if adding 7 days changes the month (meaning this is the "Last" occurrence)
            $isLastWeek = $carbonDate->copy()->addWeek()->month !== $carbonDate->month;

            if (in_array($weekOfMonth, $weeks)) {
                return true;
            }

            // '5' is used for "Last" week selection
            if (in_array(5, $weeks) && $isLastWeek) {
                return true;
            }

            return false;
        }

        if ($this->frequency === 'specific_dates') {
            return in_array($carbonDate->toDateString(), $this->specific_dates ?? []);
        }

        return false;
    }
}
