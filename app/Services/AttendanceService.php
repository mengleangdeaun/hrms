<?php

namespace App\Services;

use App\Models\HR\Branch;
use App\Models\HR\Employee;
use App\Models\Attendance\AttendanceRecord;
use Carbon\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AttendanceService
{
    /**
     * Calculate distance between two lat/lng points in meters.
     */
    public function calculateDistanceMeters($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000;

        $latDelta = deg2rad($lat2 - $lat1);
        $lonDelta = deg2rad($lon2 - $lon1);

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($lonDelta / 2) * sin($lonDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Generate personal login QR data for an employee.
     */
    public function generateEmployeeQr(Employee $employee)
    {
        if (!$employee->auth_token) {
            $employee->auth_token = \Illuminate\Support\Str::random(60);
            $employee->save();
        }

        $secretPayload = [
            'type' => 'employee_login',
            'employee_code' => $employee->employee_code,
            'auth_token' => Crypt::encryptString($employee->auth_token),
        ];

        return [
            'employee' => $employee->full_name,
            'payload' => base64_encode(json_encode($secretPayload)),
            'url' => config('app.url') . "/employee/login?payload=" . base64_encode(json_encode($secretPayload))
        ];
    }

    /**
     * Process a clock-in/out attempt.
     */
    public function processClockScan(Employee $employee, array $data)
    {
        $branchCode = $data['branch_code'];
        $userLat = $data['user_lat'];
        $userLng = $data['user_lng'];
        $payloadLat = $data['payload_lat'] ?? null;
        $payloadLng = $data['payload_lng'] ?? null;
        $allowedRadius = $data['allowed_radius'] ?? null;
        $reason = $data['reason'] ?? null;

        $branch = Branch::where('code', $branchCode)->first();
        if (!$branch) {
            throw new \Exception('BRANCH_NOT_FOUND_QR', 404);
        }

        // Determine target coordinates (prioritize signed payload, fallback to branch DB)
        $targetLat = $payloadLat ?? $branch->lat;
        $targetLng = $payloadLng ?? $branch->lng;
        $finalAllowedRadius = $allowedRadius ?? ($branch->allowed_radius ?? 100);

        // Distance verification
        $distance = $this->calculateDistanceMeters($targetLat, $targetLng, $userLat, $userLng);
        
        // 100m radius + 30m fallback grace for jittery GPS
        if ($distance > ($finalAllowedRadius + 30)) {
            throw new \Exception("You are too far from the branch. Distance: " . round($distance) . "m");
        }

        return DB::transaction(function () use ($employee, $branch, $userLat, $userLng, $reason, $data) {
            $today = Carbon::today()->toDateString();
            $serverTime = Carbon::now();
            $currentTime = isset($data['scanned_at']) ? Carbon::parse($data['scanned_at'])->setTimezone(config('app.timezone')) : $serverTime;
            
            // Security: Prevent future-dating or using old scans (max 5 min drift)
            if ($currentTime->gt($serverTime->copy()->addMinute()) || $currentTime->lt($serverTime->copy()->subMinutes(5))) {
                $currentTime = $serverTime;
            }

            $locationString = "{$userLat},{$userLng}";

            $record = AttendanceRecord::where('employee_id', $employee->id)
                ->where('date', $today)
                ->lockForUpdate()
                ->first();

            // Policy Snapshots
            $policyInfo = $this->capturePolicySnapshot($employee, $currentTime, $record);

            // STOP: If reason is required but not provided, don't save yet.
            // This prevents duplicate scan conflicts when the frontend sends the reason in a second request.
            if (!empty($policyInfo['check_results']['require_reason']) && empty($reason)) {
                return array_merge([
                    'message' => 'Reason required for this attendance log.',
                    'require_reason' => true,
                    'action' => 'warning'
                ], $policyInfo['check_results']);
            }

            $shiftSnapshot = $policyInfo['shift_snapshot'];
            $isSplit = ($shiftSnapshot['day_shift_type'] ?? 'regular') === 'split';

            if (!$record) {
                // INITIAL CLOCK IN (Slot 1)
                $record = AttendanceRecord::create([
                    'employee_id' => $employee->id,
                    'branch_id' => $branch->id,
                    'date' => $today,
                    'clock_in_time' => $currentTime,
                    'clock_in_location' => $locationString,
                    'status' => 'Present',
                    'late_reason' => $reason,
                    'late_minutes' => ($policyInfo['check_results']['type'] ?? '') === 'late' ? ($policyInfo['check_results']['minutes'] ?? 0) : 0,
                    'warning_minutes' => ($policyInfo['check_results']['type'] ?? '') === 'warning' ? ($policyInfo['check_results']['minutes'] ?? 0) : 0,
                    'early_minutes' => ($policyInfo['check_results']['type'] ?? '') === 'early' ? ($policyInfo['check_results']['minutes'] ?? 0) : 0,
                    'in_status' => ($policyInfo['check_results']['type'] ?? null) ? 'In-' . ucfirst(str_replace('_', ' ', $policyInfo['check_results']['type'])) : 'In-On time',
                    'shift_config_snapshot' => $shiftSnapshot,
                    'policy_config_snapshot' => $policyInfo['policy_snapshot'],
                ]);
                $action = 'success';
            } else {
                // Determine the next available slot based on shift type
                $lastScanTime = null;
                $targetField = null;
                $locationField = null;
                $reasonField = null;

                if ($isSplit) {
                    if (!$record->session_1_out_time) {
                        $targetField = 'session_1_out_time';
                        $locationField = 'session_1_out_location';
                        $reasonField = 'early_departure_reason'; // Break start check
                        $lastScanTime = $record->clock_in_time;
                    } else if (!$record->session_2_in_time) {
                        $targetField = 'session_2_in_time';
                        $locationField = 'session_2_in_location';
                        $reasonField = 'late_reason'; // Break end check
                        $lastScanTime = $record->session_1_out_time;
                    } else if (!$record->clock_out_time) {
                        $targetField = 'clock_out_time';
                        $locationField = 'clock_out_location';
                        $reasonField = 'early_departure_reason';
                        $lastScanTime = $record->session_2_in_time;
                    }
                } else {
                    // Regular shift logic
                    if (!$record->clock_out_time) {
                        $targetField = 'clock_out_time';
                        $locationField = 'clock_out_location';
                        $reasonField = 'early_departure_reason';
                        $lastScanTime = $record->clock_in_time;
                    }
                }

                if (!$targetField) {
                    throw new \Exception('ATTENDANCE_ALREADY_COMPLETED', 400);
                }

                // Check for duplicate scan (moved before reason update to be safe)
                if ($lastScanTime) {
                    $lastScan = Carbon::parse($lastScanTime);
                    if (abs($currentTime->diffInSeconds($lastScan)) < 5) {
                        Log::info("Duplicate scan suppressed for employee {$employee->id}");
                        return [
                            'message' => 'Attendance already recorded',
                            'time' => $lastScan->format('h:i A'),
                            'action' => 'success',
                            'is_duplicate' => true
                        ];
                    }
                }

                // Update the identified slot
                $updateData = [
                    $targetField => $currentTime,
                    $locationField => $locationString,
                    $reasonField => $reason ? ($record->$reasonField ? $record->$reasonField . " | " . $reason : $reason) : $record->$reasonField,
                ];

                // Sync immediate status if we have it
                if (!empty($policyInfo['check_results']['type'])) {
                    $type = $policyInfo['check_results']['type'];
                    $mins = $policyInfo['check_results']['minutes'] ?? 0;
                    if ($type === 'early_departure') {
                        $updateData['early_departure_minutes'] = $mins;
                        $updateData['out_status'] = 'Out-Early Departure';
                    }
                }

                $record->update($updateData);
                $action = 'success';
            }

            // Dispatch Policy Processing & Real-time Update
            \App\Jobs\ProcessAttendancePolicy::dispatch($record->id, $reason);
            Log::info("📡 Broadcasting AttendanceLogged for employee: {$employee->full_name} ({$employee->id})");
            broadcast(new \App\Events\AttendanceLogged($record));

            return array_merge([
                'message' => 'Attendance Recorded Successfully',
                'time' => $currentTime->format('h:i A'),
                'action' => $action
            ], $policyInfo['check_results']);
        });
    }

    /**
     * Capture policy snapshots and perform preliminary checks.
     */
    public function capturePolicySnapshot(Employee $employee, Carbon $currentTime, $record)
    {
        $shift = $employee->workingShift;
        $policy = $employee->attendancePolicy;
        $dayName = strtolower($currentTime->format('l'));
        $dayConfig = $shift ? ($shift->working_days[$dayName] ?? null) : null;
        $dayShiftType = $dayConfig ? ($dayConfig['day_shift_type'] ?? ($shift->shift_type ?? 'regular')) : ($shift?->shift_type ?? 'regular');

        $checkResults = [];
        $shiftSnapshot = $dayConfig ? array_merge($dayConfig, ['day_shift_type' => $dayShiftType]) : ['day_shift_type' => $dayShiftType, 'is_working' => false];
        $policySnapshot = $policy ? $policy->toArray() : null;

        if ($dayConfig && ($dayConfig['is_working'] ?? false) && $policy) {
            $tolerance = $policy->late_tolerance_minutes ?? 0;
            $dateStr = $currentTime->toDateString();

            if (!$record) { // Check Late
                $scheduled = Carbon::parse($dateStr . ' ' . ($dayConfig['start_time'] ?? '00:00'));
                if ($currentTime->gt($scheduled->copy()->addMinutes($tolerance))) {
                    $checkResults = [
                        'require_reason' => true,
                        'type' => 'late',
                        'minutes' => (int) abs($currentTime->diffInMinutes($scheduled))
                    ];
                }
            } else if (!$record->clock_out_time) { // Check Early
                $isSplit = $dayShiftType === 'split';
                
                // Determine what we are checking against
                $checkingSession1Out = $isSplit && !$record->session_1_out_time;
                $checkingSession2In = $isSplit && $record->session_1_out_time && !$record->session_2_in_time;
                $checkingFinalOut = !$isSplit || ($record->session_2_in_time && !$record->clock_out_time);

                if ($checkingSession1Out && isset($dayConfig['break_start'])) {
                    $scheduled = Carbon::parse($dateStr . ' ' . $dayConfig['break_start']);
                    $earlyTolerance = $policy->early_departure_tolerance_minutes ?? 0;
                    if ($currentTime->lt($scheduled->copy()->subMinutes($earlyTolerance))) {
                        $checkResults = [
                            'require_reason' => true,
                            'type' => 'early_departure',
                            'minutes' => (int) abs($currentTime->diffInMinutes($scheduled))
                        ];
                    }
                } else if ($checkingSession2In && isset($dayConfig['break_end'])) {
                    $scheduled = Carbon::parse($dateStr . ' ' . $dayConfig['break_end']);
                    $tolerance = $policy->late_tolerance_minutes ?? 0;
                    if ($currentTime->gt($scheduled->copy()->addMinutes($tolerance))) {
                        $checkResults = [
                            'require_reason' => true,
                            'type' => 'late',
                            'minutes' => (int) abs($currentTime->diffInMinutes($scheduled))
                        ];
                    }
                } else if ($checkingFinalOut) {
                    $scheduled = Carbon::parse($dateStr . ' ' . ($dayConfig['end_time'] ?? '23:59'));
                    $earlyTolerance = $policy->early_departure_tolerance_minutes ?? 0;
                    if ($currentTime->lt($scheduled->copy()->subMinutes($earlyTolerance))) {
                        $checkResults = [
                            'require_reason' => true,
                            'type' => 'early_departure',
                            'minutes' => (int) abs($currentTime->diffInMinutes($scheduled))
                        ];
                    }
                }
            }
        }

        return [
            'shift_snapshot' => $shiftSnapshot,
            'policy_snapshot' => $policySnapshot,
            'check_results' => $checkResults
        ];
    }
}
