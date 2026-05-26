<?php

namespace App\Jobs;

use App\Models\Attendance\AttendanceRecord;
use App\Models\HR\Employee;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessAttendancePolicy implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $recordId;
    protected $reason;

    /**
     * Create a new job instance.
     */
    public function __construct(int $recordId, ?string $reason = null)
    {
        $this->recordId = $recordId;
        $this->reason = $reason;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $record = AttendanceRecord::with(['employee.workingShift', 'employee.attendancePolicy'])->find($this->recordId);
        
        if (!$record || !$record->employee) {
            Log::error('ProcessAttendancePolicy: Record or Employee mapping missing.', ['record_id' => $this->recordId]);
            return;
        }

        // 1. Identify Snapshot or Current Source of Truth
        $dayConfig = $record->shift_config_snapshot;
        $policyData = $record->policy_config_snapshot;
        
        // Fallback to current employee config if snapshot is missing (for legacy records)
        if (!$dayConfig) {
            $shift = $record->employee->workingShift;
            if (!$shift) {
                Log::error('ProcessAttendancePolicy: No shift config or snapshot found.', ['record_id' => $this->recordId]);
                return;
            }
            $dayName = strtolower(Carbon::parse($record->date)->format('l'));
            $dayConfig = $shift->working_days[$dayName] ?? null;
            
            if ($dayConfig) {
                $dayConfig['day_shift_type'] = $dayConfig['day_shift_type'] ?? ($shift->shift_type ?? 'regular');
            }
        }

        if (!$policyData) {
            $policyModel = $record->employee->attendancePolicy;
            $policyData = $policyModel ? $policyModel->toArray() : null;
        }

        if (!$dayConfig || !($dayConfig['is_working'] ?? false)) {
            Log::warning('ProcessAttendancePolicy: Non-working day or missing config.', ['record_id' => $this->recordId]);
            return;
        }

        // Convert policy array to object for easier access (to match previous logic expectations if needed, but array access is safer)
        $policy = (object) $policyData;
        $dayShiftType = $dayConfig['day_shift_type'] ?? 'regular';
        $isSplit = $dayShiftType === 'split';
        $dateStr = Carbon::parse($record->date)->toDateString();

        // 1. Define Scheduled Target Points (Standardized to App Timezone then UTC)
        $targets = [
            's1_in' => Carbon::parse($dateStr . ' ' . ($dayConfig['start_time'] ?? '00:00')),
            's1_out' => $isSplit && isset($dayConfig['break_start']) 
                ? Carbon::parse($dateStr . ' ' . $dayConfig['break_start'])
                : null,
            's2_in' => $isSplit && isset($dayConfig['break_end'])
                ? Carbon::parse($dateStr . ' ' . $dayConfig['break_end'])
                : null,
            's2_out' => Carbon::parse($dateStr . ' ' . ($dayConfig['end_time'] ?? '23:59')),
        ];

        // 2. Reset Aggregated Metrics before re-calculation to prevent doubling
        $record->late_minutes = 0;
        $record->early_minutes = 0;
        $record->warning_minutes = 0;
        $record->early_departure_minutes = 0;
        $record->overtime_minutes = 0;
        $record->stay_late_minutes = 0;

        $calculatePoint = function($time, $scheduled, $isOut = false) use ($policy) {
            if (!$time || !$scheduled || !$policy) return null;

            $lateTolerance = $policy->late_tolerance_minutes ?? 0;
            $earlyDepartureTolerance = $policy->early_departure_tolerance_minutes ?? 0;
            $overtimeMinimum = $policy->overtime_minimum_minutes ?? 90;
            
            // Ensure they are in the same timeframe for comparison
            // Carbon handles this, but let's be safe
            $time = $time->copy();
            $scheduled = $scheduled->copy();

            if (!$isOut) {
                // CLOCK IN LOGIC
                if ($time->lt($scheduled)) {
                    $mins = (int) abs($scheduled->diffInMinutes($time));
                    return ['status' => ($mins <= $lateTolerance ? 'In-On time' : 'Early'), 'mins' => $mins, 'type' => 'early'];
                }
                
                $mins = (int) abs($time->diffInMinutes($scheduled));
                if ($time->lte($scheduled->copy()->addMinutes($lateTolerance))) {
                    return ['status' => 'Warning', 'mins' => $mins, 'type' => 'warning'];
                }
                return ['status' => 'Late', 'mins' => $mins, 'type' => 'late'];
            } else {
                // CLOCK OUT LOGIC
                if ($time->lt($scheduled->copy()->subMinutes($earlyDepartureTolerance))) {
                    return ['status' => 'Early Departure', 'mins' => (int) abs($scheduled->diffInMinutes($time)), 'type' => 'early_departure'];
                }
                
                if ($time->lte($scheduled->copy()->addMinutes($overtimeMinimum))) {
                    $stayLate = 0;
                    $status = 'Out-On time';
                    $type = 'out_on_time';

                    if ($time->gt($scheduled)) {
                        $stayLate = (int) abs($time->diffInMinutes($scheduled));
                        $status = 'Stay Late';
                        $type = 'stay_late';
                    }
                    return ['status' => $status, 'mins' => $stayLate, 'type' => $type];
                }
                
                return ['status' => 'Overtime', 'mins' => (int) abs($time->diffInMinutes($scheduled)), 'type' => 'overtime'];
            }
        };

        // 3. Process all available timestamps
        $scans = [
            's1_in' => ['time' => $record->clock_in_time, 'out' => false],
            's1_out' => ['time' => $record->session_1_out_time, 'out' => true],
            's2_in' => ['time' => $record->session_2_in_time, 'out' => false],
            's2_out' => ['time' => $record->clock_out_time, 'out' => true],
        ];

        $statusPriority = [
            'Late' => 10,
            'Early Departure' => 10,
            'Absent' => 8,
            'Warning' => 6,
            'Early' => 4,
            'Overtime' => 3,
            'Stay Late' => 2,
            'In-On time' => 1,
            'Out-On time' => 1,
            'Present' => 0
        ];

        $getPriority = fn($s) => $statusPriority[$s] ?? 0;

        $currentInStatus = 'Present';
        $currentOutStatus = 'Present';

        foreach ($scans as $key => $scan) {
            $result = $calculatePoint($scan['time'], $targets[$key], $scan['out']);
            if (!$result) continue;

            $status = $result['status'];
            $mins = $result['mins'];
            $type = $result['type'];

            // Update Metrics
            if ($type === 'late') $record->late_minutes += $mins;
            if ($type === 'early') $record->early_minutes += $mins;
            if ($type === 'warning') $record->warning_minutes += $mins;
            if ($type === 'early_departure') $record->early_departure_minutes += $mins;
            if ($type === 'overtime') $record->overtime_minutes += $mins;
            if ($type === 'stay_late') $record->stay_late_minutes += $mins;

            // Update Status Health
            if (!$scan['out']) {
                if ($getPriority($status) > $getPriority($currentInStatus)) $currentInStatus = $status;
            } else {
                if ($getPriority($status) > $getPriority($currentOutStatus)) $currentOutStatus = $status;
            }
        }

        $record->in_status = $currentInStatus;
        $record->out_status = $currentOutStatus;
        $record->status = $currentInStatus . ' / ' . $currentOutStatus;

        // 4. Calculate Total Working Hours
        if ($record->clock_in_time && $record->clock_out_time) {
            $checkIn = $record->clock_in_time;
            $checkOut = $record->clock_out_time;
            $s1Out = $record->session_1_out_time;
            $s2In = $record->session_2_in_time;

            if ($isSplit && $s1Out && $s2In) {
                // Split Shift: Sum the two sessions
                $session1 = $checkIn->floatDiffInHours($s1Out);
                $session2 = $s2In->floatDiffInHours($checkOut);
                $record->total_hours = round($session1 + $session2, 2);
            } else {
                // Regular Shift: Total duration minus break if applicable
                $rawDuration = $checkIn->floatDiffInHours($checkOut);
                $breakDuration = 0;

                if ($dayConfig && ($dayConfig['has_break'] ?? false) && isset($dayConfig['break_start'], $dayConfig['break_end'])) {
                    $bStart = Carbon::parse($dateStr . ' ' . $dayConfig['break_start']);
                    $bEnd = Carbon::parse($dateStr . ' ' . $dayConfig['break_end']);

                    // Deduct break if the employee was present during the scheduled break period
                    if ($checkIn->lt($bStart) && $checkOut->gt($bEnd)) {
                        $breakDuration = $bStart->floatDiffInHours($bEnd);
                    }
                }
                $record->total_hours = round(max(0, $rawDuration - $breakDuration), 2);
            }
        }
        
        $record->save();

        // Determine action for broadcast (based on the most recent scan)
        $action = 'attendance.clock_in';
        $now = Carbon::now();
        
        if ($record->clock_out_time && $record->clock_out_time->diffInMinutes($now) < 5) {
            $action = 'attendance.clock_out';
        } elseif ($record->session_2_in_time && $record->session_2_in_time->diffInMinutes($now) < 5) {
            $action = 'attendance.session_2_in';
        } elseif ($record->session_1_out_time && $record->session_1_out_time->diffInMinutes($now) < 5) {
            $action = 'attendance.session_1_out';
        }
        
        AttendanceTelegramBroadcast::dispatch($action, $record);
    }
}
