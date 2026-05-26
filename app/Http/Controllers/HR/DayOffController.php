<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Models\HR\EmployeeDayOff;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class DayOffController extends Controller
{
    /**
     * List all employees with their current day-off assignments.
     */
    public function index(Request $request)
    {
        $sortBy = $request->input('sort_by', 'full_name');
        $sortDir = $request->input('sort_direction', 'asc');
        $perPage = $request->input('per_page', 10);

        $query = Employee::query()
            ->with([
                'branch:id,name',
                'department:id,name',
                'workingShift:id,name,working_days',
                'dayOffs' => fn($q) => $q->active()->orderByDesc('created_at'),
            ])
            ->select('id', 'full_name', 'employee_id', 'profile_image', 'branch_id', 'department_id', 'working_shift_id');

        // Filters
        if ($request->branch_id && $request->branch_id !== 'ALL') {
            $query->where('branch_id', $request->branch_id);
        }
        if ($request->department_id && $request->department_id !== 'ALL') {
            $query->where('department_id', $request->department_id);
        }
        if ($request->employee_id && $request->employee_id !== 'ALL') {
            $query->where('id', $request->employee_id);
        }
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        // Sort
        if ($sortBy === 'branch') {
            $query->leftJoin('branches', 'employees.branch_id', '=', 'branches.id')
                ->orderBy('branches.name', $sortDir);
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        $employees = $query->paginate($perPage);

        // Enrich each employee with resolved day-off info
        $employees->getCollection()->each(function ($employee) {
            $activeDayOff = $employee->dayOffs->first();
            $employee->active_day_off = $activeDayOff;
            $employee->resolved_days_off = $employee->getActiveDaysOff();
            $employee->day_off_source = $activeDayOff ? 'custom' : 'shift';
            
            // Add frequency metadata for UI
            if ($activeDayOff) {
                $employee->day_off_frequency = $activeDayOff->frequency;
                $employee->day_off_weeks = $activeDayOff->weeks_of_month;
                $employee->day_off_specific_dates = $activeDayOff->specific_dates;
            }
        });

        return response()->json($employees);
    }

    /**
     * Assign day off to an employee.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id'    => 'required|exists:employees,id',
            'days_off'       => 'nullable|array',
            'days_off.*'     => 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'frequency'      => 'required|in:weekly,monthly,specific_dates',
            'weeks_of_month' => 'nullable|array',
            'weeks_of_month.*' => 'integer|min:1|max:5',
            'specific_dates' => 'nullable|array',
            'specific_dates.*' => 'date_format:Y-m-d',
            'effective_from' => 'required|date',
            'effective_to'   => 'nullable|date|after_or_equal:effective_from',
            'notes'          => 'nullable|string|max:500',
        ]);

        // Deactivate any existing active assignments for this employee
        EmployeeDayOff::where('employee_id', $validated['employee_id'])
            ->where('is_active', true)
            ->update(['is_active' => false]);

        $assigner = $request->user()?->employee;

        $dayOff = EmployeeDayOff::create([
            'employee_id'    => $validated['employee_id'],
            'days_off'       => $validated['days_off'] ?? [],
            'frequency'      => $validated['frequency'],
            'weeks_of_month' => $validated['weeks_of_month'] ?? null,
            'specific_dates' => $validated['specific_dates'] ?? null,
            'effective_from' => $validated['effective_from'],
            'effective_to'   => $validated['effective_to'] ?? null,
            'assigned_by'    => $assigner?->id,
            'notes'          => $validated['notes'] ?? null,
            'is_active'      => true,
        ]);

        // Notify the employee
        NotificationService::dayOffAssigned($dayOff);

        return response()->json([
            'message' => 'Day off assigned successfully.',
            'data'    => $dayOff->load('employee:id,full_name'),
        ], 201);
    }

    /**
     * Update an existing day-off assignment.
     */
    public function update(Request $request, $id)
    {
        $dayOff = EmployeeDayOff::findOrFail($id);

        $validated = $request->validate([
            'days_off'       => 'nullable|array',
            'days_off.*'     => 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'frequency'      => 'required|in:weekly,monthly,specific_dates',
            'weeks_of_month' => 'nullable|array',
            'weeks_of_month.*' => 'integer|min:1|max:5',
            'specific_dates' => 'nullable|array',
            'specific_dates.*' => 'date_format:Y-m-d',
            'effective_from' => 'required|date',
            'effective_to'   => 'nullable|date|after_or_equal:effective_from',
            'notes'          => 'nullable|string|max:500',
        ]);

        $dayOff->update($validated);

        // Notify the employee about the update
        NotificationService::dayOffAssigned($dayOff);

        return response()->json([
            'message' => 'Day off updated successfully.',
            'data'    => $dayOff->fresh()->load('employee:id,full_name'),
        ]);
    }

    /**
     * Remove a day-off assignment (deactivate).
     */
    public function destroy($id)
    {
        $dayOff = EmployeeDayOff::findOrFail($id);
        $dayOff->update(['is_active' => false]);

        return response()->json(['message' => 'Day off assignment removed.']);
    }
}
