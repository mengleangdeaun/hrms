<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\DayOffRequest;
use App\Models\HR\EmployeeDayOff;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class DayOffRequestController extends Controller
{
    /**
     * List all day-off change requests.
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $status = $request->input('status');
        $branchId = $request->input('branch_id');
        $deptId = $request->input('department_id');
        $empId = $request->input('employee_id');
        $search = $request->input('search');

        $query = DayOffRequest::with([
            'employee:id,full_name,employee_id,profile_image,branch_id,department_id',
            'employee.branch:id,name',
            'employee.department:id,name',
            'approver:id,full_name',
        ])
        ->orderByDesc('created_at');

        if ($status && $status !== 'ALL') {
            $query->where('status', $status);
        }
        
        if ($branchId && $branchId !== 'ALL') {
            $query->whereHas('employee', fn($q) => $q->where('branch_id', $branchId));
        }

        if ($deptId && $deptId !== 'ALL') {
            $query->whereHas('employee', fn($q) => $q->where('department_id', $deptId));
        }

        if ($empId && $empId !== 'ALL') {
            $query->where('employee_id', $empId);
        }

        if ($search) {
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate($perPage));
    }

    /**
     * Approve a day-off change request.
     */
    public function approve(Request $request, $id)
    {
        $dayOffRequest = DayOffRequest::findOrFail($id);

        if ($dayOffRequest->status !== 'pending') {
            return response()->json(['message' => 'This request has already been processed.'], 422);
        }

        $approver = $request->user()?->employee;

        // Update request status
        $dayOffRequest->update([
            'status'      => 'approved',
            'approved_by' => $approver?->id,
            'actioned_at' => now(),
        ]);

        // Deactivate existing day-off assignments for this employee
        EmployeeDayOff::where('employee_id', $dayOffRequest->employee_id)
            ->where('is_active', true)
            ->update(['is_active' => false]);

        // Create new day-off assignment from the approved request
        EmployeeDayOff::create([
            'employee_id'    => $dayOffRequest->employee_id,
            'days_off'       => $dayOffRequest->requested_days_off,
            'frequency'      => $dayOffRequest->frequency ?? 'weekly',
            'weeks_of_month' => $dayOffRequest->weeks_of_month,
            'specific_dates' => $dayOffRequest->specific_dates,
            'effective_from' => $dayOffRequest->effective_from,
            'effective_to'   => $dayOffRequest->effective_to,
            'assigned_by'    => $approver?->id,
            'notes'          => 'Approved from request #' . $dayOffRequest->id,
            'is_active'      => true,
        ]);

        // Notify employee
        NotificationService::dayOffApproved($dayOffRequest);

        return response()->json(['message' => 'Day off request approved.']);
    }

    /**
     * Reject a day-off change request.
     */
    public function reject(Request $request, $id)
    {
        $dayOffRequest = DayOffRequest::findOrFail($id);

        if ($dayOffRequest->status !== 'pending') {
            return response()->json(['message' => 'This request has already been processed.'], 422);
        }

        $validated = $request->validate([
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $approver = $request->user()?->employee;

        $dayOffRequest->update([
            'status'           => 'rejected',
            'approved_by'      => $approver?->id,
            'rejection_reason' => $validated['rejection_reason'] ?? null,
            'actioned_at'      => now(),
        ]);

        // Notify employee
        NotificationService::dayOffRejected($dayOffRequest);

        return response()->json(['message' => 'Day off request rejected.']);
    }
}
