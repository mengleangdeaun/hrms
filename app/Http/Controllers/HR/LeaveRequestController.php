<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Leave\LeaveRequest;
use App\Models\Leave\LeaveBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;

class LeaveRequestController extends Controller
{
    /**
     * Display a listing of all leave requests for HR admins.
     */
    public function index(Request $request)
    {
        $query = $this->buildQuery($request);
        $perPage = $request->input('per_page', 10);
        $paginatedData = $query->paginate($perPage);

        return \App\Http\Resources\HR\LeaveRequestResource::collection($paginatedData);
    }

    /**
     * Export leave requests to CSV.
     */
    public function export(Request $request)
    {
        $query = $this->buildQuery($request);
        $records = $query->get();

        $filename = "leave_records_" . date('Y-m-d') . ".csv";
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['ID', 'Employee', 'Employee ID', 'Leave Type', 'Start Date', 'End Date', 'Total Days', 'Duration Type', 'Reason', 'Status', 'Requested At', 'Actioned By', 'Actioned At', 'Rejection Reason'];

        $callback = function() use($records, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($records as $record) {
                fputcsv($file, [
                    $record->id,
                    $record->employee?->full_name,
                    $record->employee?->employee_id,
                    $record->leaveType?->name,
                    $record->start_date,
                    $record->end_date,
                    $record->total_days,
                    $record->duration_type,
                    $record->reason,
                    strtoupper($record->status),
                    $record->created_at?->format('Y-m-d H:i:s'),
                    $record->approver?->full_name,
                    $record->actioned_at ? \Carbon\Carbon::parse($record->actioned_at)->format('Y-m-d H:i:s') : '—',
                    $record->rejection_reason ?: '—',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Common query builder for leave requests.
     */
    protected function buildQuery(Request $request)
    {
        $query = LeaveRequest::with([
            'employee' => function($q) {
                $q->select('id', 'full_name', 'employee_id', 'profile_image');
            },
            'leaveType' => function($q) {
                $q->select('id', 'name', 'color');
            },
            'approver' => function($q) {
                $q->select('id', 'full_name');
            }
        ]);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%")
                  ->orWhere('employee_code', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($request->filled('status') && $request->status !== 'ALL_STATUSES') {
            $query->where('status', $request->status);
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $startDate = $request->start_date;
            $endDate = $request->end_date;
            $query->where(function($q) use ($startDate, $endDate) {
                $q->whereBetween('start_date', [$startDate, $endDate])
                  ->orWhereBetween('end_date', [$startDate, $endDate])
                  ->orWhere(function($q2) use ($startDate, $endDate) {
                      $q2->where('start_date', '<=', $startDate)
                         ->where('end_date', '>=', $endDate);
                  });
            });
        }

        // Sorting
        $sortField = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        
        if ($sortField === 'employee') {
            $query->join('employees', 'leave_requests.employee_id', '=', 'employees.id')
                  ->orderBy('employees.full_name', $sortDirection)
                  ->select('leave_requests.*');
        } else if ($sortField === 'leave_type') {
            $query->join('leave_types', 'leave_requests.leave_type_id', '=', 'leave_types.id')
                  ->orderBy('leave_types.name', $sortDirection)
                  ->select('leave_requests.*');
        } else {
            $query->orderBy($sortField, $sortDirection);
        }

        return $query;
    }

    /**
     * Display the specified leave request.
     */
    public function show($id)
    {
        $request = LeaveRequest::with(['employee', 'leaveType', 'approver'])->findOrFail($id);
        return new \App\Http\Resources\HR\LeaveRequestResource($request);
    }

    /**
     * Approve a pending leave request and deduct the balance.
     */
    public function approve(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $leaveRequest = LeaveRequest::findOrFail($id);

            if ($leaveRequest->status !== 'pending') {
                return response()->json(['message' => 'Only pending requests can be approved.'], 422);
            }

            // Find the balance for this year
            $currentYear = date('Y');
            $balance = LeaveBalance::where('employee_id', $leaveRequest->employee_id)
                ->where('leave_type_id', $leaveRequest->leave_type_id)
                ->where('year', $currentYear)
                ->first();

            if (!$balance || $balance->balance < $leaveRequest->total_days) {
                return response()->json(['message' => 'Insufficient leave balance to approve this request.'], 422);
            }

            // Update Request Status
            $leaveRequest->status = 'approved';
            $leaveRequest->actioned_at = now();
            
            // Set the approver to the current authenticated user's employee ID
            if (auth()->check()) {
                $user = auth()->user();
                if ($user->employee) {
                    $leaveRequest->approved_by = $user->employee->id;
                }
            }

            $leaveRequest->save();

            // Deduct Balance
            $balance->total_taken += $leaveRequest->total_days;
            $balance->balance -= $leaveRequest->total_days;
            $balance->save();

            DB::commit();

            // Broadcast to Telegram
            resolve(\App\Services\TelegramService::class)->broadcast('hr.leave_approved', $leaveRequest->load(['employee', 'leaveType']));

            // Dispatch PWA Notification
            NotificationService::leaveApproved($leaveRequest);

            return new \App\Http\Resources\HR\LeaveRequestResource($leaveRequest->load(['employee', 'leaveType']));

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to approve request: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Reject a pending leave request with a reason.
     */
    public function reject(Request $request, $id)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $leaveRequest = LeaveRequest::findOrFail($id);

        if ($leaveRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be rejected.'], 422);
        }

        $leaveRequest->status = 'rejected';
        $leaveRequest->rejection_reason = $validated['rejection_reason'];
        $leaveRequest->actioned_at = now();

        // Set the actioner to the current authenticated user's employee ID
        if (auth()->check()) {
            $user = auth()->user();
            if ($user->employee) {
                $leaveRequest->approved_by = $user->employee->id;
            }
        }

        $leaveRequest->save();

        // Broadcast to Telegram
        resolve(\App\Services\TelegramService::class)->broadcast('hr.leave_rejected', $leaveRequest->load(['employee', 'leaveType']));

        // Dispatch PWA Notification
        NotificationService::leaveRejected($leaveRequest);

        return new \App\Http\Resources\HR\LeaveRequestResource($leaveRequest->load(['employee', 'leaveType']));
    }

    /**
     * Remove the specified resource from storage (Admins only)
     */
    public function destroy($id)
    {
        $leaveRequest = LeaveRequest::findOrFail($id);

        if ($leaveRequest->status === 'approved') {
            return response()->json(['message' => 'Cannot delete an already approved request. Consider reverting it first.'], 422);
        }

        $leaveRequest->delete();
        return response()->json(null, 204);
    }
}


