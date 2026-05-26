<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Models\Attendance\AttendanceRecord;
use App\Models\HR\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\TelegramService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AttendanceReportController extends Controller
{
    public function summary(Request $request)
    {
        $startDate = $request->start_date ? Carbon::parse($request->start_date)->startOfDay() : Carbon::now()->startOfMonth();
        $endDate = $request->end_date ? Carbon::parse($request->end_date)->endOfDay() : Carbon::now()->endOfMonth();

        // Subquery for aggregates
        $statsSub = DB::table('attendance_records')
            ->select(
                'employee_id',
                DB::raw('COUNT(id) as present_days'),
                DB::raw('SUM(COALESCE(late_minutes, 0)) as total_late'),
                DB::raw('SUM(COALESCE(early_minutes, 0)) as total_early'),
                DB::raw('SUM(COALESCE(early_departure_minutes, 0)) as total_early_departure'),
                DB::raw('SUM(COALESCE(stay_late_minutes, 0)) as total_stay_late'),
                DB::raw('SUM(COALESCE(overtime_minutes, 0)) as total_overtime'),
                DB::raw('SUM(CASE WHEN COALESCE(total_hours, 0) > 0 THEN total_hours WHEN clock_in_time IS NOT NULL AND clock_out_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, clock_in_time, clock_out_time) / 60 ELSE 0 END) as total_work_hours')
            )
            ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->groupBy('employee_id');

        $query = Employee::query()
            ->with(['branch:id,name', 'department:id,name'])
            ->leftJoinSub($statsSub, 'stats', function($join) {
                $join->on('employees.id', '=', 'stats.employee_id');
            })
            ->select(
                'employees.id',
                'employees.ulid',
                'employees.full_name',
                'employees.employee_id as employee_code',
                'employees.branch_id',
                'employees.department_id',
                'employees.profile_image',
                DB::raw('COALESCE(stats.present_days, 0) as present_days'),
                DB::raw('COALESCE(stats.total_late, 0) as total_late'),
                DB::raw('COALESCE(stats.total_early, 0) as total_early'),
                DB::raw('COALESCE(stats.total_early_departure, 0) as total_early_departure'),
                DB::raw('COALESCE(stats.total_stay_late, 0) as total_stay_late'),
                DB::raw('COALESCE(stats.total_overtime, 0) as total_overtime'),
                DB::raw('COALESCE(stats.total_work_hours, 0) as total_work_hours')
            );

        // Filters
        if ($request->filled('branch_id') && $request->branch_id !== 'all') {
            $query->where('employees.branch_id', $request->branch_id);
        }
        if ($request->filled('department_id') && $request->department_id !== 'all') {
            $query->where('employees.department_id', $request->department_id);
        }
        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(function($q) use ($search) {
                $q->where('employees.full_name', 'LIKE', $search)
                  ->orWhere('employees.employee_id', 'LIKE', $search);
            });
        }

        // Sorting (Handled at DB level if sort_by is provided)
        $sortBy = $request->get('sort_by', 'full_name');
        $sortDir = $request->get('sort_dir', 'asc');

        if ($request->filled('sort_by')) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('employees.full_name', 'asc');
        }

        $results = $query->paginate($request->get('limit', 15));

        // Format times for frontend
        $results->getCollection()->transform(function($emp) {
            $emp->profile_image_url = $emp->profile_image ? \Illuminate\Support\Facades\Storage::url($emp->profile_image) : null;
            $emp->formatted_work_time = $this->formatHoursToHHmm($emp->total_work_hours);
            return $emp;
        });

        return response()->json($results);
    }

    public function exportSummary(Request $request)
    {
        $startDate = $request->start_date ? Carbon::parse($request->start_date)->startOfDay() : Carbon::now()->startOfMonth();
        $endDate = $request->end_date ? Carbon::parse($request->end_date)->endOfDay() : Carbon::now()->endOfMonth();

        // Stats Subquery
        $statsSub = DB::table('attendance_records')
            ->select(
                'employee_id',
                DB::raw('COUNT(id) as present_days'),
                DB::raw('SUM(COALESCE(late_minutes, 0)) as total_late'),
                DB::raw('SUM(COALESCE(early_minutes, 0)) as total_early'),
                DB::raw('SUM(COALESCE(early_departure_minutes, 0)) as total_early_departure'),
                DB::raw('SUM(COALESCE(stay_late_minutes, 0)) as total_stay_late'),
                DB::raw('SUM(COALESCE(overtime_minutes, 0)) as total_overtime'),
                DB::raw('SUM(CASE WHEN COALESCE(total_hours, 0) > 0 THEN total_hours WHEN clock_in_time IS NOT NULL AND clock_out_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, clock_in_time, clock_out_time) / 60 ELSE 0 END) as total_work_hours')
            )
            ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->groupBy('employee_id');

        $query = Employee::query()
            ->with(['branch:id,name', 'department:id,name'])
            ->leftJoinSub($statsSub, 'stats', function($join) {
                $join->on('employees.id', '=', 'stats.employee_id');
            })
            ->select(
                'employees.id',
                'employees.full_name',
                'employees.employee_id as employee_code',
                'employees.branch_id',
                'employees.department_id',
                DB::raw('COALESCE(stats.present_days, 0) as present_days'),
                DB::raw('COALESCE(stats.total_late, 0) as total_late'),
                DB::raw('COALESCE(stats.total_early, 0) as total_early'),
                DB::raw('COALESCE(stats.total_early_departure, 0) as total_early_departure'),
                DB::raw('COALESCE(stats.total_stay_late, 0) as total_stay_late'),
                DB::raw('COALESCE(stats.total_overtime, 0) as total_overtime'),
                DB::raw('COALESCE(stats.total_work_hours, 0) as total_work_hours')
            );

        // Filters (Sync with summary method)
        if ($request->filled('branch_id') && $request->branch_id !== 'all') {
            $query->where('employees.branch_id', $request->branch_id);
        }
        if ($request->filled('department_id') && $request->department_id !== 'all') {
            $query->where('employees.department_id', $request->department_id);
        }
        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(function($q) use ($search) {
                $q->where('employees.full_name', 'LIKE', $search)
                  ->orWhere('employees.employee_id', 'LIKE', $search);
            });
        }

        $query->orderBy('employees.full_name', 'asc');

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=attendance_summary_" . date('Y-m-d') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = [
            '#', 'Employee', 'ID', 'Branch', 'Department', 
            'Present Days', 'Late (min)', 'Early In (min)', 
            'Early Out (min)', 'Stay Late (min)', 'Overtime (min)', 
            'Total Work Time'
        ];

        $callback = function() use($query, $columns, $startDate, $endDate) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");
            
            // Header Info
            fputcsv($file, ["Attendance Summary Report"]);
            fputcsv($file, ["Period:", $startDate->format('d M Y') . ' - ' . $endDate->format('d M Y')]);
            fputcsv($file, ["Exported At:", now()->format('d M Y H:i')]);
            fputcsv($file, []); // Spacer

            fputcsv($file, $columns);
            $index = 1;

            $query->chunk(200, function($employees) use($file, &$index) {
                foreach ($employees as $emp) {
                    fputcsv($file, [
                        $index++,
                        $emp->full_name,
                        $emp->employee_code,
                        $emp->branch->name ?? 'N/A',
                        $emp->department->name ?? 'N/A',
                        $emp->present_days,
                        $emp->total_late,
                        $emp->total_early,
                        $emp->total_early_departure,
                        $emp->total_stay_late,
                        $emp->total_overtime,
                        $this->formatHoursToHHmm($emp->total_work_hours)
                    ]);
                }
            });
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function timeline(Employee $employee, Request $request)
    {
        $startDate = $request->start_date ? Carbon::parse($request->start_date)->startOfDay() : Carbon::now()->startOfMonth();
        $endDate = $request->end_date ? Carbon::parse($request->end_date)->endOfDay() : Carbon::now()->endOfMonth();

        $data = $this->getTimelineData($employee, $startDate, $endDate);
        return response()->json($data);
    }

    private function getTimelineData(Employee $employee, Carbon $startDate, Carbon $endDate)
    {
        $employee->load(['workingShift', 'attendancePolicy']);
        
        $records = AttendanceRecord::where('employee_id', $employee->id)
            ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->orderBy('date', 'asc')
            ->get();

        $holidays = \App\Models\HR\Holiday::where(function($q) use ($startDate, $endDate) {
                $q->whereBetween('start_date', [$startDate, $endDate])
                  ->orWhereBetween('end_date', [$startDate, $endDate])
                  ->orWhere(function($sub) use ($startDate, $endDate) {
                      $sub->where('start_date', '<', $startDate)
                          ->where('end_date', '>', $endDate);
                  });
            })
            ->whereHas('branches', function($q) use ($employee) {
                $q->where('branches.id', $employee->branch_id);
            })
            ->get();

        $leaves = \App\Models\Leave\LeaveRequest::where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->where(function($q) use ($startDate, $endDate) {
                $q->whereBetween('start_date', [$startDate, $endDate])
                  ->orWhereBetween('end_date', [$startDate, $endDate]);
            })
            ->get();

        $workingDaysCount = 0;
        $holidayCount = 0;
        $excusedLeaveCount = 0;
        $isUsingFallback = false;
        $fullTimeline = [];

        $currentShift = $employee->workingShift;
        $recordMap = $records->keyBy(fn($r) => Carbon::parse($r->date)->format('Y-m-d'));

        $totalWorkHours = 0;
        $curr = $startDate->copy();
        while ($curr->lte($endDate)) {
            $dateStr = $curr->format('Y-m-d');
            $dayName = strtolower($curr->format('l'));
            
            $record = $recordMap->get($dateStr);
            $shiftConfig = null;
            $contextSource = 'snapshot';
            
            if ($record && $record->shift_config_snapshot) {
                $fullConfig = $record->shift_config_snapshot;
                if (isset($fullConfig[$dayName])) {
                    $shiftConfig = $fullConfig[$dayName];
                } else {
                    $shiftConfig = $fullConfig;
                }
            } else {
                $shiftConfig = $currentShift ? ($currentShift->working_days[$dayName] ?? null) : null;
                $contextSource = 'policy-estimate';
                if (!$record) $isUsingFallback = true;
            }

            $isWorkingDay = $shiftConfig && ($shiftConfig['is_working'] ?? false);
            $dayType = 'off';
            
            $activeHoliday = $holidays->first(fn($h) => $curr->between($h->start_date, $h->end_date));
            $activeLeave = $leaves->first(fn($l) => $curr->startOfDay()->between($l->start_date, $l->end_date));

            if ($isWorkingDay) {
                if ($activeHoliday) {
                    $holidayCount++;
                    $dayType = 'holiday';
                } elseif ($activeLeave) {
                    $excusedLeaveCount++;
                    $dayType = 'leave';
                } else {
                    $workingDaysCount++;
                    $dayType = $record ? 'present' : 'absent';
                }
            }

            if ($record) {
                $hours = (float)$record->total_hours;
                if ($hours <= 0 && $record->clock_in_time && $record->clock_out_time) {
                    $hours = round($record->clock_in_time->diffInMinutes($record->clock_out_time) / 60, 2);
                }
                $totalWorkHours += $hours;
            }

            $fullTimeline[] = [
                'date' => $dateStr,
                'is_expected' => $isWorkingDay,
                'type' => $dayType,
                'context_source' => $contextSource,
                'holiday' => $activeHoliday ? $activeHoliday->name : null,
                'leave' => $activeLeave ? ($activeLeave->leaveType ? $activeLeave->leaveType->name : 'Approved Leave') : null,
                'record' => $record ? [
                    'clock_in' => $record->clock_in_time ? $record->clock_in_time->format('H:i') : null,
                    'clock_out' => $record->clock_out_time ? $record->clock_out_time->format('H:i') : null,
                    'status' => $record->status,
                    'total_hours' => (float)$record->total_hours > 0 
                        ? (float)$record->total_hours 
                        : ($record->clock_in_time && $record->clock_out_time ? round($record->clock_in_time->diffInMinutes($record->clock_out_time) / 60, 2) : 0),
                    'formatted_duration' => (float)$record->total_hours > 0 
                        ? $this->formatHoursToHHmm($record->total_hours)
                        : ($record->clock_in_time && $record->clock_out_time 
                            ? $this->formatHoursToHHmm($record->clock_in_time->diffInMinutes($record->clock_out_time) / 60)
                            : '0h 00m'),
                    'late_minutes' => (int)$record->late_minutes,
                    'warning_minutes' => (int)$record->warning_minutes,
                    'overtime_minutes' => (int)$record->overtime_minutes,
                ] : null
            ];
            $curr->addDay();
        }

        return [
            'employee' => [
                'full_name' => $employee->full_name,
                'employee_id' => $employee->employee_id,
                'working_shift' => $currentShift ? $currentShift->name : 'N/A',
            ],
            'timeline' => $fullTimeline,
            'analytics' => [
                'expected_working_days' => $workingDaysCount,
                'holiday_count' => $holidayCount,
                'excused_leave_count' => $excusedLeaveCount,
                'total_work_hours' => round($totalWorkHours, 2),
                'formatted_total_work_hours' => $this->formatHoursToHHmm($totalWorkHours),
                'is_using_fallback' => $isUsingFallback,
            ]
        ];
    }

    public function shareReport(Request $request)
    {
        $request->validate([
            'employee_ulid' => 'required|exists:employees,ulid',
            'image' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        try {
            $employee = Employee::where('ulid', $request->employee_ulid)->with('lineManager')->firstOrFail();
            $startDate = Carbon::parse($request->start_date)->startOfDay();
            $endDate = Carbon::parse($request->end_date)->endOfDay();
            
            // 1. Generate Visual Data
            $imageData = preg_replace('#^data:image/\w+;base64,#i', '', $request->image);
            $imageContent = base64_decode($imageData);
            $photoFilename = 'temp/reports/perf_' . $employee->ulid . '_' . time() . '.png';
            Storage::disk('public')->put($photoFilename, $imageContent);
            $photoUrl = Storage::url($photoFilename);

            // 2. Generate CSV Data
            $timelineData = $this->getTimelineData($employee, $startDate, $endDate);
            $csvContent = "\xEF\xBB\xBF"; // UTF-8 BOM
            $csvContent .= "Date,Day,Status,Expected,Clock In,Clock Out,Work Time,Late (min),OT (min)\n";
            
            foreach ($timelineData['timeline'] as $day) {
                $record = $day['record'];
                $row = [
                    $day['date'],
                    Carbon::parse($day['date'])->format('l'),
                    strtoupper($day['type']),
                    $day['is_expected'] ? 'YES' : 'NO',
                    $record['clock_in'] ?? '—',
                    $record['clock_out'] ?? '—',
                    $record['formatted_duration'] ?? '0h 00m',
                    $record['late_minutes'] ?? 0,
                    $record['overtime_minutes'] ?? 0
                ];
                $csvContent .= implode(',', $row) . "\n";
            }
            $csvFileName = "Attendance_Report_{$employee->employee_code}_{$startDate->format('M_Y')}.csv";

            // 3. Prepare Telegram Broadcast
            $caption = "<b>📊 Attendance Performance Report</b>\n";
            $caption .= "---------------------------\n";
            $caption .= "👤 <b>Name:</b> " . $employee->full_name . "\n";
            $caption .= "🆔 <b>ID:</b> " . ($employee->employee_code ?: $employee->employee_id) . "\n";
            $caption .= "📅 <b>Period:</b> " . $startDate->format('d M') . " - " . $endDate->format('d M Y') . "\n";
            $caption .= "---------------------------\n";
            $caption .= "💡 Report shared by: " . (auth()->user()->name ?? 'HR Admin');

            $telegram = new TelegramService($employee->branch_id);
            $sentCount = 0;

            $targets = array_filter([
                $employee->telegram_user_id,
                $employee->lineManager->telegram_user_id ?? null
            ]);

            foreach ($targets as $chatId) {
                try {
                    // Send Photo
                    $telegram->sendPhoto($chatId, $photoUrl, $caption, null, true);
                    // Send Document
                    $telegram->sendDocument($chatId, $csvContent, $csvFileName, "📄 Detailed Logs: {$employee->full_name}", null, true);
                    $sentCount++;
                } catch (\Exception $e) {
                    Log::error("Failed sharing report to {$chatId}: " . $e->getMessage());
                }
            }

            return response()->json([
                'success' => $sentCount > 0,
                'message' => $sentCount > 0 ? "Report & CSV shared successfully with {$sentCount} recipient(s)." : "Failed to share with any recipients."
            ]);

        } catch (\Exception $e) {
            Log::error("Report sharing error: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to share report: ' . $e->getMessage()], 500);
        }
    }

    private function formatHoursToHHmm($decimalHours)
    {
        $totalMinutes = round($decimalHours * 60);
        $hours = floor($totalMinutes / 60);
        $minutes = $totalMinutes % 60;
        return sprintf('%dh %02dm', $hours, $minutes);
    }
}
