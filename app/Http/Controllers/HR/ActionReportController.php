<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Models\HR\EmployeeActivity;
use App\Models\Attendance\AttendanceRecord;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ActionReportController extends Controller
{
    public function overview(Request $request)
    {
        $startDate = $request->start_date ? Carbon::parse($request->start_date)->startOfDay() : Carbon::today()->startOfDay();
        $endDate = $request->end_date ? Carbon::parse($request->end_date)->endOfDay() : Carbon::today()->endOfDay();
        
        $actions = $this->gatherActions($request, $startDate, $endDate);

        // Sort and Paginate the Collection
        $sortedActions = $actions->sortByDesc('time')->values();
        
        $perPage = $request->per_page ?? 15;
        $page = $request->page ?? 1;
        $paginated = new \Illuminate\Pagination\LengthAwarePaginator(
            $sortedActions->forPage($page, $perPage)->values(),
            $sortedActions->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return response()->json($paginated);
    }

    public function exportOverview(Request $request)
    {
        $startDate = $request->start_date ? Carbon::parse($request->start_date)->startOfDay() : Carbon::today()->startOfDay();
        $endDate = $request->end_date ? Carbon::parse($request->end_date)->endOfDay() : Carbon::today()->endOfDay();
        
        $actions = $this->gatherActions($request, $startDate, $endDate);
        $sortedActions = $actions->sortByDesc('time')->values();

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=organization_action_log_" . date('Y-m-d') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['Employee', 'Employee ID', 'Date', 'Time', 'Type', 'Action', 'Location', 'Status', 'Description'];

        $callback = function() use($sortedActions, $columns) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");
            fputcsv($file, $columns);

            foreach ($sortedActions as $action) {
                fputcsv($file, [
                    $action['employee']['full_name'],
                    $action['employee']['employee_id'],
                    $action['date'],
                    Carbon::parse($action['time'])->format('H:i:s'),
                    strtoupper($action['type']),
                    $action['label'],
                    $action['location'],
                    $action['status'] ?? '-',
                    $action['description'] ?? '-'
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function gatherActions(Request $request, $startDate, $endDate)
    {
        $employeeIds = $request->employee_id ? (is_array($request->employee_id) ? $request->employee_id : explode(',', $request->employee_id)) : [];

        // 1. Filter Employees first to get the pool
        $employeeQuery = Employee::query();
        if ($request->branch_id && $request->branch_id !== 'all') {
            $employeeQuery->where('branch_id', $request->branch_id);
        }
        if ($request->designation_id && $request->designation_id !== 'all') {
            $employeeQuery->where('designation_id', $request->designation_id);
        }
        if (!empty($employeeIds)) {
            $employeeQuery->whereIn('id', $employeeIds);
        }
        if ($request->search) {
            $employeeQuery->where(function($q) use ($request) {
                $q->where('full_name', 'like', '%' . $request->search . '%')
                  ->orWhere('employee_id', 'like', '%' . $request->search . '%')
                  ->orWhere('employee_code', 'like', '%' . $request->search . '%');
            });
        }

        $validEmployeeIds = $employeeQuery->pluck('id');

        // 2. Fetch Attendance and transform into individual actions
        $attendance = AttendanceRecord::with([
            'employee' => function($q) {
                $q->select('id', 'full_name', 'employee_id', 'employee_code', 'profile_image', 'branch_id', 'designation_id');
            },
            'employee.branch:id,name',
            'employee.designation:id,name'
        ])
            ->whereIn('employee_id', $validEmployeeIds)
            ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->get();

        $actions = new Collection();

        foreach ($attendance as $record) {
            $empData = [
                'id' => $record->employee->id,
                'full_name' => $record->employee->full_name,
                'employee_id' => $record->employee->employee_id ?? $record->employee->employee_code,
                'profile_image' => $record->employee->profile_image_url,
                'branch' => $record->employee->branch->name ?? 'N/A',
                'designation' => $record->employee->designation->name ?? 'N/A',
            ];

            if ($record->clock_in_time) {
                $actions->push([
                    'id' => 'att_in_' . $record->id,
                    'employee' => $empData,
                    'time' => $record->clock_in_time,
                    'date' => $record->date->format('Y-m-d'),
                    'type' => 'attendance',
                    'category' => 'clock_in',
                    'label' => 'Clock In',
                    'description' => $record->in_status,
                    'location' => $record->clock_in_location ?? ($record->employee->branch->name ?? 'N/A'),
                    'status' => $record->in_status,
                ]);
            }

            if ($record->clock_out_time) {
                $actions->push([
                    'id' => 'att_out_' . $record->id,
                    'employee' => $empData,
                    'time' => $record->clock_out_time,
                    'date' => $record->date->format('Y-m-d'),
                    'type' => 'attendance',
                    'category' => 'clock_out',
                    'label' => 'Clock Out',
                    'description' => $record->out_status,
                    'location' => $record->clock_out_location ?? ($record->employee->branch->name ?? 'N/A'),
                    'status' => $record->out_status,
                ]);
            }
        }

        // 3. Fetch Activities
        $activities = EmployeeActivity::with([
            'employee' => function($q) {
                $q->select('id', 'full_name', 'employee_id', 'employee_code', 'profile_image', 'branch_id', 'designation_id');
            },
            'employee.branch:id,name',
            'employee.designation:id,name'
        ])
            ->whereIn('employee_id', $validEmployeeIds)
            ->whereBetween('activity_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->get();

        foreach ($activities as $activity) {
            $actions->push([
                'id' => 'act_' . $activity->id,
                'employee' => [
                    'id' => $activity->employee->id,
                    'full_name' => $activity->employee->full_name,
                    'employee_id' => $activity->employee->employee_id ?? $activity->employee->employee_code,
                    'profile_image' => $activity->employee->profile_image_url,
                    'branch' => $activity->employee->branch->name ?? 'N/A',
                    'designation' => $activity->employee->designation->name ?? 'N/A',
                ],
                'time' => $activity->submitted_at,
                'date' => $activity->activity_date->format('Y-m-d'),
                'type' => 'activity',
                'category' => 'activity',
                'label' => $activity->activity_type,
                'description' => $activity->comment,
                'location' => $activity->location_name ?? ($activity->latitude . ',' . $activity->longitude),
                'status' => $activity->status,
            ]);
        }

        return $actions;
    }

    public function index(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        $employeeId = $request->employee_id;
        $startDate = Carbon::parse($request->start_date)->startOfDay();
        $endDate = Carbon::parse($request->end_date)->endOfDay();

        $employee = Employee::with([
            'branch:id,name', 
            'department:id,name', 
            'designation:id,name'
        ])
        ->select('id', 'full_name', 'employee_id', 'employee_code', 'profile_image', 'branch_id', 'department_id', 'designation_id')
        ->findOrFail($employeeId);

        // Fetch Attendance Records
        $attendanceRecords = AttendanceRecord::where('employee_id', $employeeId)
            ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->get();

        // Fetch Activities
        $activities = EmployeeActivity::where('employee_id', $employeeId)
            ->whereBetween('activity_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->get();

        $actions = new Collection();

        // Process Attendance
        foreach ($attendanceRecords as $record) {
            $date = $record->date->format('Y-m-d');

            if ($record->clock_in_time) {
                $actions->push([
                    'id' => 'att_in_' . $record->id,
                    'time' => $record->clock_in_time,
                    'date' => $date,
                    'type' => 'attendance',
                    'category' => 'clock_in',
                    'label' => 'Clock In',
                    'description' => $record->in_status,
                    'location' => $record->clock_in_location ?? ($record->branch->name ?? 'N/A'),
                    'status' => $record->in_status,
                    'meta' => [
                        'late_minutes' => $record->late_minutes,
                        'warning_minutes' => $record->warning_minutes,
                    ]
                ]);
            }

            if ($record->session_1_out_time) {
                $actions->push([
                    'id' => 'att_s1_out_' . $record->id,
                    'time' => $record->session_1_out_time,
                    'date' => $date,
                    'type' => 'attendance',
                    'category' => 'session_break',
                    'label' => 'Break Out',
                    'description' => 'Session 1 End',
                    'location' => $record->session_1_out_location ?? 'N/A',
                ]);
            }

            if ($record->session_2_in_time) {
                $actions->push([
                    'id' => 'att_s2_in_' . $record->id,
                    'time' => $record->session_2_in_time,
                    'date' => $date,
                    'type' => 'attendance',
                    'category' => 'session_break',
                    'label' => 'Break In',
                    'description' => 'Session 2 Start',
                    'location' => $record->session_2_in_location ?? 'N/A',
                ]);
            }

            if ($record->clock_out_time) {
                $actions->push([
                    'id' => 'att_out_' . $record->id,
                    'time' => $record->clock_out_time,
                    'date' => $date,
                    'type' => 'attendance',
                    'category' => 'clock_out',
                    'label' => 'Clock Out',
                    'description' => $record->out_status,
                    'location' => $record->clock_out_location ?? ($record->branch->name ?? 'N/A'),
                    'status' => $record->out_status,
                    'meta' => [
                        'overtime_minutes' => $record->overtime_minutes,
                        'early_departure_minutes' => $record->early_departure_minutes,
                    ]
                ]);
            }
        }

        // Process Activities
        foreach ($activities as $activity) {
            $actions->push([
                'id' => 'act_' . $activity->id,
                'time' => $activity->submitted_at,
                'date' => $activity->activity_date->format('Y-m-d'),
                'type' => 'activity',
                'category' => 'activity',
                'label' => $activity->activity_type,
                'description' => $activity->comment,
                'location' => $activity->location_name ?? ($activity->latitude . ',' . $activity->longitude),
                'status' => $activity->status,
                'attachments' => $activity->attachment_urls,
                'latitude' => $activity->latitude,
                'longitude' => $activity->longitude,
            ]);
        }

        $sortedActions = $actions->sortBy('time')->values();

        return response()->json([
            'employee' => $employee,
            'actions' => $sortedActions,
            'stats' => [
                'total_hours' => round($attendanceRecords->sum('total_hours'), 2),
                'activity_count' => $activities->count(),
            ]
        ]);
    }

    public function export(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        $employeeId = $request->employee_id;
        $startDate = Carbon::parse($request->start_date)->startOfDay();
        $endDate = Carbon::parse($request->end_date)->endOfDay();

        $employee = Employee::findOrFail($employeeId);

        // Fetch Data (Same as index but for export)
        $attendanceRecords = AttendanceRecord::where('employee_id', $employeeId)
            ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->get();

        $activities = EmployeeActivity::where('employee_id', $employeeId)
            ->whereBetween('activity_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->get();

        $actions = new Collection();

        // Process Attendance & Activities (Dry principle: extract to a private method)
        $this->processActions($attendanceRecords, $activities, $actions);
        $sortedActions = $actions->sortBy('time')->values();

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=action_report_" . $employee->employee_id . "_" . date('Y-m-d') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['Date', 'Time', 'Type', 'Action', 'Location', 'Status', 'Description'];

        $callback = function() use($sortedActions, $columns) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");
            fputcsv($file, $columns);

            foreach ($sortedActions as $action) {
                fputcsv($file, [
                    $action['date'],
                    Carbon::parse($action['time'])->format('H:i:s'),
                    strtoupper($action['type']),
                    $action['label'],
                    $action['location'],
                    $action['status'] ?? '-',
                    $action['description'] ?? '-'
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function processActions($attendanceRecords, $activities, Collection $actions)
    {
        foreach ($attendanceRecords as $record) {
            $date = $record->date->format('Y-m-d');
            if ($record->clock_in_time) {
                $actions->push([
                    'time' => $record->clock_in_time,
                    'date' => $date,
                    'type' => 'attendance',
                    'label' => 'Clock In',
                    'location' => $record->clock_in_location ?? ($record->branch->name ?? 'N/A'),
                    'status' => $record->in_status,
                    'description' => $record->in_status
                ]);
            }
            if ($record->session_1_out_time) {
                $actions->push([
                    'time' => $record->session_1_out_time,
                    'date' => $date,
                    'type' => 'attendance',
                    'label' => 'Break Out',
                    'location' => $record->session_1_out_location ?? 'N/A',
                ]);
            }
            if ($record->session_2_in_time) {
                $actions->push([
                    'time' => $record->session_2_in_time,
                    'date' => $date,
                    'type' => 'attendance',
                    'label' => 'Break In',
                    'location' => $record->session_2_in_location ?? 'N/A',
                ]);
            }
            if ($record->clock_out_time) {
                $actions->push([
                    'time' => $record->clock_out_time,
                    'date' => $date,
                    'type' => 'attendance',
                    'label' => 'Clock Out',
                    'location' => $record->clock_out_location ?? ($record->branch->name ?? 'N/A'),
                    'status' => $record->out_status,
                    'description' => $record->out_status
                ]);
            }
        }

        foreach ($activities as $activity) {
            $actions->push([
                'time' => $activity->submitted_at,
                'date' => $activity->activity_date->format('Y-m-d'),
                'type' => 'activity',
                'label' => $activity->activity_type,
                'location' => $activity->location_name ?? ($activity->latitude . ',' . $activity->longitude),
                'status' => $activity->status,
                'description' => $activity->comment
            ]);
        }
    }
}
