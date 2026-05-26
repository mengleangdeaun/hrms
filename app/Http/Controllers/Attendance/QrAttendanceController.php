<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Models\HR\Branch;
use App\Models\HR\Employee;
use App\Models\Attendance\AttendanceRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Jobs\AttendanceTelegramBroadcast;
use App\Models\Attendance\WorkingShift;
use App\Models\Attendance\AttendancePolicy;
use App\Services\AttendanceService;

class QrAttendanceController extends Controller
{
    protected $attendanceService;

    public function __construct(AttendanceService $attendanceService)
    {
        $this->attendanceService = $attendanceService;
    }

    /**
     * Generate the static encoded payload for a specific Branch.
     * Accessible by Admins to print the Wall QR.
     */
    public function generateBranchQr(Branch $branch)
    {
        // Minimal payload for shorter QR codes
        // Geofencing data will be fetched from DB on scan fallback
        $payload = [
            'c' => $branch->code,
        ];

        $jsonPayload = json_encode($payload);
        $signature = hash_hmac('sha256', $jsonPayload, config('app.key'));
        $encoded = base64_encode($jsonPayload);

        return response()->json([
            'branch' => $branch->name,
            'branch_code' => $branch->code,
            'payload' => $branch->code, // Just the raw code
            'signature' => 'STATIC',    // No signature needed for static wall QRs
            'url' => $branch->code      // The QR will contain ONLY the branch code
        ]);
    }

    /**
     * Handle Device Binding during login.
     */
    private function handleDeviceBinding(Employee $employee, Request $request)
    {
        $deviceId = $request->device_id;
        if (!$deviceId) return null; // Backward compatibility or web login

        // 1. Global Device Collision Check (Prevent using someone else's bound device)
        $deviceOwner = Employee::where('device_id', $deviceId)
            ->where('id', '!=', $employee->id)
            ->where('device_binding_status', 'bound')
            ->first();

        if ($deviceOwner) {
            return response()->json([
                'message' => 'Security Violation: This device is registered to another user.',
                'code' => 'DEVICE_TAKEN',
                'instruction' => 'For security reasons, sharing devices for attendance is not permitted.'
            ], 403);
        }

        // 2. Personal Device Binding Check
        if ($employee->device_binding_status === 'bound' && $employee->device_id !== $deviceId) {
            if (!$request->force) {
                return response()->json([
                    'message' => 'Security Error: This device is not registered to your account.',
                    'code' => 'DEVICE_MISMATCH',
                    'instruction' => 'If you have changed devices, you must transfer your account to this device.'
                ], 403);
            }
            
            \Illuminate\Support\Facades\Log::info("Employee {$employee->full_name} ({$employee->id}) forced a device re-bind during login from {$employee->device_id} to {$deviceId}");
        }

        // 3. Perform the bind/update
        $employee->update([
            'device_id' => $deviceId,
            'device_binding_status' => 'bound',
            'updated_at' => now()
        ]);

        return null;
    }

    public function generateEmployeeQr(Employee $employee)
    {
        $result = $this->attendanceService->generateEmployeeQr($employee);
        return response()->json($result);
    }

    /**
     * Authenticate an employee via Email and Password for the PWA.
     */
    public function loginWithCredentials(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'device_id' => 'nullable|string',
            'force' => 'nullable|boolean',
        ]);

        \Illuminate\Support\Facades\Log::info('Login Attempt', ['email' => $request->email]);
        $employee = Employee::where('email', $request->email)->first();

        if (!$employee) {
            \Illuminate\Support\Facades\Log::warning('Login Failed: Employee not found', ['email' => $request->email]);
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        if (!Hash::check($request->password, $employee->password)) {
            \Illuminate\Support\Facades\Log::warning('Login Failed: Password mismatch', ['email' => $request->email]);
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        // Handle Device Binding
        $bindingError = $this->handleDeviceBinding($employee, $request);
        if ($bindingError) return $bindingError;

        // Regenerate auth_token if missing
        if (!$employee->auth_token) {
            $employee->auth_token = Str::random(60);
            $employee->save();
        }

        return response()->json([
            'message' => 'Login successful',
            'employee' => [
                'name' => $employee->full_name,
                'code' => $employee->employee_code,
                'profile_image' => $employee->profile_image
            ],
            'auth_token' => $employee->auth_token
        ]);
    }

    /**
     * The endpoint hit by the Employee App when scanning their personal Auth QR.
     * We decrypt and exchange the payload for the raw token safely inside their localstorage.
     */
    public function employeeLogin(Request $request)
    {
        $request->validate([
            'payload' => 'required|string',
            'device_id' => 'nullable|string',
            'force' => 'nullable|boolean',
        ]);

        try {
            // Debugging what we receive from the PWA scanner
            \Illuminate\Support\Facades\Log::info('QR Login Attempt', ['payload_received' => $request->payload]);

            $decoded = json_decode(base64_decode($request->payload), true);
            
            if (!$decoded || !isset($decoded['type']) || $decoded['type'] !== 'employee_login') {
                \Illuminate\Support\Facades\Log::error('QR Login Decode Failed', ['decoded_data' => $decoded]);
                return response()->json(['message' => 'Invalid QR Code format. Please scan a Personal QR Code (not a Branch QR).'], 400);
            }

            $rawToken = Crypt::decryptString($decoded['auth_token']);
            $employee = Employee::where('employee_code', $decoded['employee_code'])
                                ->where('auth_token', $rawToken)
                                ->first();

            if (!$employee) {
                \Illuminate\Support\Facades\Log::warning('QR Login Auth Mismatch', [
                    'scanned_code' => $decoded['employee_code'],
                    'scanned_token' => $rawToken
                ]);
                return response()->json(['message' => 'Invalid or expired credentials.'], 401);
            }

            // Handle Device Binding
            $bindingError = $this->handleDeviceBinding($employee, $request);
            if ($bindingError) return $bindingError;

            return response()->json([
                'message' => 'Login successful',
                'employee' => [
                    'name' => $employee->full_name,
                    'code' => $employee->employee_code,
                    'profile_image' => $employee->profile_image
                ],
                'auth_token' => $rawToken // The frontend saves this and sends it for daily clock-ins
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to process QR Code. ' . $e->getMessage()], 400);
        }
    }

    public function scanClock(Request $request)
    {
        $request->validate([
            'auth_token' => 'required|string',
            'payload' => 'nullable|string|required_without:branch_code',
            'branch_code' => 'nullable|string|required_without:payload',
            'signature' => 'nullable|string',
            'user_lat' => 'required|numeric',
            'user_lng' => 'required|numeric',
            'reason' => 'nullable|string|max:500',
        ]);

        // 1. Authenticate Employee via Token
        $employee = Employee::where('auth_token', $request->auth_token)->first();
        if (!$employee) {
            return response()->json(['message' => 'Unauthorized. Please scan your Personal Login QR again.'], 401);
        }

        // 2. Extract Data from Payload or Legacy
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
            ]);

            return response()->json($result);
        } catch (\Exception $e) {
            $code = $e->getCode() ?: 400;
            if ($code == 429) return response()->json(['message' => $e->getMessage(), 'action' => 'warning'], 429);
            return response()->json(['message' => $e->getMessage()], $code);
        }
    }

}
