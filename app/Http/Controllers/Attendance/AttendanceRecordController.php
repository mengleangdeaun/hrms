<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Models\Attendance\AttendanceRecord;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AttendanceRecordController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = AttendanceRecord::with(['employee.workingShift', 'employee.attendancePolicy', 'branch:id,name']);

        $this->applyFilters($query, $request);

        $sortField = $request->input('sort_by', 'date');
        $sortDirection = $request->input('sort_direction', 'desc');

        if ($sortField === 'employee') {
            $query->join('employees', 'attendance_records.employee_id', '=', 'employees.id')
                  ->orderBy('employees.full_name', $sortDirection)
                  ->select('attendance_records.*');
        } else {
            $query->orderBy($sortField, $sortDirection);
        }

        if ($sortField !== 'id') {
            $query->orderBy('id', 'desc');
        }

        $records = $query->paginate($request->input('per_page', 50));

        // Transform records to match frontend expectations while keeping payload small
        $records->getCollection()->transform(function ($record) {
            $checkIn = $record->clock_in_time ? Carbon::parse($record->clock_in_time) : null;
            $checkOut = $record->clock_out_time ? Carbon::parse($record->clock_out_time) : null;
            
            // 1. Identify Snapshot or Current Source of Truth
            $dayConfig = $record->shift_config_snapshot;
            $policyData = $record->policy_config_snapshot;
            
            // Fallback for legacy records
            if (!$dayConfig) {
                $shift = $record->employee->workingShift ?? null;
                $dayName = strtolower($record->date->format('l'));
                $dayConfig = $shift ? ($shift->working_days[$dayName] ?? null) : null;
                if ($dayConfig) {
                    $dayConfig['day_shift_type'] = $dayConfig['day_shift_type'] ?? ($shift->shift_type ?? 'regular');
                }
            }

            if (!$policyData) {
                $policyModel = $record->employee->attendancePolicy;
                $policyData = $policyModel ? [
                    'id' => $policyModel->id,
                    'name' => $policyModel->name,
                    'late_tolerance_minutes' => $policyModel->late_tolerance_minutes,
                    'early_departure_tolerance_minutes' => $policyModel->early_departure_tolerance_minutes,
                    'overtime_minimum_minutes' => $policyModel->overtime_minimum_minutes,
                ] : null;
            }

            $totalHours = $record->total_hours;

            return [
                'id' => $record->id,
                'employee' => $record->employee ? [
                    'id' => $record->employee->id,
                    'ulid' => $record->employee->ulid,
                    'full_name' => $record->employee->full_name,
                    'employee_id' => $record->employee->employee_id,
                    'profile_image_url' => $record->employee->profile_image_url,
                ] : null,
                'date' => $record->date->format('Y-m-d'),
                'shift_config' => $dayConfig,
                'policy_config' => $policyData,
                'check_in' => $record->clock_in_time,
                'check_out' => $record->clock_out_time,
                'session_1_out_time' => $record->session_1_out_time,
                'session_2_in_time' => $record->session_2_in_time,
                'status' => $record->status,
                'in_status' => $record->in_status,
                'out_status' => $record->out_status,
                'total_hours' => $totalHours,
                'late_reason' => $record->late_reason,
                'early_departure_reason' => $record->early_departure_reason,
                'late_minutes' => $record->late_minutes,
                'early_minutes' => $record->early_minutes,
                'warning_minutes' => $record->warning_minutes,
                'early_departure_minutes' => $record->early_departure_minutes,
                'overtime_minutes' => $record->overtime_minutes,
                'stay_late_minutes' => $record->stay_late_minutes,
                'clock_in_location' => $record->clock_in_location,
                'clock_out_location' => $record->clock_out_location,
            ];
        });

        return response()->json($records);
    }

    /**
     * Export attendance records to CSV.
     */
    public function export(Request $request)
    {
        $query = AttendanceRecord::with('employee');
        $this->applyFilters($query, $request);

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=attendance_records_" . date('Y-m-d') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['#', 'Employee', 'Employee ID', 'Date', 'Check In', 'Check Out', 'Status', 'Total Hours'];

        $callback = function() use($query, $columns) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF"); // Add BOM for Excel compatibility
            fputcsv($file, $columns);

            $index = 1;
            $query->orderBy('date', 'desc')->chunk(200, function($records) use($file, &$index) {
                foreach ($records as $record) {
                    $checkIn = $record->clock_in_time ? Carbon::parse($record->clock_in_time) : null;
                    $checkOut = $record->clock_out_time ? Carbon::parse($record->clock_out_time) : null;
                    
                    $totalHours = $record->total_hours;

                    fputcsv($file, [
                        $index++,
                        $record->employee->full_name ?? 'N/A',
                        $record->employee->employee_id ?? 'N/A',
                        $record->date ? Carbon::parse($record->date)->format('d-m-Y') : 'N/A',
                        $record->clock_in_time ? Carbon::parse($record->clock_in_time)->format('H:i') : '-',
                        $record->clock_out_time ? Carbon::parse($record->clock_out_time)->format('H:i') : '-',
                        $record->status,
                        $totalHours ? $totalHours . ' hrs' : '-'
                    ]);
                }
            });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Shared filter logic.
     */
    private function applyFilters($query, Request $request)
    {
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('employee', function($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('in_status')) {
            $query->where('in_status', $request->in_status);
        }
        
        if ($request->filled('out_status')) {
            $query->where('out_status', $request->out_status);
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('department_id')) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        } elseif ($request->filled('start_date')) {
            $query->where('date', '>=', $request->start_date);
        } elseif ($request->filled('end_date')) {
            $query->where('date', '<=', $request->end_date);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(AttendanceRecord $record)
    {
        $record->delete();
        return response()->json(null, 204);
    }

}
