import React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/km';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BottomSheet from '@/components/ui/bottom-sheet';
import { IconArrowRight, IconCheck, IconCoffee, IconCurrentLocation, IconLoader2, IconMoon, IconSun } from '@tabler/icons-react';
import { AttendanceReasonEnforcer } from '@/components/ui/pwa/AttendanceReasonEnforcer';
import { formatMinutesToDuration } from '@/utils/timeFormat';
import { cn } from '@/lib/utils';
import { useAttendanceStatus } from '@/hooks/useAttendanceStatus';
import { useAttendance } from '@/context/AttendanceContext';

interface SmartClockCardProps {}

export const SmartClockCard: React.FC<SmartClockCardProps> = () => {
    const { t, i18n } = useTranslation('pwa');
    const navigate = useNavigate();
    const [reasonRequired, setReasonRequired] = React.useState(false);
    const [cameraRequesting, setCameraRequesting] = React.useState(false);
    const [cameraError, setCameraError] = React.useState(false);

    const { state, proactiveStatus, currentTime, todayShift, isContinuous, attendanceData } = useAttendanceStatus();
    const { permissions, checkPermissions, isWarmingUp, location: gpsLocation, refreshLocation } = useAttendance();

    const { in1, out1, in2, out2 } = attendanceData;

    // Helper to format time
    const formatStatusTime = (timeStr?: string | null) => {
        if (!timeStr) return '--:--';
        return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const getActionInfo = () => {
        switch (state) {
            case 'ready':
                return { label: t('clock_in', 'Clock In'), icon: <IconSun size={18} />, color: 'bg-primary' };
            case 'session1':
                if (isContinuous) {
                    return { label: t('clock_out', 'Clock Out'), icon: <IconMoon size={18} />, color: 'bg-primary' };
                }
                return {
                    label: t('lunch_out', 'Lunch Out'),
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" color="none" fill="none" viewBox="0 0 24 24">
                            <path
                                d="M2.3153 12.6978C2.26536 12.2706 2.2404 12.057 2.2509 11.8809C2.30599 10.9577 2.98677 10.1928 3.89725 10.0309C4.07094 10 4.286 10 4.71612 10H15.2838C15.7139 10 15.929 10 16.1027 10.0309C17.0132 10.1928 17.694 10.9577 17.749 11.8809C17.7595 12.057 17.7346 12.2706 17.6846 12.6978L17.284 16.1258C17.1031 17.6729 16.2764 19.0714 15.0081 19.9757C14.0736 20.6419 12.9546 21 11.8069 21H8.19303C7.04537 21 5.9263 20.6419 4.99182 19.9757C3.72352 19.0714 2.89681 17.6729 2.71598 16.1258L2.3153 12.6978Z"
                                stroke="currentColor"
                                stroke-width="1.5"
                            ></path>
                            <path opacity="0.5" d="M17 17H19C20.6569 17 22 15.6569 22 14C22 12.3431 20.6569 11 19 11H17.5" stroke="currentColor" stroke-width="1.5"></path>
                            <path
                                opacity="0.5"
                                d="M10.0002 2C9.44787 2.55228 9.44787 3.44772 10.0002 4C10.5524 4.55228 10.5524 5.44772 10.0002 6"
                                stroke="currentColor"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            ></path>
                            <path
                                d="M4.99994 7.5L5.11605 7.38388C5.62322 6.87671 5.68028 6.0738 5.24994 5.5C4.81959 4.9262 4.87665 4.12329 5.38382 3.61612L5.49994 3.5"
                                stroke="currentColor"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            ></path>
                            <path
                                d="M14.4999 7.5L14.6161 7.38388C15.1232 6.87671 15.1803 6.0738 14.7499 5.5C14.3196 4.9262 14.3767 4.12329 14.8838 3.61612L14.9999 3.5"
                                stroke="currentColor"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            ></path>
                        </svg>
                    ),
                    color: 'bg-primary',
                };
            case 'break':
                return { label: t('afternoon_in', 'Afternoon In'), icon: <IconCoffee size={18} />, color: 'bg-primary' };
            case 'session2':
                return { label: t('clock_out', 'Clock Out'), icon: <IconMoon size={18} />, color: 'bg-primary' };
            default:
                return { label: t('completed', 'Completed'), icon: <IconCheck size={18} />, color: 'bg-primary' };
        }
    };

    const action = getActionInfo();

    /**
     * Navigate to the QR scanner, requesting camera permission inline first if not yet granted.
     * Calling getUserMedia() here — directly inside a button click — ensures we're inside the
     * trusted user-gesture context that browsers require for the permission dialog.
     */
    const navigateToScan = async (options?: { state?: any }) => {
        if (permissions.camera === 'granted') {
            navigate('/employee/scan', options);
            return;
        }

        setCameraRequesting(true);
        setCameraError(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // Stop tracks immediately — we only needed the permission grant
            stream.getTracks().forEach(track => track.stop());
            // Persist so next launch skips this step
            const cached = JSON.parse(localStorage.getItem('pwa_permission_cache') || '{}');
            localStorage.setItem('pwa_permission_cache', JSON.stringify({ ...cached, camera: 'granted' }));
            await checkPermissions(true);
            navigate('/employee/scan', options);
        } catch {
            // User denied or device has no camera
            setCameraError(true);
        } finally {
            setCameraRequesting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-[#0e1726] rounded-3xl px-6 py-6 pb-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden flex flex-col items-center">
            {/* Current Time */}
            <div className="text-5xl mt-0 font-black text-gray-600 dark:text-white tracking-tight tabular-nums transition-all duration-300">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <p className={cn('text-gray-400 text-xs font-semibold mt-1', i18n.language !== 'kh' && 'uppercase tracking-widest')}>
                {t('dashboard_date', {
                    weekday: dayjs(currentTime)
                        .locale(i18n.language === 'kh' ? 'km' : i18n.language)
                        .format('dddd'),
                    month: dayjs(currentTime)
                        .locale(i18n.language === 'kh' ? 'km' : i18n.language)
                        .format('MMM'),
                    day: dayjs(currentTime)
                        .locale(i18n.language === 'kh' ? 'km' : i18n.language)
                        .format('D'),
                })}
            </p>

            {/* Proactive Status Alert */}
            {proactiveStatus && (
                <div
                    className={cn(
                        'mt-3 px-4 py-1.5 rounded-full flex items-center gap-2 border animate-in slide-in-from-top-1 duration-300',
                        proactiveStatus.type === 'late'
                            ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400'
                            : proactiveStatus.type === 'off'
                              ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                              : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400',
                    )}
                >
                    <div
                        className={cn(
                            'w-2 h-2 rounded-full',
                            proactiveStatus.type === 'late' ? 'bg-amber-500 animate-pulse' : proactiveStatus.type === 'off' ? 'bg-gray-400' : 'bg-blue-500 animate-pulse',
                        )}
                    />
                    <span className="text-[10px] font-bold uppercase">
                        {proactiveStatus.type === 'late'
                            ? t('you_are_late', { duration: formatMinutesToDuration(proactiveStatus.minutes || 0, t) })
                            : proactiveStatus.type === 'off'
                              ? t('non_working_day', 'Non-Working Day')
                              : t('leaving_early', { duration: formatMinutesToDuration(proactiveStatus.minutes || 0, t) })}
                    </span>
                </div>
            )}

            {/* GPS Warmth Status Badge */}
            {permissions.location === 'granted' && (
                <div className={cn(
                    'mt-3 px-3 py-1 rounded-full flex items-center gap-1.5 border text-[10px] font-black uppercase tracking-widest transition-all duration-500',
                    isWarmingUp
                        ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400'
                        : gpsLocation.isPrecise
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400'
                )}>
                    {isWarmingUp
                        ? <IconLoader2 size={11} className="animate-spin" />
                        : <IconCurrentLocation size={11} className={gpsLocation.isPrecise ? '' : 'animate-pulse'} />
                    }
                    {isWarmingUp
                        ? t('gps_warming', 'GPS Warming...')
                        : gpsLocation.isPrecise
                          ? t('gps_ready', 'GPS Ready')
                          : t('low_accuracy', 'Low Accuracy')
                    }
                </div>
            )}

            {/* Smart Timeline */}
            <div className={cn('w-full mt-6 grid gap-1 relative', isContinuous ? 'grid-cols-2 px-12' : 'grid-cols-4')}>
                {/* Connecting Line Base */}
                <div className={cn('absolute top-3 h-0.5 bg-gray-100 dark:bg-gray-700 -z-0', isContinuous ? 'left-[25%] right-[25%]' : 'left-[12.5%] right-[12.5%]')} />

                {/* Timeline Nodes */}
                {(isContinuous
                    ? [
                          { label: t('in', 'In'), time: in1, active: !!in1 },
                          { label: t('out', 'Out'), time: out2, active: !!out2 },
                      ]
                    : [
                          { label: t('in', 'In'), time: in1, active: !!in1 },
                          { label: t('lunch', 'Lunch'), time: out1, active: !!out1 },
                          { label: t('back_in', 'Back'), time: in2, active: !!in2 },
                          { label: t('out', 'Out'), time: out2, active: !!out2 },
                      ]
                ).map((node, i) => (
                    <div key={i} className="flex flex-col items-center z-10">
                        <div
                            className={cn(
                                'w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-500',
                                node.active
                                    ? 'bg-emerald-500 border-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/20'
                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-transparent',
                            )}
                        >
                            {node.active && <IconCheck size={14} strokeWidth={4} />}
                        </div>
                        <span className={cn('text-[11px] font-black uppercase mt-2 transition-colors', node.active ? 'text-gray-900 dark:text-white' : 'text-gray-300')}>{node.label}</span>
                        <span className={cn('text-[10px] font-medium tabular-nums mt-0.5', node.active ? 'text-primary font-bold' : 'text-gray-300')}>{formatStatusTime(node.time)}</span>
                    </div>
                ))}
            </div>

            {/* Action Button */}
            {state !== 'done' && (
                <>
                    <button
                        disabled={cameraRequesting}
                        onClick={async () => {
                            // Fire a fresh GPS fix in background while camera dialog / reason sheet shows
                            refreshLocation();

                            if (proactiveStatus?.type === 'late' || proactiveStatus?.type === 'early_departure') {
                                setReasonRequired(true);
                            } else {
                                await navigateToScan();
                            }
                        }}
                        className={cn(
                            'mt-6 w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-white font-black uppercase tracking-wide text-[14px] transition-all active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-wait',
                            action.color,
                        )}
                    >
                        {cameraRequesting ? (
                            <>
                                <IconLoader2 size={18} className="animate-spin" />
                                {t('preparing_camera', 'Preparing Camera...')}
                            </>
                        ) : (
                            <>
                                {action.label}
                                <IconArrowRight size={14} className="ml-1 opacity-70" />
                            </>
                        )}
                    </button>

                    {cameraError && (
                        <p className="mt-2 text-[11px] font-bold text-rose-500 text-center animate-in fade-in duration-300">
                            {t('camera_denied', 'Camera access denied. Please enable it in your device settings.')}
                        </p>
                    )}
                </>
            )}

            <BottomSheet isOpen={reasonRequired} onClose={() => setReasonRequired(false)} title={t('reason_required', 'Reason Required')}>
                <AttendanceReasonEnforcer
                    onProceed={async (reason) => {
                        setReasonRequired(false);
                        await navigateToScan({ state: { reason } });
                    }}
                    onCancel={() => setReasonRequired(false)}
                />
            </BottomSheet>

            {state === 'done' && (
                <div className="mt-6 w-full py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                        <IconCheck size={14} strokeWidth={3} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{t('daily_shift_completed', 'Daily Shift Completed')}</span>
                </div>
            )}
        </div>
    );
};
