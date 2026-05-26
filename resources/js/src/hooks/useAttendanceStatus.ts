import { useMemo, useState, useEffect } from 'react';
import { useAttendance } from '../context/AttendanceContext';

/**
 * useAttendanceStatus: Centralized hook for proactive attendance validation.
 * Synchronizes logic between SmartClockCard, BottomNav, and the Scan Enforcer.
 */
export function useAttendanceStatus() {
    const { todayShift } = useAttendance();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Auto-update every minute to ensure proactive alerts trigger in real-time
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const attendanceData = todayShift?.attendance_today || {};
    const {
        in1,
        out1,
        in2,
        out2,
    } = attendanceData;

    const shift_type = todayShift?.shift?.day_shift_type || 'regular';
    const isContinuous = shift_type !== 'split';

    // Determine current phase of the attendance cycle
    const state = useMemo(() => {
        if (!todayShift || !todayShift.shift) return 'idle';
        if (out2) return 'done';
        if (!in1) return 'ready';

        if (isContinuous) {
            return 'session1'; // For continuous, session1 is the only working session until out2
        }

        if (!out1) return 'session1';
        if (!in2) return 'break';
        return 'session2';
    }, [in1, out1, in2, out2, isContinuous, todayShift]);

    // Proactive Status Check (Late / Early / Off)
    const proactiveStatus = useMemo(() => {
        if (!todayShift || !todayShift.shift || state === 'done' || state === 'idle') return null;

        const { shift, policy } = todayShift;
        
        // Handle non-working day
        if (!shift.is_working) {
            return { type: 'off', message: 'Non-Working Day' };
        }

        const now = currentTime;
        const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

        if (state === 'ready') {
            // Checking Late Arrival (First session)
            const startTimeStr = shift.start_time; 
            if (!startTimeStr) return null;

            const scheduledTime = new Date(`${dateStr}T${startTimeStr}`);
            const tolerance = policy?.late_tolerance || 0;
            const diffMinutes = (now.getTime() - scheduledTime.getTime()) / 60000;

            if (diffMinutes > tolerance) {
                return { type: 'late', minutes: Math.round(diffMinutes) };
            }
        } else if (!isContinuous && state === 'session1') {
            // Split Shift: Checking Early Lunch Out
            const breakStartStr = shift.break_start;
            if (!breakStartStr) return null;

            const scheduledTime = new Date(`${dateStr}T${breakStartStr}`);
            const earlyTolerance = policy?.early_tolerance || 0;
            const diffMinutes = (scheduledTime.getTime() - now.getTime()) / 60000;

            if (diffMinutes > earlyTolerance) {
                return { type: 'early_departure', minutes: Math.round(diffMinutes) };
            }
        } else if (!isContinuous && state === 'break') {
            // Split Shift: Checking Late Afternoon In
            const breakEndStr = shift.break_end;
            if (!breakEndStr) return null;

            const scheduledTime = new Date(`${dateStr}T${breakEndStr}`);
            const tolerance = policy?.late_tolerance || 0;
            const diffMinutes = (now.getTime() - scheduledTime.getTime()) / 60000;

            if (diffMinutes > tolerance) {
                return { type: 'late', minutes: Math.round(diffMinutes) };
            }
        } else if ((isContinuous && state === 'session1') || (!isContinuous && state === 'session2')) {
            // Final Clock Out: Checking Early Departure
            const endTimeStr = shift.end_time;
            if (!endTimeStr) return null;

            const scheduledTime = new Date(`${dateStr}T${endTimeStr}`);
            const earlyTolerance = policy?.early_tolerance || 0;
            const diffMinutes = (scheduledTime.getTime() - now.getTime()) / 60000;

            if (diffMinutes > earlyTolerance) {
                return { type: 'early_departure', minutes: Math.round(diffMinutes) };
            }
        }
        return null;
    }, [todayShift, state, currentTime]);

    return {
        state,
        proactiveStatus,
        currentTime,
        todayShift,
        isContinuous,
        attendanceData,
        reasonPresets: todayShift?.reason_presets || []
    };
}
