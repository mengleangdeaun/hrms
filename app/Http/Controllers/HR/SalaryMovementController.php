<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\SalaryMovement;
use App\Models\HR\Employee;
use Illuminate\Http\Request;

class SalaryMovementController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 10);
        $search = $request->query('search');

        $query = SalaryMovement::with([
            'employee:id,full_name,employee_id,profile_image',
        ]);

        if ($search) {
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        $movements = $query->latest()->paginate($perPage);

        return response()->json($movements);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id'     => 'required|exists:employees,id',
            'new_salary'      => 'required|numeric|min:0',
            'effective_date'  => 'required|date',
            'type'            => 'required|in:increment,promotion,initial,adjustment',
            'reason'          => 'nullable|string',
            'status'          => 'required|in:pending,approved,rejected',
        ]);

        $employee = Employee::find($validated['employee_id']);
        $previousSalary = $employee->base_salary;
        
        $validated['previous_salary'] = $previousSalary;
        $validated['increment_amount'] = $validated['new_salary'] - $previousSalary;
        $validated['is_applied'] = false;

        $movement = SalaryMovement::create($validated);

        // Apply immediately if approved and effective date reached
        $this->checkAndApplyMovement($movement);

        return response()->json($movement->load('employee'), 201);
    }

    public function show(SalaryMovement $salaryMovement)
    {
        return response()->json($salaryMovement->load('employee'));
    }

    public function update(Request $request, SalaryMovement $salaryMovement)
    {
        $validated = $request->validate([
            'employee_id'     => 'required|exists:employees,id',
            'new_salary'      => 'required|numeric|min:0',
            'effective_date'  => 'required|date',
            'type'            => 'required|in:increment,promotion,initial,adjustment',
            'reason'          => 'nullable|string',
            'status'          => 'required|in:pending,approved,rejected',
        ]);

        // If employee changed, recalculate
        if ($salaryMovement->employee_id != $validated['employee_id']) {
            $employee = Employee::find($validated['employee_id']);
            $validated['previous_salary'] = $employee->base_salary;
        } else {
            $validated['previous_salary'] = $salaryMovement->previous_salary;
        }

        $validated['increment_amount'] = $validated['new_salary'] - $validated['previous_salary'];

        $salaryMovement->update($validated);

        // Re-check application after update
        $this->checkAndApplyMovement($salaryMovement);

        return response()->json($salaryMovement->load('employee'));
    }

    public function destroy(SalaryMovement $salaryMovement)
    {
        $salaryMovement->delete();
        return response()->json(null, 204);
    }

    /**
     * Check if movement should be applied immediately.
     */
    private function checkAndApplyMovement(SalaryMovement $movement)
    {
        if ($movement->status === 'approved' && !$movement->is_applied) {
            $effectiveDate = \Carbon\Carbon::parse($movement->effective_date);
            
            if ($effectiveDate->isPast() || $effectiveDate->isToday()) {
                $employee = $movement->employee;
                if ($employee) {
                    $employee->update([
                        'base_salary' => $movement->new_salary
                    ]);
                    
                    $movement->update([
                        'is_applied' => true
                    ]);
                }
            }
        }
    }
}
