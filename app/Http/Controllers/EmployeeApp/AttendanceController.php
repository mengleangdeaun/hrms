<?php

namespace App\Http\Controllers\EmployeeApp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\HR\Employee;
use App\Models\Attendance\AttendanceRecord;
use App\Models\AttendanceReasonPreset;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class AttendanceController extends Controller
{
    protected $attendanceService;

    public function __construct(AttendanceService $attendanceService)
    {
        $this->attendanceService = $attendanceService;
    }

    private function getAuthenticatedEmployee(Request $request)
    {
        $token = $request->header('Authorization') ?? $request->bearerToken() ?? $request->auth_token;
        if (!$token) return null;
        $token = str_replace('Bearer ', '', $token);
        return Employee::where('auth_token', $token)->first();
    }

    /**
     * Get the shift rules for today (Proactive Validation).
     */
    public function getShiftToday(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $currentTime = Carbon::now();
        $record = AttendanceRecord::where('employee_id', $employee->id)
                    ->where('date', Carbon::today()->toDateString())
                    ->first();

        $policyInfo = $this->attendanceService->capturePolicySnapshot($employee, $currentTime, $record);

        return response()->json([
            'server_time' => $currentTime->toDateTimeString(),
            'shift' => $policyInfo['shift_snapshot'],
            'policy' => [
                'late_tolerance' => $employee->attendancePolicy?->late_tolerance_minutes ?? 0,
                'early_tolerance' => $employee->attendancePolicy?->early_departure_tolerance_minutes ?? 0,
            ],
            'check_results' => $policyInfo['check_results'],
            'attendance_today' => $record ? [
                'in1' => $record->clock_in_time,
                'out1' => $record->session_1_out_time,
                'in2' => $record->session_2_in_time,
                'out2' => $record->clock_out_time,
                'status' => $record->status
            ] : null,
            'reason_presets' => AttendanceReasonPreset::where('is_active', true)->orderBy('sort_order')->get(),
            'device_binding' => [
                'status' => $employee->device_binding_status,
                'bound_id' => $employee->device_id
            ]
        ]);
    }

    /**
     * Bind the device to the employee.
     */
    public function bindDevice(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $request->validate([
            'device_id' => 'required|string|min:16',
            'force' => 'nullable|boolean'
        ]);

        // 1. Check if THIS device is already bound to ANOTHER employee
        $alreadyBound = Employee::where('device_id', $request->device_id)
            ->where('id', '!=', $employee->id)
            ->where('device_binding_status', 'bound')
            ->first();

        if ($alreadyBound) {
            return response()->json([
                'message' => 'Security Error: This device is already registered to another employee account (' . substr($alreadyBound->full_name, 0, 1) . '***' . ').',
                'code' => 'DEVICE_TAKEN'
            ], 403);
        }

        // 2. If already bound to a DIFFERENT device
        if ($employee->device_binding_status === 'bound' && $employee->device_id !== $request->device_id) {
            if (!$request->force) {
                return response()->json([
                    'message' => 'This account is already linked to another device. Transferring to this device will unbind the previous one.',
                    'code' => 'CONFIRM_BIND',
                    'current_device' => $employee->device_id
                ], 200);
            }
            
            Log::info("Employee {$employee->full_name} ({$employee->id}) forced a device re-bind from {$employee->device_id} to {$request->device_id}");
        }

        $employee->update([
            'device_id' => $request->device_id,
            'device_binding_status' => 'bound',
            'updated_at' => now()
        ]);

        return response()->json([
            'message' => 'Device bound successfully',
            'device_id' => $employee->device_id
        ]);
    }

    /**
     * Enhanced Clock-in with Device Binding verification.
     */
    public function scanClock(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $request->validate([
            'device_id' => 'required|string',
            'payload' => 'nullable|string|required_without:branch_code',
            'branch_code' => 'nullable|string|required_without:payload',
            'signature' => 'nullable|string',
            'user_lat' => 'required|numeric',
            'user_lng' => 'required|numeric',
            'reason' => 'nullable|string|max:500',
            'scanned_at' => 'nullable|date',
        ]);

        // Handle Signed Payload (Dynamic QR)
        $qrData = [];
        if ($request->payload && $request->signature && $request->signature !== 'STATIC') {
            if (!hash_equals(hash_hmac('sha256', base64_decode($request->payload), config('app.key')), $request->signature)) {
                return response()->json(['message' => 'Invalid or tampered QR Code signature.'], 403);
            }
            $qrData = json_decode(base64_decode($request->payload), true);
        }

        try {
            $result = $this->attendanceService->processClockScan($employee, [
                'branch_code' => $qrData['c'] ?? $qrData['code'] ?? $request->branch_code,
                'user_lat' => $request->user_lat,
                'user_lng' => $request->user_lng,
                'payload_lat' => $qrData['lat'] ?? null,
                'payload_lng' => $qrData['lng'] ?? null,
                'allowed_radius' => $qrData['rad'] ?? null,
                'reason' => $request->reason,
                'scanned_at' => $request->scanned_at,
            ]);

            return response()->json($result);
        } catch (\Exception $e) {
            $code = $e->getCode() ?: 400;
            if ($code == 429) return response()->json(['message' => $e->getMessage(), 'action' => 'warning'], 429);
            
            $message = $e->getMessage();
            $distance = null;
            if (preg_match('/Distance: (\d+)m/', $message, $matches)) {
                $distance = (int)$matches[1];
            }

            $isKnownCode = in_array($message, ['BRANCH_NOT_FOUND_QR', 'ATTENDANCE_ALREADY_COMPLETED']);
            
            return response()->json([
                'message' => $isKnownCode 
                    ? ($message === 'BRANCH_NOT_FOUND_QR' ? 'Branch not found. Invalid QR code.' : 'Attendance already completed for today.')
                    : $message,
                'code' => $isKnownCode ? $message : null,
                'distance' => $distance
            ], $code);
        }
    }
}
