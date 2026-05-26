<?php

namespace App\Models\HR;

use App\Models\Attendance\AttendancePolicy;
use App\Models\Attendance\AttendanceRecord;
use App\Models\Attendance\WorkingShift;
use App\Models\Auth\User;
use App\Models\Leave\LeaveRequest;
use App\Traits\LogsSystemActivity;
use App\Traits\ScopesByBranch;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;
use NotificationChannels\WebPush\HasPushSubscriptions;

class Employee extends Authenticatable
{
    use HasApiTokens, HasFactory, HasPushSubscriptions, HasUlids, LogsSystemActivity, Notifiable, ScopesByBranch, SoftDeletes;

    /**
     * The channels the user receives notification broadcasts on.
     */
    public function receivesBroadcastNotificationsOn(): string
    {
        return 'App.Models.HR.Employee.'.$this->id;
    }

    protected $keyType = 'int';

    public $incrementing = true;

    public function getRouteKeyName()
    {
        return 'ulid';
    }

    public function uniqueIds(): array
    {
        return ['ulid'];
    }

    protected $fillable = [
        // Basic Information
        'full_name',
        'employee_id',
        'employee_code',
        'email',
        'auth_token',
        'device_id',
        'device_binding_status',
        'telegram_user_id',
        'password',
        'phone',
        'date_of_birth',
        'gender',
        'profile_image',
        // Employment Details
        'branch_id',
        'department_id',
        'designation_id',
        'line_manager_id',
        'date_of_joining',
        'employment_type',
        'is_active',
        'hide_celebration',
        'working_shift_id',
        'attendance_policy_id',
        // Contact Information
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'country',
        'postal_code',
        'emergency_contact_name',
        'emergency_contact_relationship',
        'emergency_contact_phone',
        // Banking Information
        'bank_name',
        'account_holder_name',
        'account_number',
        'tax_payer_id',
        'base_salary',
        'is_technician',
        'is_qc_person',
        'preferences',
    ];

    protected $appends = [
        'profile_image_url',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'date_of_joining' => 'date',
        'base_salary' => 'decimal:2',
        'is_technician' => 'boolean',
        'is_qc_person' => 'boolean',
        'is_active' => 'boolean',
        'hide_celebration' => 'boolean',
        'preferences' => 'array',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function designation()
    {
        return $this->belongsTo(Designation::class);
    }

    public function lineManager()
    {
        return $this->belongsTo(Employee::class, 'line_manager_id')->withoutGlobalScope('branch_isolation');
    }

    public function subordinates()
    {
        return $this->hasMany(Employee::class, 'line_manager_id');
    }

    public function documents()
    {
        return $this->hasMany(EmployeeDocument::class);
    }

    public function workingShift()
    {
        return $this->belongsTo(WorkingShift::class);
    }

    public function attendancePolicy()
    {
        return $this->belongsTo(AttendancePolicy::class);
    }

    public function awards()
    {
        return $this->hasMany(Award::class);
    }

    public function promotions()
    {
        return $this->hasMany(Promotion::class);
    }

    public function resignations()
    {
        return $this->hasMany(Resignation::class);
    }

    public function terminations()
    {
        return $this->hasMany(Termination::class);
    }

    public function warnings()
    {
        return $this->hasMany(Warning::class);
    }

    public function attendanceRecords()
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function activities()
    {
        return $this->hasMany(EmployeeActivity::class);
    }

    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function getProfileImageUrlAttribute()
    {
        if (! $this->profile_image) {
            return null;
        }
        if (filter_var($this->profile_image, FILTER_VALIDATE_URL)) {
            return $this->profile_image;
        }
        return Storage::url($this->profile_image);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'email', 'email');
    }

    public function getNameAttribute()
    {
        return $this->full_name;
    }

    // ── Day Off Management ──────────────────────────────────────────

    public function dayOffs()
    {
        return $this->hasMany(EmployeeDayOff::class);
    }

    public function dayOffRequests()
    {
        return $this->hasMany(DayOffRequest::class);
    }

    /**
     * Get the employee's currently active day-off assignment.
     * Priority: per-employee override → shift working_days fallback.
     *
     * @param string|null $date  Date to check against (default: today)
     * @return EmployeeDayOff|null
     */
    public function getActiveDayOffAssignment(?string $date = null): ?EmployeeDayOff
    {
        $date = $date ?? now()->toDateString();

        return $this->dayOffs()
            ->active($date)
            ->orderByDesc('created_at')
            ->first();
    }

    /**
     * Get the names of days off for a specific date (legacy support/weekly view).
     */
    public function getActiveDaysOff(?string $date = null): array
    {
        $assignment = $this->getActiveDayOffAssignment($date);

        if ($assignment) {
            return $assignment->days_off ?? [];
        }

        // 2. Fallback to working shift non-working days
        $shift = $this->workingShift;
        if ($shift && $shift->working_days) {
            $daysOff = [];
            foreach ($shift->working_days as $dayName => $config) {
                if (is_array($config) && empty($config['is_working'])) {
                    $daysOff[] = $dayName;
                }
            }
            return $daysOff;
        }

        return [];
    }

    /**
     * Check if a given date is a day off for this employee.
     */
    public function isDayOff(string $date): bool
    {
        $assignment = $this->getActiveDayOffAssignment($date);

        if ($assignment) {
            return $assignment->isDateADayOff($date);
        }

        // Fallback to shift-based check
        $dayName = \Illuminate\Support\Carbon::parse($date)->format('l');
        return in_array($dayName, $this->getActiveDaysOff($date));
    }
}
