<?php

namespace App\Http\Controllers\EmployeeApp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\HR\Employee;
use App\Models\HR\Holiday;
use App\Models\Attendance\AttendanceRecord;
use App\Models\Leave\LeaveRequest;
use App\Services\AttendanceService;
use App\Models\AttendanceReasonPreset;
use Carbon\Carbon;

class EmployeeAppController extends Controller
{
    protected $attendanceService;

    public function __construct(AttendanceService $attendanceService)
    {
        $this->attendanceService = $attendanceService;
    }

    /**
     * Minimal identity check for background tasks (Echo init, etc)
     */
    public function me(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        return response()->json([
            'id' => $employee->id,
            'name' => $employee->full_name,
            'device_binding' => [
                'status' => $employee->device_binding_status,
                'bound_id' => $employee->device_id
            ]
        ]);
    }
    /**
     * Helper to authenticate the device token passively without Laravel Sanctum overhead for the minimal PWA.
     */
    private function getAuthenticatedEmployee(Request $request)
    {
        $token = $request->header('Authorization') ?? $request->bearerToken();
        if (!$token) return null;

        // The frontend will send the raw token or 'Bearer token'
        $token = str_replace('Bearer ', '', $token);
        
        return Employee::where('auth_token', $token)->first();
    }

    /**
     * Dashboard: Get today's attendance status and basic stats.
     */
    public function dashboard(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized Device'], 401);

        $today = Carbon::today();
        $today_str = $today->toDateString();
        $record = AttendanceRecord::where('employee_id', $employee->id)
                    ->whereDate('date', $today_str)
                    ->first();

        // Check for personal celebration
        $celebration = null;
        $dob = $employee->date_of_birth;
        $doj = $employee->date_of_joining;

        if ($dob && $dob->month === $today->month && $dob->day === $today->day) {
            $celebration = ['type' => 'birthday', 'milestone' => 'Birthday'];
        } elseif ($doj) {
            $isSameDay = $doj->day === $today->day;
            $diffInMonths = (int) $doj->diffInMonths($today);
            if ($isSameDay) {
                if ($diffInMonths === 3) {
                    $celebration = ['type' => 'anniversary', 'milestone' => '3 Months'];
                } elseif ($diffInMonths === 6) {
                    $celebration = ['type' => 'anniversary', 'milestone' => '6 Months'];
                } elseif ($diffInMonths > 0 && $diffInMonths % 12 === 0) {
                    $years = $diffInMonths / 12;
                    $celebration = ['type' => 'anniversary', 'milestone' => $years . ($years > 1 ? ' Years' : ' Year')];
                }
            }
        }

        // Calculate some basic stats (Optional, e.g. weekly hours)
        $startOfWeek = Carbon::now()->startOfWeek()->toDateString();
        $weeklyRecords = AttendanceRecord::where('employee_id', $employee->id)
                            ->whereBetween('date', [$startOfWeek, $today_str])
                            ->get();
        
        $daysPresentThisWeek = $weeklyRecords->count();

        // MERGED: Add Today's Shift/Policy Info (Proactive Validation)
        $policyInfo = $this->attendanceService->capturePolicySnapshot($employee, Carbon::now(), $record);
        $todayShiftMerged = [
            'server_time' => Carbon::now()->toDateTimeString(),
            'shift' => $policyInfo['shift_snapshot'],
            'policy' => [
                'late_tolerance' => $employee->attendancePolicy?->late_tolerance_minutes ?? 0,
                'early_tolerance' => $employee->attendancePolicy?->early_departure_tolerance_minutes ?? 0,
            ],
            'check_results' => $policyInfo['check_results'],
            'attendance_today' => $record ? [
                'in1' => $record->clock_in_time,
                'out1' => $record->session_1_out_time,
                'in2' => $record->session_2_in_time,
                'out2' => $record->clock_out_time,
                'status' => $record->status
            ] : null,
            'device_binding' => [
                'status' => $employee->device_binding_status,
                'bound_id' => $employee->device_id
            ],
            'reason_presets' => AttendanceReasonPreset::where('is_active', true)->orderBy('sort_order')->get(),
        ];

        return response()->json([
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->full_name ?? $employee->employee_id,
                'designation' => $employee->designation?->name ?? 'Staff',
                'branch' => $employee->branch?->name ?? 'HQ',
                'profile_image' => $employee->profile_image,
                'profile_image_url' => $employee->profile_image_url
            ],
            'today_status' => $record ? $record->status : 'Not Clocked In',
            'clock_in_time' => $record ? $record->clock_in_time : null,
            'session_1_out_time' => $record ? $record->session_1_out_time : null,
            'session_2_in_time' => $record ? $record->session_2_in_time : null,
            'clock_out_time' => $record ? $record->clock_out_time : null,
            'days_present_this_week' => $daysPresentThisWeek,
            'celebration' => $celebration,
            'shift_type' => $employee->workingShift?->shift_type ?? 'split',
            'today_shift' => $todayShiftMerged, // Added merged data
        ]);
    }

    /**
     * History: Get a paginated list of past attendance records for the timeline view.
     */
    public function history(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized Device'], 401);

        $records = AttendanceRecord::where('employee_id', $employee->id)
                    ->whereNotIn('status', ['Absent', 'On Leave'])
                    ->when($request->status, function ($query, $status) {
                        return $query->where('status', $status);
                    })
                    ->when($request->in_status, function ($query, $status) {
                        return $query->where('in_status', 'LIKE', "%{$status}%");
                    })
                    ->when($request->out_status, function ($query, $status) {
                        if ($status === 'Overtime') {
                            return $query->where(function($q) use ($status) {
                                $q->where('out_status', 'LIKE', "%{$status}%")
                                  ->orWhere('overtime_minutes', '>', 0);
                            });
                        }
                        return $query->where('out_status', 'LIKE', "%{$status}%");
                    })
                    ->when($request->date_from, function ($query, $from) {
                        return $query->whereDate('date', '>=', $from);
                    })
                    ->when($request->date_to, function ($query, $to) {
                        return $query->whereDate('date', '<=', $to);
                    })
                    ->orderBy('date', 'desc')
                    ->paginate($request->per_page ?? 15);

        return response()->json($records);
    }

    /**
     * Profile: Get read-only HR profile data for the settings tab.
     */
    public function profile(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized Device'], 401);

        $employee->load(['department', 'designation', 'branch', 'lineManager']);

        // Calculate working period
        $joinDate = $employee->date_of_joining ? Carbon::parse($employee->date_of_joining) : null;
        $workingPeriod = null;
        if ($joinDate) {
            $diff = $joinDate->diff(Carbon::now());
            $parts = [];
            if ($diff->y > 0) $parts[] = $diff->y . ' yr' . ($diff->y > 1 ? 's' : '');
            if ($diff->m > 0) $parts[] = $diff->m . ' mo' . ($diff->m > 1 ? 's' : '');
            $workingPeriod = implode(' ', $parts) ?: '< 1 month';
        }

        // Shift data removed as per UI standardization

        return response()->json([
            'employee_id'     => $employee->employee_id,
            'full_name'       => $employee->full_name,
            'gender'          => $employee->gender,
            'email'           => $employee->email,
            'phone'           => $employee->phone,
            'address'         => trim(implode(', ', array_filter([$employee->address_line_1, $employee->address_line_2]))),
            'date_of_birth'   => $employee->date_of_birth,
            'date_of_joining' => $employee->date_of_joining,
            'working_period'  => $workingPeriod,
            'department'      => $employee->department?->name ?? 'N/A',
            'designation'     => $employee->designation?->name ?? 'N/A',
            'branch'          => $employee->branch?->name ?? 'HQ',
            'line_manager'    => $employee->lineManager ? [
                'name'        => $employee->lineManager->full_name,
                'designation' => $employee->lineManager->designation?->name ?? 'Manager',
                'email'       => $employee->lineManager->email,
                'phone'       => $employee->lineManager->phone,
                'profile_image_url' => $employee->lineManager->profile_image_url,
            ] : null,
            'profile_image'   => $employee->profile_image,
            'profile_image_url' => $employee->profile_image_url,
        ]);
    }

    /**
     * Update profile avatar/picture.
     */

public function updateAvatar(Request $request)
{
    $employee = $this->getAuthenticatedEmployee($request);

    if (!$employee) {
        return response()->json([
            'message' => 'Unauthorized Device'
        ], 401);
    }

    $request->validate([
        'avatar' => 'required|image|max:10240'
    ]);

    // Delete old avatar if exists
    if ($employee->profile_image && Storage::disk('public')->exists($employee->profile_image)) {
        Storage::disk('public')->delete($employee->profile_image);
    }

    // Store new avatar
    $path = $request->file('avatar')->store('avatars', 'public');

    // Update database
    $employee->update([
        'profile_image' => $path
    ]);

    return response()->json([
        'message' => 'Profile picture updated',
        'profile_image' => $path,
    ]);
}

    /**
     * Get employee preferences (creates defaults if none exist).
     */
    public function getPreferences(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized Device'], 401);

        $prefs = \App\Models\System\EmpPreference::firstOrCreate(
            ['employee_id' => $employee->id],
            [
                'font_family' => 'Google Sans',
                'font_size' => 'medium',
                'color_theme' => 'red',
                'dark_mode' => false,
                'notifications_enabled' => true,
                'location_enabled' => true,
                'camera_enabled' => true,
                'locale' => 'en',
            ]
        );

        return response()->json($prefs);
    }

    /**
     * Update employee preferences.
     */
    public function updatePreferences(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized Device'], 401);

        $validated = $request->validate([
            'font_family'           => 'sometimes|string|max:50',
            'font_size'             => 'sometimes|in:small,medium,large',
            'color_theme'           => 'sometimes|string|max:30',
            'dark_mode'             => 'sometimes|boolean',
            'notifications_enabled' => 'sometimes|boolean',
            'location_enabled'      => 'sometimes|boolean',
            'camera_enabled'        => 'sometimes|boolean',
            'locale'                => 'sometimes|string|max:10',
        ]);

        $prefs = \App\Models\System\EmpPreference::updateOrCreate(
            ['employee_id' => $employee->id],
            $validated
        );

        return response()->json(['message' => 'Preferences saved', 'preferences' => $prefs]);
    }

    /**
     * Calendar: Get attendance, holidays, and leaves for a specific month.
     */
    public function calendarData(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized Device'], 401);

        $month = $request->get('month', Carbon::now()->month);
        $year = $request->get('year', Carbon::now()->year);

        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        // 1. Attendance Records
        $attendance = AttendanceRecord::where('employee_id', $employee->id)
                        ->whereBetween('date', [$startDate, $endDate])
                        ->get();

        // 2. Holidays (Applicable to employee's branch OR individually assigned)
        $branchId = $employee->branch_id;
        $holidays = Holiday::where(function($q) use ($branchId, $employee) {
                        $q->whereHas('branches', function($sq) use ($branchId) {
                            $sq->where('branches.id', $branchId);
                        })
                        ->orWhereHas('employees', function($sq) use ($employee) {
                            $sq->where('employees.id', $employee->id);
                        });
                    })
                    ->where(function($q) use ($startDate, $endDate) {
                        $q->whereBetween('start_date', [$startDate, $endDate])
                          ->orWhereBetween('end_date', [$startDate, $endDate])
                          ->orWhere(function($sq) use ($startDate, $endDate) {
                              $sq->where('start_date', '<=', $startDate)
                                 ->where('end_date', '>=', $endDate);
                          });
                    })
                    ->with('employees')
                    ->get()
                    ->map(function($holiday) use ($employee) {
                        $holiday->is_personal = $holiday->employees->contains($employee->id);
                        unset($holiday->employees); // Remove relation to keep response light
                        return $holiday;
                    });

        // 3. Leave Requests
        $leaves = LeaveRequest::where('employee_id', $employee->id)
                    ->whereIn('status', ['approved', 'pending'])
                    ->where(function($q) use ($startDate, $endDate) {
                        $q->whereBetween('start_date', [$startDate, $endDate])
                          ->orWhereBetween('end_date', [$startDate, $endDate]);
                    })
                    ->with('leaveType')
                    ->get();

        // 4. Day Off Assignments (Active)
        $dayOffs = $employee->dayOffs()
            ->where(function($q) use ($startDate, $endDate) {
                $q->whereBetween('effective_from', [$startDate, $endDate])
                  ->orWhere(function($sq) use ($startDate, $endDate) {
                      $sq->where('effective_from', '<=', $startDate)
                         ->where(function($ssq) use ($endDate) {
                             $ssq->whereNull('effective_to')
                                 ->orWhere('effective_to', '>=', $endDate);
                         });
                  });
            })
            ->where('is_active', true)
            ->get();

        // 5. Working Shift Info
        $employee->load('workingShift');

        return response()->json([
            'attendance' => $attendance,
            'holidays' => $holidays,
            'leaves' => $leaves,
            'day_offs' => $dayOffs,
            'working_days' => $employee->workingShift?->working_days ?? [],
            'working_shift' => $employee->workingShift
        ]);
    }
}


