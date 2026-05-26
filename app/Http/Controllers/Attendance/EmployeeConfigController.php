<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use Illuminate\Http\Request;

class EmployeeConfigController extends Controller
{
    public function index()
    {
        $employees = Employee::with([
            'branch:id,name',
            'department:id,name',
            'designation:id,name',
            'workingShift:id,name',
            'attendancePolicy:id,name',
            'lineManager:id,employee_id,full_name'
        ])
        ->latest()
        ->get();

        return response()->json($employees);
    }

    public function updateField(Request $request, Employee $employee)
    {
        $request->validate([
            'working_shift_id'     => 'nullable|exists:working_shifts,id',
            'attendance_policy_id' => 'nullable|exists:attendance_policies,id',
            'is_active'            => 'nullable|boolean',
            'telegram_user_id'     => 'nullable|string|max:255',
            'line_manager_id'      => 'nullable|exists:employees,id',
        ]);

        $employee->update($request->only([
            'working_shift_id',
            'attendance_policy_id',
            'is_active',
            'telegram_user_id',
            'line_manager_id',
        ]));

        return response()->json($employee->load([
            'branch:id,name',
            'department:id,name',
            'designation:id,name',
            'workingShift:id,name',
            'attendancePolicy:id,name',
            'lineManager:id,employee_id,full_name'
        ]));
    }

    public function unbindDevice(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,ulid'
        ]);

        $employee = Employee::where('ulid', $request->employee_id)->firstOrFail();
        
        $employee->update([
            'device_id' => null,
            'device_binding_status' => 'unbound'
        ]);

        return response()->json([
            'message' => 'Device binding reset successfully. The employee can now bind a new device on their next login.'
        ]);
    }
}
