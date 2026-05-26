import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import { useAttendance } from '@/context/AttendanceContext';
import { playSuccessSound, playErrorSound } from '@/lib/audio';
import { clockIn, enqueueOfflineAttendance } from '../services/attendance.service';
import type { ScanStatus, ReasonType, PolicyCheckResult } from '../types';

// ─────────────────────────────────────────────────────────────────────────────

export function useAttendanceScanner() {
    const { t } = useTranslation('pwa');
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const {
        location: globalLocation,
        isWarmingUp: contextWarming,
        error: geoError,
        todayShift,
        deviceId,
        fetchTodayShift,
        refreshLocation,
        permissions,
        requestLocationPermission,
        startWatching,
    } = useAttendance();

    // True when the browser has not yet been asked for location.
    // Used by the Scan shell to render the LocationGateScreen instead of hanging.
    const needsPermission = permissions.location === 'prompt';

    const authToken = localStorage.getItem('employee_auth_token');

    // ── QR / URL Parameters ──────────────────────────────────────────────────
    // Support both new (p, branch_code) and legacy (b) parameters
    const payload      = searchParams.get('p') || searchParams.get('payload');
    const branchCode   = searchParams.get('b') || searchParams.get('branch_code');
    const signature    = searchParams.get('s') || searchParams.get('signature');

    // ── Component State ──────────────────────────────────────────────────────
    const [status, setStatus]               = useState<ScanStatus>('idle');
    const [message, setMessage]             = useState(t('initializing_scan', 'Initializing scan...'));
    const [distance, setDistance]           = useState<number | null>(null);
    const [reasonRequired, setReasonRequired] = useState(false);
    const [reasonType, setReasonType]       = useState<ReasonType>('late');
    const [lateMinutes, setLateMinutes]     = useState(0);
    const [reason, setReason]               = useState(searchParams.get('reason') || '');
    const [showPermissionGuide, setShowPermissionGuide] = useState(false);

    // ── Mutation Guards ──────────────────────────────────────────────────────
    // These refs prevent double-fire on StrictMode double-mount and guard async races.
    const isProcessingRef        = useRef(false);
    const hasTriggeredRef        = useRef(false);
    const networkRequestInProgress = useRef(false);

    // ── Page Title ───────────────────────────────────────────────────────────
    useEffect(() => {
        dispatch(setPageTitle(t('attendance_scan', 'Attendance Scan')));
    }, [dispatch, t]);

    // ── Fetch today's shift if not already loaded ────────────────────────────
    useEffect(() => {
        if (!todayShift && authToken) {
            fetchTodayShift();
        }
    }, [todayShift, authToken, fetchTodayShift]);

    // ── Audio Side-effects ───────────────────────────────────────────────────
    useEffect(() => {
        if (status === 'success') {
            playSuccessSound();
        } else if (status === 'error') {
            playErrorSound();
        }
    }, [status]);

    // ── Local Proactive Policy Check ─────────────────────────────────────────
    /**
     * Calculates whether the employee is scanning late or departing early based
     * on the server-supplied shift schedule and company tolerance policies.
     * This is a CLIENT-SIDE snapshot calculation; the server will also validate.
     */
    const checkProactivePolicy = (): PolicyCheckResult => {
        if (!todayShift || !todayShift.shift || !todayShift.shift.is_working) {
            return { require_reason: false };
        }

        const { shift, policy, attendance_today } = todayShift;
        const now      = new Date();
        const dateStr  =
            now.getFullYear() +
            '-' +
            String(now.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(now.getDate()).padStart(2, '0');

        const isContinuous = shift.day_shift_type !== 'split';

        let type: ReasonType | null  = null;
        let scheduledTimeStr: string | null = null;

        if (!attendance_today?.in1) {
            type             = 'late';
            scheduledTimeStr = shift.start_time;
        } else if (!isContinuous && !attendance_today?.out1) {
            type             = 'early_departure';
            scheduledTimeStr = shift.break_start;
        } else if (!isContinuous && !attendance_today?.in2) {
            type             = 'late';
            scheduledTimeStr = shift.break_end;
        } else if (!attendance_today?.out2) {
            type             = 'early_departure';
            scheduledTimeStr = shift.end_time;
        }

        if (type && scheduledTimeStr) {
            const scheduledTime = new Date(`${dateStr}T${scheduledTimeStr}`);
            if (type === 'late') {
                const tolerance   = policy.late_tolerance || 0;
                const diffMinutes = (now.getTime() - scheduledTime.getTime()) / 60000;
                if (diffMinutes > tolerance) {
                    return { require_reason: true, type, minutes: Math.round(diffMinutes) };
                }
            } else {
                const earlyTolerance = policy.early_tolerance || 0;
                const diffMinutes    = (scheduledTime.getTime() - now.getTime()) / 60000;
                if (diffMinutes > earlyTolerance) {
                    return { require_reason: true, type, minutes: Math.round(diffMinutes) };
                }
            }
        }

        return { require_reason: false };
    };

    // ── Core Clock-in Executor ───────────────────────────────────────────────
    const verifyAndClockIn = async (providedReason?: string) => {
        if (!globalLocation.lat || !globalLocation.lng || networkRequestInProgress.current) {
            isProcessingRef.current = false;
            return;
        }

        networkRequestInProgress.current = true;
        hasTriggeredRef.current = true; // Lock permanently

        setStatus('verifying');
        setMessage(t('verifying_placement', 'Verifying your placement...'));

        try {
            const body = {
                auth_token:  authToken!,
                device_id:   deviceId,
                signature:   signature!,
                user_lat:    globalLocation.lat,
                user_lng:    globalLocation.lng,
                reason:      providedReason,
                scanned_at:  new Date().toISOString(),
                ...(payload    ? { payload }    : {}),
                ...(branchCode ? { branch_code: branchCode } : {}),
            };

            const { ok, data } = await clockIn(body, authToken!);

            if (ok) {
                if (data.require_reason && !providedReason) {
                    setStatus('idle');
                    setReasonType(data.type || 'late');
                    setLateMinutes(data.minutes || 0);
                    setReasonRequired(true);
                    return;
                }

                setStatus('success');
                toast.success(data.message || t('attendance_recorded', 'Attendance Recorded'));

                // Brief pause so the user sees the success state before redirect
                setTimeout(() => {
                    navigate('/employee/dashboard', { replace: true });
                }, 1500);
            } else {
                isProcessingRef.current = false;
                setStatus('error');

                if (data.code === 'DEVICE_TAKEN') {
                    setMessage(
                        data.message ||
                            t(
                                'device_taken_error_desc',
                                'This device is already registered to another employee. Sharing devices is not permitted.',
                            ),
                    );
                } else if (data.code === 'BRANCH_NOT_FOUND_QR') {
                    setMessage(t('branch_invalid_qr', 'Branch not found. Invalid QR code'));
                } else if (data.code === 'ATTENDANCE_ALREADY_COMPLETED') {
                    setMessage(t('attendance_completed_today', 'Attendance already completed for today.'));
                } else if (data.distance) {
                    setMessage(t('too_far_from_branch', { distance: Math.round(data.distance) }));
                } else {
                    setMessage(data.message || t('verification_failed_desc', 'Verification failed'));
                }

                if (data.distance) setDistance(data.distance);
                toast.error(t('placement_invalid', 'Placement Invalid'));
            }
        } catch (err) {
            console.error('Verification error:', err);

            // ── OFFLINE QUEUE ──────────────────────────────────────────────
            enqueueOfflineAttendance({
                device_id:  deviceId,
                payload:    payload ?? undefined,
                branch_code: branchCode ?? undefined,
                signature:  signature!,
                user_lat:   globalLocation.lat!,
                user_lng:   globalLocation.lng!,
                reason:     providedReason,
                scanned_at: new Date().toISOString(),
            });

            setStatus('success');
            toast.info(t('recorded_offline', 'Recorded Offline'));

            setTimeout(() => {
                navigate('/employee/dashboard', { replace: true });
            }, 1500);
        } finally {
            networkRequestInProgress.current = false;
        }
    };

    // ── Main Trigger Effect ──────────────────────────────────────────────────
    useEffect(() => {
        // Strict exit conditions to prevent any double triggers
        if (status !== 'idle' || reasonRequired || isProcessingRef.current || hasTriggeredRef.current) {
            return;
        }

        // If context is still warming up, wait without setting error status
        if (contextWarming && !globalLocation.lat) {
            console.log('📡 GPS warming up...');
            return;
        }

        if (geoError) {
            setStatus('error');
            setMessage(
                geoError === 'LOCATION_PERMISSION_DENIED'
                    ? t('location_denied', 'Location access is required for attendance. Please enable it in your settings.')
                    : t('location_error', 'Could not determine your location. Please check your GPS.'),
            );

            if (geoError === 'LOCATION_PERMISSION_DENIED') {
                setShowPermissionGuide(true);
            }
            return;
        }

        if (!authToken) {
            setStatus('error');
            setMessage(t('session_expired', 'Session expired. Please log in again.'));
            return;
        }

        // Validation: Must have at least a payload (new) or branchCode (old), plus signature
        if (!(payload || branchCode) || !signature) {
            setStatus('error');
            setMessage(t('invalid_verification_data', 'Invalid verification data.'));
            return;
        }

        // Proactive Validation: Check shift rules LOCALLY or from Server Snapshot
        if (globalLocation.lat && globalLocation.lng && todayShift) {
            // Lock immediately and permanently for this mount
            isProcessingRef.current = true;
            hasTriggeredRef.current = true;

            // Prioritize server-calculated check results if available, fallback to local
            const serverCheck    = todayShift.check_results;
            const proactiveCheck = serverCheck?.require_reason ? serverCheck : checkProactivePolicy();

            console.log('🧐 Calculated Proactive Check:', proactiveCheck);

            if (proactiveCheck.require_reason && !reasonRequired && !reason) {
                setReasonType((proactiveCheck as any).type as ReasonType);
                setLateMinutes((proactiveCheck as any).minutes);
                setReasonRequired(true);
                // Allow re-trigger ONLY after the user provides a reason
                isProcessingRef.current = false;
                hasTriggeredRef.current = false;
                return;
            }

            console.log('🚀 Triggering verification...');
            verifyAndClockIn(reason);
        }
    }, [
        payload, branchCode, signature, authToken,
        globalLocation.lat, globalLocation.lng,
        contextWarming, geoError,
        status, reasonRequired, todayShift,
    ]);

    // ── Reason Submission ────────────────────────────────────────────────────
    const submitWithReason = () => {
        if (!reason.trim()) {
            toast.error(t('provide_reason', 'Please provide a reason.'));
            return;
        }
        hasTriggeredRef.current = true;
        verifyAndClockIn(reason);
    };

    // ── Derived helpers ──────────────────────────────────────────────────────
    const navigateToDashboard = () => navigate('/employee/dashboard');

    return {
        // State
        status,
        message,
        distance,
        reasonRequired,
        reasonType,
        lateMinutes,
        reason,
        showPermissionGuide,
        // Permission gate
        needsPermission,
        requestLocationPermission,
        // Location (passed through from context)
        globalLocation,
        contextWarming,
        // Actions
        setReason,
        setReasonRequired,
        setShowPermissionGuide,
        submitWithReason,
        verifyAndClockIn,
        navigateToDashboard,
        refreshLocation,
    };
}
