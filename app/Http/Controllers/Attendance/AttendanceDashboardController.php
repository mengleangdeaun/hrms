<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Models\Attendance\AttendanceRecord;
use App\Models\HR\Employee;
use App\Models\HR\Holiday;
use App\Models\Leave\LeaveRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AttendanceDashboardController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::today();
        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::today();
        $branchId = $request->branch_id;
        
        $queryStart = $startDate->copy()->startOfDay()->format('Y-m-d');
        $queryEnd = $endDate->copy()->endOfDay()->format('Y-m-d');

        // Enterprise Caching: Keyed by date range and branch filter
        $cacheKey = 'attendance_dashboard_' . $queryStart . '_' . $queryEnd . ($branchId ? '_b' . $branchId : '');
        
        return \Illuminate\Support\Facades\Cache::remember($cacheKey, 0, function() use ($startDate, $endDate, $queryStart, $queryEnd, $branchId) {
            $allEmployees = Employee::with(['workingShift:id,name,working_days', 'dayOffs' => fn($q) => $q->active($queryStart)])
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->select('id', 'full_name', 'employee_id', 'shift', 'branch_id')
                ->get();
            $totalEmployees = $allEmployees->count();
            
            // 1. Core Statistics
            $presentEmployeesCount = Employee::when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->whereHas('attendanceRecords', function ($query) use ($queryStart, $queryEnd) {
                    $query->whereBetween('date', [$queryStart, $queryEnd]);
                })->count();

            // On Leave = Approved Leave but NOT Present
            $leaveCount = Employee::when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->whereHas('leaveRequests', function ($query) use ($startDate, $endDate) {
                    $query->where('status', 'approved')
                        ->where(function ($q) use ($startDate, $endDate) {
                            $q->whereBetween('start_date', [$startDate, $endDate])
                                ->orWhereBetween('end_date', [$startDate, $endDate])
                                ->orWhere(function ($sq) use ($startDate, $endDate) {
                                    $sq->where('start_date', '<=', $startDate)
                                        ->where('end_date', '>=', $endDate);
                                });
                        });
                })
                ->whereDoesntHave('attendanceRecords', function ($query) use ($queryStart, $queryEnd) {
                    $query->whereBetween('date', [$queryStart, $queryEnd]);
                })
                ->count();

            $isOnHoliday = Holiday::where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('start_date', [$startDate, $endDate])
                    ->orWhereBetween('end_date', [$startDate, $endDate]);
            })
            ->when($branchId, function($q) use ($branchId) {
                $q->where(function($sq) use ($branchId) {
                    $sq->whereDoesntHave('branches')
                      ->orWhereHas('branches', fn($bq) => $bq->where('branches.id', $branchId));
                });
            })
            ->exists();

            // Day Off = employees whose shift/custom assignment says "not working" on this date
            $presentIds = AttendanceRecord::when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->whereBetween('date', [$queryStart, $queryEnd])->distinct()->pluck('employee_id');
            
            $leaveIds = LeaveRequest::where('status', 'approved')
                ->whereHas('employee', function($q) use ($branchId) {
                    $q->when($branchId, fn($sq) => $sq->where('branch_id', $branchId));
                })
                ->where(function ($q) use ($startDate, $endDate) {
                    $q->whereBetween('start_date', [$startDate, $endDate])
                        ->orWhereBetween('end_date', [$startDate, $endDate])
                        ->orWhere(function ($sq) use ($startDate, $endDate) {
                            $sq->where('start_date', '<=', $startDate)->where('end_date', '>=', $endDate);
                        });
                })->pluck('employee_id');
            $accountedIds = $presentIds->merge($leaveIds)->unique();

            $dayOffCount = 0;
            foreach ($allEmployees->whereNotIn('id', $accountedIds->toArray()) as $emp) {
                if ($emp->isDayOff($queryStart)) {
                    $dayOffCount++;
                }
            }

            $absentCount = max(0, $totalEmployees - $presentEmployeesCount - $leaveCount - $dayOffCount - ($isOnHoliday ? $totalEmployees : 0));

            // 2. Trend Data (Last 14 days)
            $trendData = AttendanceRecord::when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->whereDate('date', '>=', Carbon::today()->subDays(13)->format('Y-m-d'))
                ->select('date', DB::raw('count(distinct employee_id) as count'))
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->map(fn($item) => [
                    'date' => Carbon::parse($item->date)->format('M d'),
                    'count' => (int) $item->count
                ]);

            // 3. Department Breakdown
            $departmentStats = Employee::when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->whereHas('attendanceRecords', fn($q) => $q->whereBetween('date', [$queryStart, $queryEnd]))
                ->join('departments', 'employees.department_id', '=', 'departments.id')
                ->select('departments.name', DB::raw('count(distinct employees.id) as count'))
                ->groupBy('departments.name')
                ->get();

            // 4. Specialized Leaderboards (Top 5 for 6 categories)
            $baseLeaderboard = AttendanceRecord::when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->whereBetween('date', [$queryStart, $queryEnd])
                ->select('employee_id', 
                    DB::raw('count(*) as present_days'),
                    DB::raw('sum(coalesce(late_minutes, 0)) as late'),
                    DB::raw('sum(coalesce(early_minutes, 0)) as early_arrival'),
                    DB::raw('sum(coalesce(early_departure_minutes, 0)) as early_departure'),
                    DB::raw('sum(coalesce(stay_late_minutes, 0)) as stay_late'),
                    DB::raw('sum(coalesce(overtime_minutes, 0)) as overtime')
                )
                ->groupBy('employee_id')
                ->with('employee:id,full_name,employee_id,profile_image');

            $getLeaderboard = function($query, $expression) {
                return $query->clone()
                    ->addSelect(DB::raw("($expression) as score"))
                    ->having('score', '>', 0)
                    ->orderBy('score', 'desc')
                    ->limit(5)
                    ->get()
                    ->map(fn($record) => [
                        'employee_id' => $record->employee_id,
                        'score' => (float) $record->score,
                        'present_days' => (int) ($record->present_days ?? 0),
                        'employee' => $record->employee ? [
                            'id' => $record->employee->id,
                            'full_name' => $record->employee->full_name,
                            'employee_id' => $record->employee->employee_id,
                            'profile_image' => $record->employee->profile_image,
                            'profile_image_url' => $record->employee->profile_image_url ?: ($record->employee->profile_image ? asset('storage/' . $record->employee->profile_image) : null),
                        ] : null
                    ]);
            };

            // 5. Heatmaps
            $heatmapCheckin = AttendanceRecord::when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->whereBetween('date', [$queryStart, $queryEnd])
                ->select(DB::raw('DAYNAME(date) as day_name'), DB::raw('HOUR(clock_in_time) as hour'), DB::raw('count(*) as count'))
                ->groupBy('day_name', 'hour')->get();

            $heatmapCheckout = AttendanceRecord::when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->whereBetween('date', [$queryStart, $queryEnd])->whereNotNull('clock_out_time')
                ->select(DB::raw('DAYNAME(date) as day_name'), DB::raw('HOUR(clock_out_time) as hour'), DB::raw('count(*) as count'))
                ->groupBy('day_name', 'hour')->get();

            $inStatuses = AttendanceRecord::when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->whereBetween('date', [$queryStart, $queryEnd])
                ->whereNotNull('in_status')
                ->select('in_status as status', DB::raw('DAYNAME(date) as day_name'), DB::raw('count(*) as count'))
                ->groupBy('in_status', 'day_name');

            $outStatuses = AttendanceRecord::when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->whereBetween('date', [$queryStart, $queryEnd])
                ->whereNotNull('out_status')
                ->select('out_status as status', DB::raw('DAYNAME(date) as day_name'), DB::raw('count(*) as count'))
                ->groupBy('out_status', 'day_name');

            $statusHeatmap = $inStatuses->unionAll($outStatuses)->get();

            // 6. Special 'Absent' & 'Day Off' Calculation for Heatmap timeline
            $absentData = [];
            $currentDate = $startDate->copy();
            while ($currentDate <= $endDate) {
                $dateStr = $currentDate->format('Y-m-d');
                $dayName = $currentDate->dayName;
                
                $presentCount = AttendanceRecord::when($branchId, fn($q) => $q->where('branch_id', $branchId))
                    ->whereDate('date', $dateStr)->distinct('employee_id')->count();
                
                $leaves = LeaveRequest::where('status', 'approved')
                    ->whereHas('employee', function($q) use ($branchId) {
                        $q->when($branchId, fn($sq) => $sq->where('branch_id', $branchId));
                    })
                    ->where('start_date', '<=', $dateStr)
                    ->where('end_date', '>=', $dateStr)
                    ->count();
                
                $holiday = Holiday::where('start_date', '<=', $dateStr)->where('end_date', '>=', $dateStr)
                    ->when($branchId, function($q) use ($branchId) {
                        $q->where(function($sq) use ($branchId) {
                            $sq->whereDoesntHave('branches')
                              ->orWhereHas('branches', fn($bq) => $bq->where('branches.id', $branchId));
                        });
                    })
                    ->exists();
                
                // Count day-off employees for this specific date
                $dailyDayOffCount = 0;
                $dailyPresentIds = AttendanceRecord::when($branchId, fn($q) => $q->where('branch_id', $branchId))
                    ->whereDate('date', $dateStr)->distinct()->pluck('employee_id');
                
                $dailyLeaveIds = LeaveRequest::where('status', 'approved')
                    ->whereHas('employee', function($q) use ($branchId) {
                        $q->when($branchId, fn($sq) => $sq->where('branch_id', $branchId));
                    })
                    ->where('start_date', '<=', $dateStr)->where('end_date', '>=', $dateStr)
                    ->pluck('employee_id');
                
                $dailyAccountedIds = $dailyPresentIds->merge($dailyLeaveIds)->unique();
                foreach ($allEmployees->whereNotIn('id', $dailyAccountedIds->toArray()) as $emp) {
                    if ($emp->isDayOff($dateStr)) {
                        $dailyDayOffCount++;
                    }
                }

                $dailyAbsent = max(0, $totalEmployees - $presentCount - $leaves - $dailyDayOffCount - ($holiday ? $totalEmployees : 0));
                
                if ($dailyAbsent > 0) {
                    $absentData[] = [
                        'status' => 'Absent',
                        'day_name' => $dayName,
                        'count' => $dailyAbsent
                    ];
                }
                if ($dailyDayOffCount > 0) {
                    $absentData[] = [
                        'status' => 'Day Off',
                        'day_name' => $dayName,
                        'count' => $dailyDayOffCount
                    ];
                }
                $currentDate->addDay();
            }

            $statusHeatmap = $statusHeatmap->concat($absentData);

            return [
                'stats' => [
                    'total_employees' => $totalEmployees,
                    'present' => $presentEmployeesCount,
                    'absent' => $absentCount,
                    'day_off' => $dayOffCount + $leaveCount,
                    'holiday' => $isOnHoliday ? 1 : 0,
                ],
                'trend' => $trendData,
                'departments' => $departmentStats,
                'leaderboards' => [
                    'performance' => $getLeaderboard($baseLeaderboard, '(count(*) * 100) - sum(coalesce(late_minutes, 0))'),
                    'overtime' => $getLeaderboard($baseLeaderboard, 'sum(coalesce(overtime_minutes, 0))'),
                    'early_arrival' => $getLeaderboard($baseLeaderboard, 'sum(coalesce(early_minutes, 0))'),
                    'stay_late' => $getLeaderboard($baseLeaderboard, 'sum(coalesce(stay_late_minutes, 0))'),
                    'late_arrival' => $getLeaderboard($baseLeaderboard, 'sum(coalesce(late_minutes, 0))'),
                    'early_departure' => $getLeaderboard($baseLeaderboard, 'sum(coalesce(early_departure_minutes, 0))'),
                ],
                'heatmap_checkin' => $heatmapCheckin,
                'heatmap_checkout' => $heatmapCheckout,
                'status_heatmap' => $statusHeatmap
            ];
        });
    }
    
    public function sendNotification(Request $request)
    {
        $date = $request->date ? Carbon::parse($request->date)->format('Y-m-d') : Carbon::today()->format('Y-m-d');
        $type = $request->type; // present, absent, day_off, holiday

        // Re-use logic to get employees for the summary
        $employees = $this->getDrillDownData($type, $date, $request->branch_id);
        
        if ($employees->isEmpty()) {
            return response()->json(['message' => 'No employees found to notify.'], 400);
        }

        $typeLabel = match($type) {
            'present' => 'Present',
            'absent' => 'Absent',
            'day_off' => 'on Day Off',
            'holiday' => 'on Holiday',
            default => 'at work'
        };

        $emoji = match($type) {
            'present' => '✅',
            'absent' => '❌',
            'day_off' => '📅',
            'holiday' => '🎉',
            default => '📢'
        };

        $message = "{$emoji} <b>{$employees->count()} Employees {$typeLabel} Today:</b>\n";
        $message .= "<i>Date: " . Carbon::parse($date)->format('d M Y') . "</i>\n";
        $message .= "---------------------------\n";
        
        foreach ($employees as $index => $emp) {
            $message .= ($index + 1) . ". " . $emp->full_name . " (" . $emp->employee_id . ")\n";
        }

        try {
            $telegramService = new \App\Services\TelegramService();
            $setting = \App\Models\Communication\TelegramSetting::instance();
            
            if (!$setting->global_chat_id) {
                return response()->json(['message' => 'Global Team Group chat ID not configured.'], 400);
            }

            $success = $telegramService->sendMessage(
                $setting->global_chat_id,
                $message,
                $setting->global_topic_id,
                true // force send even if branch-specific is disabled
            );

            return response()->json(['success' => $success, 'message' => 'Notification broadcasted successfully.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function getStatDrillDown(Request $request)
    {
        $date = $request->date ? Carbon::parse($request->date)->format('Y-m-d') : Carbon::today()->format('Y-m-d');
        $type = $request->type;

        $employees = $this->getDrillDownData($type, $date, $request->branch_id);

        // For 'present': load only the two time columns we need for the UI
        if ($type === 'present') {
            $employees->load(['attendanceRecords' => function ($q) use ($date) {
                $q->whereDate('date', $date)
                  ->select('id', 'employee_id', 'clock_in_time', 'clock_out_time');
            }]);
        }
        // 'day_off' leave details are not rendered in StatInspectorModal — skip that query

        // Lean response: only return what StatInspectorModal actually renders
        return response()->json($employees->map(function ($emp) use ($type) {
            $item = [
                'id'                => $emp->id,
                'full_name'         => $emp->full_name,
                'employee_id'       => $emp->employee_id,
                'profile_image_url' => $emp->profile_image_url,
                'department'        => $emp->department ? ['name' => $emp->department->name] : null,
                'branch'            => $emp->branch    ? ['name' => $emp->branch->name]    : null,
            ];

            if ($type === 'present') {
                $record = $emp->attendanceRecords->first();
                // Flatten into root-level fields so the UI can access emp.check_in_time directly
                $item['check_in_time'] = $record?->clock_in_time
                    ? Carbon::parse($record->clock_in_time)->format('H:i')
                    : null;
                $item['attendance_duration'] = ($record?->clock_in_time && $record?->clock_out_time)
                    ? Carbon::parse($record->clock_in_time)
                             ->diff(Carbon::parse($record->clock_out_time))
                             ->format('%H:%I')
                    : null;
            }

            return $item;
        }));
    }

    private function getDrillDownData($type, $date, $branchId = null)
    {
        $query = Employee::query()
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->with(['department:id,name', 'branch:id,name'])
            ->select('id', 'full_name', 'employee_id', 'profile_image', 'department_id', 'branch_id');

        if ($type === 'present') {
            $query->whereHas('attendanceRecords', function($q) use ($date) {
                $q->whereDate('date', $date);
            });
        } elseif ($type === 'day_off') {
            // Day Off includes: approved leave OR shift/custom rest day
            $onLeaveIds = \App\Models\Leave\LeaveRequest::where('status', 'approved')
                ->where('start_date', '<=', $date)
                ->where('end_date', '>=', $date)
                ->pluck('employee_id');
            
            $presentIds = \App\Models\Attendance\AttendanceRecord::whereDate('date', $date)
                ->distinct()->pluck('employee_id');

            // Get all employees not present
            $allNotPresent = Employee::with(['workingShift:id,name,working_days', 'dayOffs' => fn($q) => $q->active($date)])
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->whereNotIn('id', $presentIds)
                ->select('id', 'full_name', 'employee_id', 'profile_image', 'department_id', 'branch_id')
                ->get();

            // Filter: on leave or is day off
            $dayOffEmployeeIds = $allNotPresent->filter(function ($emp) use ($date, $onLeaveIds) {
                return $onLeaveIds->contains($emp->id) || $emp->isDayOff($date);
            })->pluck('id');

            $query->whereIn('id', $dayOffEmployeeIds);
        } elseif ($type === 'absent') {
            // Absent = not present, not on leave, not on day off, not on holiday
            $isHoliday = \App\Models\HR\Holiday::where('start_date', '<=', $date)->where('end_date', '>=', $date)
                ->when($branchId, function($q) use ($branchId) {
                    $q->where(function($sq) use ($branchId) {
                        $sq->whereDoesntHave('branches')
                          ->orWhereHas('branches', fn($bq) => $bq->where('branches.id', $branchId));
                    });
                })
                ->exists();
            if ($isHoliday) return collect([]);

            $presentIds = \App\Models\Attendance\AttendanceRecord::whereDate('date', $date)
                ->distinct()->pluck('employee_id');
            $leaveIds = \App\Models\Leave\LeaveRequest::where('status', 'approved')
                ->where('start_date', '<=', $date)->where('end_date', '>=', $date)
                ->pluck('employee_id');

            $allNotAccountedFor = Employee::with(['workingShift:id,name,working_days', 'dayOffs' => fn($q) => $q->active($date)])
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->whereNotIn('id', $presentIds->merge($leaveIds)->unique())
                ->select('id', 'full_name', 'employee_id', 'profile_image', 'department_id', 'branch_id')
                ->get();

            // Exclude those who are on day off
            $trueAbsentIds = $allNotAccountedFor->reject(function ($emp) use ($date) {
                return $emp->isDayOff($date);
            })->pluck('id');

            $query->whereIn('id', $trueAbsentIds);
        } elseif ($type === 'holiday') {
            $isHoliday = \App\Models\HR\Holiday::where('start_date', '<=', $date)->where('end_date', '>=', $date)
                ->when($branchId, function($q) use ($branchId) {
                    $q->where(function($sq) use ($branchId) {
                        $sq->whereDoesntHave('branches')
                          ->orWhereHas('branches', fn($bq) => $bq->where('branches.id', $branchId));
                    });
                })
                ->exists();
            if (!$isHoliday) return collect([]);
        }

        return $query->get();
    }
}

