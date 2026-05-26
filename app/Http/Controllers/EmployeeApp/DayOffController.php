<?php

namespace App\Http\Controllers\EmployeeApp;

use App\Http\Controllers\Controller;
use App\Models\HR\DayOffRequest;
use App\Models\HR\Employee;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class DayOffController extends Controller
{
    /**
     * Helper to authenticate the device token passively without Laravel Sanctum overhead for the minimal PWA.
     */
    private function getAuthenticatedEmployee(Request $request)
    {
        $token = $request->header('Authorization') ?? $request->bearerToken();
        if (!$token) return null;
        $token = str_replace('Bearer ', '', $token);
        return Employee::where('auth_token', $token)->first();
    }

    /**
     * Get employee's current day-off info and working shift context.
     */
    public function index(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $employee->load(['workingShift:id,name,working_days']);

        // Get resolved days off (priority: custom assignment → shift fallback)
        $activeDaysOff = $employee->getActiveDaysOff();
        $activeDayOff = $employee->dayOffs()->active()->orderByDesc('created_at')->first();

        // Determine source
        $source = $activeDayOff ? 'custom' : 'shift';

        // Get shift non-working days for context
        $shiftDaysOff = [];
        if ($employee->workingShift && $employee->workingShift->working_days) {
            foreach ($employee->workingShift->working_days as $dayName => $config) {
                if (is_array($config) && empty($config['is_working'])) {
                    $shiftDaysOff[] = $dayName;
                }
            }
        }

        return response()->json([
            'resolved_days_off' => $activeDaysOff,
            'day_off_source'    => $source,
            'working_shift'     => $employee->workingShift ? [
                'id'   => $employee->workingShift->id,
                'name' => $employee->workingShift->name,
            ] : null,
            'shift_days_off'    => $shiftDaysOff,
            'assignment'        => $activeDayOff ? [
                'id'             => $activeDayOff->id,
                'days_off'       => $activeDayOff->days_off,
                'frequency'      => $activeDayOff->frequency,
                'weeks_of_month' => $activeDayOff->weeks_of_month,
                'specific_dates' => $activeDayOff->specific_dates,
                'effective_from' => $activeDayOff->effective_from?->format('Y-m-d'),
                'effective_to'   => $activeDayOff->effective_to?->format('Y-m-d'),
                'notes'          => $activeDayOff->notes,
            ] : null,
            // Flattened for PWA Index.tsx consumption
            'day_off_frequency'      => $activeDayOff?->frequency,
            'day_off_weeks'          => $activeDayOff?->weeks_of_month,
            'day_off_specific_dates' => $activeDayOff?->specific_dates,
        ]);
    }

    /**
     * Get employee's own day-off change requests.
     */
    public function myRequests(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $requests = DayOffRequest::where('employee_id', $employee->id)
            ->with('approver:id,full_name')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($requests);
    }

    /**
     * Submit a day-off change request.
     */
    public function store(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $validated = $request->validate([
            'frequency'            => 'required|in:weekly,monthly,specific_dates',
            'requested_days_off'   => 'required_if:frequency,weekly,monthly|array',
            'requested_days_off.*' => 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'weeks_of_month'       => 'required_if:frequency,monthly|array',
            'weeks_of_month.*'     => 'integer|min:1|max:5',
            'specific_dates'       => 'required_if:frequency,specific_dates|array',
            'specific_dates.*'     => 'date|after_or_equal:today',
            'effective_from'       => 'required|date|after_or_equal:today',
            'effective_to'         => 'nullable|date|after_or_equal:effective_from',
            'reason'               => 'required|string|max:500',
        ]);

        // Check for existing pending request
        $existingPending = DayOffRequest::where('employee_id', $employee->id)
            ->where('status', 'pending')
            ->exists();

        if ($existingPending) {
            return response()->json([
                'message' => 'You already have a pending day-off change request. Please wait for it to be processed or cancel it first.',
            ], 422);
        }

        $currentDaysOff = $employee->getActiveDaysOff();

        $dayOffRequest = DayOffRequest::create([
            'employee_id'        => $employee->id,
            'request_type'       => 'change',
            'current_days_off'   => $currentDaysOff,
            'frequency'          => $validated['frequency'],
            'requested_days_off' => $validated['requested_days_off'] ?? [],
            'weeks_of_month'     => $validated['weeks_of_month'] ?? null,
            'specific_dates'     => $validated['specific_dates'] ?? null,
            'effective_from'     => $validated['effective_from'],
            'effective_to'       => $validated['effective_to'] ?? null,
            'reason'             => $validated['reason'],
            'status'             => 'pending',
        ]);

        // Notify admin / line manager
        NotificationService::dayOffRequested($dayOffRequest);

        return response()->json([
            'message' => 'Day off change request submitted successfully.',
            'data'    => $dayOffRequest,
        ], 201);
    }

    /**
     * Get pending day-off requests from subordinates (Team Approvals).
     */
    public function approvals(Request $request)
    {
        $manager = $this->getAuthenticatedEmployee($request);
        if (!$manager) return response()->json(['message' => 'Unauthorized'], 401);

        // Get subordinates' IDs (Bypass branch isolation as managers might have cross-branch subordinates)
        $subordinateIds = Employee::withoutGlobalScope('branch_isolation')->where('line_manager_id', $manager->id)->pluck('id');

        $requests = DayOffRequest::whereIn('employee_id', $subordinateIds)
            ->where('status', 'pending')
            ->with('employee:id,full_name,employee_id,profile_image')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($requests);
    }

    /**
     * Approve a subordinate's day-off request.
     */
    public function approve(Request $request, $id)
    {
        $manager = $this->getAuthenticatedEmployee($request);
        if (!$manager) return response()->json(['message' => 'Unauthorized'], 401);

        $dayOffRequest = DayOffRequest::findOrFail($id);
        
        // Verify manager authority
        if ($dayOffRequest->employee->line_manager_id !== $manager->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($dayOffRequest->status !== 'pending') {
            return response()->json(['message' => 'Request is already processed'], 422);
        }

        $dayOffRequest->update([
            'status'      => 'approved',
            'approved_by' => $manager->id,
            'approved_at' => now(),
        ]);

        // Deactivate existing active records to ensure the new one takes precedence
        $dayOffRequest->employee->dayOffs()->where('is_active', true)->update(['is_active' => false]);

        // APPLY THE CHANGE: Create/Update EmployeeDayOff record
        $dayOffRequest->employee->dayOffs()->create([
            'request_id'     => $dayOffRequest->id,
            'days_off'       => $dayOffRequest->requested_days_off,
            'frequency'      => $dayOffRequest->frequency,
            'weeks_of_month' => $dayOffRequest->weeks_of_month,
            'specific_dates' => $dayOffRequest->specific_dates,
            'effective_from' => $dayOffRequest->effective_from,
            'effective_to'   => $dayOffRequest->effective_to,
            'notes'          => "Approved by Manager: " . $manager->full_name . ". Reason: " . $dayOffRequest->reason,
            'is_active'      => true,
            'assigned_by'    => $manager->id,
        ]);

        // Notify employee
        NotificationService::dayOffApproved($dayOffRequest);

        return response()->json(['message' => 'Day off request approved.']);
    }

    /**
     * Reject a subordinate's day-off request.
     */
    public function reject(Request $request, $id)
    {
        $manager = $this->getAuthenticatedEmployee($request);
        if (!$manager) return response()->json(['message' => 'Unauthorized'], 401);

        $dayOffRequest = DayOffRequest::findOrFail($id);
        
        // Verify manager authority
        if ($dayOffRequest->employee->line_manager_id !== $manager->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($dayOffRequest->status !== 'pending') {
            return response()->json(['message' => 'Request is already processed'], 422);
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $dayOffRequest->update([
            'status'           => 'rejected',
            'approved_by'      => $manager->id,
            'rejection_reason' => $validated['rejection_reason'],
            'approved_at'      => now(),
        ]);

        // Notify employee
        NotificationService::dayOffRejected($dayOffRequest);

        return response()->json(['message' => 'Day off request rejected.']);
    }

    /**
     * Cancel a pending request.
     */
    public function cancel(Request $request, $id)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $dayOffRequest = DayOffRequest::where('id', $id)
            ->where('employee_id', $employee->id)
            ->where('status', 'pending')
            ->firstOrFail();

        $dayOffRequest->delete();

        return response()->json(['message' => 'Request cancelled.']);
    }
}
