<?php

namespace App\Http\Controllers\EmployeeApp;

use App\Http\Controllers\Controller;
use App\Models\Leave\LeaveBalance;
use Illuminate\Http\Request;

class LeaveController extends Controller
{
    /**
     * Helper to authenticate the device token passively without Laravel Sanctum overhead for the minimal PWA.
     */
    private function getAuthenticatedEmployee(Request $request)
    {
        $token = $request->header('Authorization') ?? $request->bearerToken();
        if (!$token) return null;

        // The frontend will send the raw token or 'Bearer token'
        $token = str_replace('Bearer ', '', $token);
        
        return \App\Models\HR\Employee::where('auth_token', $token)->first();
    }

    /**
     * Get the authenticated employee's leave balances for the current year.
     */
    public function myBalances(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        
        if (!$employee) {
            return response()->json(['message' => 'Employee profile not found.'], 404);
        }

        $currentYear = date('Y');
        
        // Eager load balances with their leave types and allocations in one go
        $balances = LeaveBalance::with(['leaveType'])
            ->where('employee_id', $employee->id)
            ->where('year', $currentYear)
            ->get();

        // Get all active allocations for this employee to map policies
        $allocations = \App\Models\Leave\EmployeeLeaveAllocation::with(['leavePolicy', 'approver.designation'])
            ->where('employee_id', $employee->id)
            ->where('is_active', true)
            ->get()
            ->keyBy(function($item) {
                return $item->leavePolicy->leave_type_id;
            });

        $balances->each(function($balance) use ($allocations) {
            $allocation = $allocations->get($balance->leave_type_id);
            
            if ($allocation && $allocation->leavePolicy) {
                $balance->leaveType->allow_half_day = (bool)$allocation->leavePolicy->allow_half_day;
                $balance->leaveType->allow_hourly = (bool)$allocation->leavePolicy->allow_hourly;
                
                if ($allocation->approver) {
                    $balance->leaveType->specific_approver = [
                        'name' => $allocation->approver->full_name,
                        'designation' => $allocation->approver->designation?->name ?? 'Manager',
                        'profile_image_url' => $allocation->approver->profile_image_url,
                    ];
                }
            } else {
                $balance->leaveType->allow_half_day = false;
                $balance->leaveType->allow_hourly = false;
            }
        });
            
        return response()->json($balances);
    }
}


