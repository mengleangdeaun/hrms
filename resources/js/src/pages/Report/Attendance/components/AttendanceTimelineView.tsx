import React, { useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { useAttendanceTimeline } from '@/hooks/useHRData';
import Chart from 'react-apexcharts';
import PerfectScrollbar from 'react-perfect-scrollbar';
import {
    IconDownload,
    IconShare,
    IconLoader2,
    IconUser,
    IconCalendar,
    IconRefresh,
    IconX,
    IconTrendingUp,
    IconAlertTriangle,
    IconClock,
    IconChartBar,
    IconHelpCircle,
    IconMathFunction,
    IconInfoCircle,
    IconCalendarCheck,
    IconBeach,
    IconMap,
    IconId,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import api from '@/utils/api';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import EmptyState from '@/components/ui/EmptyState';
import ApexCharts from 'apexcharts';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

dayjs.extend(utc);

interface AttendanceTimelineViewProps {
    employee: any;
    dateRange: { start_date: string; end_date: string };
    onClose: () => void;
}

const AttendanceTimelineView: React.FC<AttendanceTimelineViewProps> = ({ employee, dateRange, onClose }) => {
    const { t } = useTranslation('report');
    const isDarkMode = useSelector((state: IRootState) => state.themeConfig.isDarkMode);
    const [showHelp, setShowHelp] = React.useState(false);
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
    const [imgError, setImgError] = React.useState(false);
    const snapshotRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<HTMLDivElement>(null);
    const [isCapturing, setIsCapturing] = React.useState(false);
    const [isSharing, setIsSharing] = React.useState(false);
    const chartId = `chart-${employee.ulid}`;

    const { data: timelineResponse, isLoading } = useAttendanceTimeline(employee.ulid, {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
    });

    const timelineData = useMemo(() => timelineResponse?.timeline || [], [timelineResponse]);
    const presentDays = useMemo(() => timelineData.filter((d: any) => d.type === 'present'), [timelineData]);

    // --- Calculated Metrics ---
    const stats = useMemo(() => {
        if (!timelineResponse) return null;

        const analytics = timelineResponse.analytics || {};
        const expectedDays = analytics.expected_working_days || 0;

        // 1. Avg. Check-in (only based on present days with a clock_in record)
        const clockInMinutes = presentDays
            .filter((item: any) => item.record?.clock_in)
            .map((item: any) => {
                const [h, m] = item.record.clock_in.split(':').map(Number);
                return h * 60 + m;
            });

        const avgMinutes = clockInMinutes.length > 0 ? clockInMinutes.reduce((a: number, b: number) => a + b, 0) / clockInMinutes.length : 0;

        const avgH = Math.floor(avgMinutes / 60);
        const avgM = Math.floor(avgMinutes % 60);
        const avgH12 = avgH % 12 || 12;
        const formattedAvg = avgMinutes > 0 ? `${String(avgH12).padStart(2, '0')}:${String(avgM).padStart(2, '0')} ${avgH >= 12 ? 'PM' : 'AM'}` : '—';

        // 2. Consistency Score (Present vs Expected Working Days)
        const consistency = expectedDays > 0 ? Math.min((presentDays.length / expectedDays) * 100, 100).toFixed(1) : presentDays.length > 0 ? '100.0' : '0.0';

        // 3. Late Frequency - Updated to use Policy Tolerance
        const lateCount = presentDays.filter((item: any) => {
            const rec = item.record;
            if (!rec) return false;
            // Extreme if late > 0 (Already filtered by tolerance in backend)
            // Warning if warning > 0
            return (rec.late_minutes || 0) > 0 || (rec.warning_minutes || 0) > 0;
        }).length;
        const lateFreq = presentDays.length > 0 ? ((lateCount / presentDays.length) * 100).toFixed(0) : 0;

        return {
            avgCheckIn: formattedAvg,
            consistency,
            lateFreq,
            totalWorked: analytics.formatted_total_work_hours || '0h 0m',
            isTopPerformer: Number(consistency) > 90 && Number(lateFreq) < 10,
            analytics: {
                ...analytics,
                present_count: presentDays.length,
            },
        };
    }, [presentDays, timelineResponse, employee]);

    const chartSeries = [
        {
            name: t('working_hours'),
            data: presentDays
                .map((item: any) => {
                    const day = dayjs(item.date).format('ddd, DD MMM');
                    if (item.record?.clock_in && item.record?.clock_out) {
                        // Use a constant date to align all bars by time of day on the X-axis
                        const baseDate = '2000-01-01';
                        const start = dayjs.utc(`${baseDate} ${item.record.clock_in}`).valueOf();
                        let end = dayjs.utc(`${baseDate} ${item.record.clock_out}`).valueOf();

                        // Handle overnight shifts
                        if (end < start) {
                            end = dayjs.utc(`${baseDate} ${item.record.clock_out}`).add(1, 'day').valueOf();
                        }

                        // Color coding: Dynamic based on Policy Tolerance Snapshot
                        const isExtreme = (item.record.late_minutes || 0) > 0;
                        const isWarning = (item.record.warning_minutes || 0) > 0;

                        return {
                            x: day,
                            y: [start, end],
                            fillColor: isExtreme ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981',
                        };
                    }
                    return { x: day, y: [0, 0] };
                })
                .filter((d: any) => d.y[0] !== 0),
        },
    ];

    const chartOptions: any = {
        chart: {
            id: chartId,
            height: 350,
            type: 'rangeBar',
            fontFamily: 'Inter, sans-serif',
            toolbar: { show: false },
            zoom: { enabled: true },
            events: {
                dataPointMouseEnter: (event: any, chartContext: any, config: any) => {
                    setHoveredIndex(config.dataPointIndex);
                },
            },
        },
        plotOptions: {
            bar: {
                horizontal: true,
                barHeight: '70%',
                borderRadius: 4,
                rangeBarGroupRows: true,
            },
        },
        dataLabels: { enabled: false },
        xaxis: {
            type: 'datetime',
            labels: {
                style: { colors: isDarkMode ? '#64748b' : '#94a3b8', fontSize: '10px' },
                datetimeUTC: true,
                datetimeFormatter: {
                    year: 'yyyy',
                    month: 'MMM yyyy',
                    day: ' ',
                    hour: 'hh:mm TT',
                },
            },
            tooltip: { enabled: false },
        },
        yaxis: {
            type: 'category',
            labels: {
                style: { colors: isDarkMode ? '#64748b' : '#94a3b8', fontSize: '10px', fontWeight: 600 },
            },
        },
        grid: {
            borderColor: 'rgba(148, 163, 184, 0.1)',
            xaxis: { lines: { show: true } },
            padding: { top: 0, right: 0, bottom: 0, left: 10 },
        },
        tooltip: {
            enabled: false, // Use our fixed custom side tooltip instead
        },
    };

    const handleResetView = () => {
        ApexCharts.exec(chartId, 'resetSeries', true);
        toast.info(t('view_reset', 'Chart view reset'));
    };

    const handleDownloadImage = async () => {
        if (!snapshotRef.current || isCapturing) return;

        setIsCapturing(true);
        const toastId = toast.loading(t('generating_snapshot', 'Generating high-quality snapshot...'));

        try {
            // Small delay for rendering
            await new Promise((resolve) => setTimeout(resolve, 200));

            const dataUrl = await toPng(snapshotRef.current, {
                backgroundColor: isDarkMode ? '#020617' : '#ffffff',
                cacheBust: true,
                pixelRatio: 2,
                quality: 1.0,
                filter: (node) => {
                    const classList = (node as HTMLElement)?.classList;
                    return !classList?.contains('no-snapshot');
                },
                style: {
                    borderRadius: '16px',
                },
            });

            const link = document.createElement('a');
            link.download = `Attendance_Report_${employee.full_name}_${dayjs().format('YYYY-MM-DD')}.png`;
            link.href = dataUrl;
            link.click();

            toast.success(t('snapshot_ready', 'Snapshot ready!'), { id: toastId });
        } catch (err) {
            console.error('Snapshot failed:', err);
            toast.error(t('snapshot_failed', 'Failed to generate snapshot'), { id: toastId });
        } finally {
            setIsCapturing(false);
        }
    };

    const handleShare = async () => {
        if (!snapshotRef.current || isSharing) return;

        setIsSharing(true);
        const toastId = toast.loading(t('preparing_report', 'Preparing report...'));

        try {
            // 1. Capture PNG
            const dataUrl = await toPng(snapshotRef.current, {
                quality: 1.0,
                pixelRatio: 2,
                filter: (node) => {
                    const isNoSnapshot = node.classList?.contains('no-snapshot');
                    const isActionButtons = node.tagName === 'BUTTON';
                    return !isNoSnapshot && !isActionButtons;
                },
            });

            toast.loading(t('sharing_via_telegram', 'Sharing via Telegram...'), { id: toastId });

            // 2. Send to Backend
            const response = await api.post('/attendance/report/share', {
                employee_ulid: employee.ulid,
                image: dataUrl,
                start_date: dateRange.start_date,
                end_date: dateRange.end_date,
            });

            if (response.data.success) {
                toast.success(response.data.message, { id: toastId });
            } else {
                toast.error(response.data.message, { id: toastId });
            }
        } catch (error: any) {
            console.error('Sharing failed:', error);
            const msg = error.response?.data?.message || t('sharing_failed', 'Failed to share report');
            toast.error(msg, { id: toastId });
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent
                className="max-w-4xl p-0 overflow-visible bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 !rounded-2xl  [&>button]:hidden transition-all duration-500 ease-in-out"
                style={{
                    transform: showHelp || hoveredIndex !== null ? 'translate(-50%, -50%) translateX(160px)' : 'translate(-50%, -50%) translateX(0)',
                }}
            >
                <AnimatePresence>
                    {/* Help Sidebar */}
                    {showHelp && (
                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 50, opacity: 0 }}
                            className="absolute right-[calc(100%+16px)] top-0 w-[640px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 no-snapshot"
                        >
                            <div className="flex items-center gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                                    <IconHelpCircle size={28} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight">{t('analytics_logic')}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{t('how_it_works')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <h4 className="text-xs font-black text-indigo-600 uppercase flex items-center gap-2">
                                            <IconClock size={14} />
                                            {t('logic_avg_check_in')}
                                        </h4>
                                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{t('logic_avg_check_in_desc')}</p>
                                    </div>
                                    <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <h4 className="text-xs font-black text-rose-600 uppercase flex items-center gap-2">
                                            <IconAlertTriangle size={14} />
                                            {t('logic_late_freq')}
                                        </h4>
                                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{t('logic_late_freq_desc')}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <h4 className="text-xs font-black text-emerald-600 uppercase flex items-center gap-2">
                                            <IconTrendingUp size={14} />
                                            {t('logic_consistency')}
                                        </h4>
                                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{t('logic_consistency_desc')}</p>
                                    </div>
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                                        <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold leading-tight italic">{t('logic_policy_note')}</p>
                                    </div>
                                </div>
                            </div>

                            <Button onClick={() => setShowHelp(false)} className="w-full h-11 rounded-xl font-black uppercase tracking-widest mt-1 shadow-lg shadow-primary/20">
                                {t('got_it', 'Got it!')}
                            </Button>
                        </motion.div>
                    )}

                    {/* Record Details Sidebar */}
                    {hoveredIndex !== null && !showHelp && (
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="absolute left-[calc(100%+16px)] top-0 w-[280px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden no-snapshot"
                        >
                            {(() => {
                                const item = presentDays[hoveredIndex];
                                const record = item?.record;
                                if (!record) return null;

                                const formatTime = (timeStr: string) => {
                                    if (!timeStr) return '—';
                                    return dayjs(`2000-01-01 ${timeStr}`).format('hh:mm A');
                                };

                                const formatDuration = (decimalHours: number) => {
                                    const hours = Math.floor(decimalHours);
                                    const minutes = Math.round((decimalHours - hours) * 60);
                                    if (hours === 0 && minutes === 0) return '—';
                                    if (hours === 0) return `${minutes}mn`;
                                    if (minutes === 0) return `${hours}h`;
                                    return `${hours}h ${minutes}mn`;
                                };

                                const isLate = (record.late_minutes || 0) > 0;
                                const isOT = (record.overtime_minutes || 0) > 0;

                                return (
                                    <div className="p-6 space-y-5">
                                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                                            <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                                <IconCalendarCheck size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">{dayjs(item.date).format('ddd, MMM D')}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{dayjs(item.date).format('YYYY')}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('entry')}</span>
                                                    <p className="text-sm font-black text-slate-800 dark:text-white">{formatTime(record.clock_in)}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('exit')}</span>
                                                    <p className="text-sm font-black text-slate-800 dark:text-white">{formatTime(record.clock_out)}</p>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-slate-500">{t('total_work')}</span>
                                                    <span className="text-sm font-black text-primary">{formatDuration(record.total_hours)}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                {isLate && (
                                                    <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100/50 dark:border-amber-900/20">
                                                        <div className="flex items-center gap-2 text-amber-600">
                                                            <IconAlertTriangle size={14} />
                                                            <span className="text-[10px] font-black uppercase">{t('late')}</span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-amber-600">{record.late_minutes}mn</span>
                                                    </div>
                                                )}
                                                {isOT && (
                                                    <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/50 dark:border-emerald-900/20">
                                                        <div className="flex items-center gap-2 text-emerald-600">
                                                            <IconTrendingUp size={14} />
                                                            <span className="text-[10px] font-black uppercase">{t('ot')}</span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-emerald-600">{record.overtime_minutes}mn</span>
                                                    </div>
                                                )}
                                                {!isLate && !isOT && (
                                                    <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-400 border border-slate-100 dark:border-slate-800 italic">
                                                        <IconInfoCircle size={14} />
                                                        <span className="text-[10px] font-bold">Standard shift completed</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={snapshotRef} className="bg-slate-50 max-h-[90vh] h-auto dark:bg-black overflow-hidden rounded-2xl">
                    <DialogHeader className="p-4 px-6 !rounded-t-2xl bg-white dark:bg-slate-900 overflow-hidden border-b  border-slate-100 dark:border-slate-800 ">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
                            <div className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                    {employee.profile_image_url && !imgError ? (
                                        <img
                                            src={employee.profile_image_url}
                                            alt={employee.full_name}
                                            onError={() => setImgError(true)}
                                            className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shadow-sm"
                                        />
                                    ) : (
                                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-inner">
                                            <IconUser size={22} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-black text-slate-800 dark:text-white tracking-tight">{employee.full_name}</DialogTitle>
                                    <div className="flex items-center gap-2.5 mt-0.5">
                                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                                            <IconId size={12} className="text-primary" />
                                            ID: {employee.employee_code || employee.employee_id || employee.code || employee.ulid?.substring(0, 8).toUpperCase() || 'N/A'}
                                        </p>
                                        <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />

                                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                                            <IconCalendar size={12} className="text-primary" />
                                            {dayjs(dateRange.start_date).format('MMM D')} — {dayjs(dateRange.end_date).format('MMM D, YYYY')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownloadImage}
                                    disabled={isCapturing}
                                    className="h-9 gap-2 bg-white dark:bg-slate-900 border shadow-sm font-bold disabled:opacity-70 no-snapshot text-[11px]"
                                >
                                    {isCapturing ? <IconRefresh size={16} className="animate-spin" /> : <IconDownload size={16} />}
                                    {isCapturing ? t('capturing', 'Capturing...') : t('snapshot')}
                                </Button>
                                <Button variant="default" size="sm" onClick={handleShare} disabled={isSharing} className="h-9 gap-2 font-bold px-4 no-snapshot text-[11px] shadow-lg shadow-primary/20">
                                    {isSharing ? <IconLoader2 size={16} className="animate-spin" /> : <IconShare size={16} />}
                                    {isSharing ? t('sharing', 'Sharing...') : t('share_to_telegram', 'Share to Telegram')}
                                </Button>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600 transition-all shadow-sm no-snapshot"
                                >
                                    <IconX size={18} />
                                </button>
                            </div>
                        </div>
                    </DialogHeader>

                    <PerfectScrollbar className="p-6 pt-4 space-y-6 max-h-[75vh]">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse"></div>
                                    <IconLoader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider animate-pulse">{t('analyzing_performance')}</p>
                            </div>
                        ) : timelineData.length === 0 ? (
                            <div className="py-20">
                                <EmptyState title={t('no_detailed_data')} description={t('no_detailed_data_desc', 'Detailed clock logs are not available for this period.')} />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Analytics Grid Header with Help Button */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">{t('analyzing_performance')}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowHelp(!showHelp)}
                                        className={`h-8 gap-2 rounded-full text-[10px] font-black uppercase transition-all ${showHelp ? 'bg-primary text-white shadow-lg hover:bg-primary/80' : 'text-slate-400 hover:text-primary hover:bg-primary/5'}`}
                                    >
                                        <IconHelpCircle size={14} className={showHelp ? 'text-white' : 'text-amber-500'} />
                                        {t('how_it_works')}
                                    </Button>
                                </div>

                                {/* Analytics Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary/30 transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg text-indigo-600">
                                                <IconClock size={16} />
                                            </div>
                                            {stats?.avgCheckIn !== '—' && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">On Time</span>}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-wider">{t('avg_check_in')}</span>
                                        <span className="text-xl font-black text-slate-800 dark:text-white leading-none">{stats?.avgCheckIn}</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-emerald-600">
                                                <IconTrendingUp size={16} />
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {stats?.analytics?.is_using_fallback && (
                                                    <div className="flex items-center justify-center p-1 bg-amber-500 text-white rounded-full animate-pulse shadow-sm" title={t('estimated_policy')}>
                                                        <IconAlertTriangle size={8} />
                                                    </div>
                                                )}
                                                <span
                                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${Number(stats?.consistency) > 90 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}
                                                >
                                                    {Number(stats?.consistency) > 90 ? 'High' : 'Normal'}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-wider">{t('consistency')}</span>
                                        <span className="text-xl font-black text-slate-800 dark:text-white leading-none">{stats?.consistency}%</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="p-1.5 bg-rose-50 dark:bg-rose-950/30 rounded-lg text-rose-600">
                                                <IconAlertTriangle size={16} />
                                            </div>
                                            <span
                                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${Number(stats?.lateFreq) > 30 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}
                                            >
                                                {Number(stats?.lateFreq) > 30 ? t('frequent') : t('rare')}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-wider">{t('late_frequency')}</span>
                                        <span className="text-xl font-black text-slate-800 dark:text-white leading-none">{stats?.lateFreq}%</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="p-1.5 bg-primary/20 dark:bg-primary/30 rounded-lg text-primary">
                                                <IconChartBar size={16} />
                                            </div>
                                            {stats?.isTopPerformer && <span className="text-[10px] font-bold text-primary bg-white px-1.5 py-0.5 rounded uppercase">Elite</span>}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-wider">{t('total_worked')}</span>
                                        <span className="text-xl font-black text-slate-800  dark:text-white leading-none">{stats?.totalWorked}</span>
                                    </div>
                                </div>

                                {/* Chart Area */}
                                <div ref={chartRef} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm relative pt-12">
                                    <div className="absolute right-6 top-6 z-10">
                                        <Button variant="ghost" size="sm" onClick={handleResetView} className="h-8 text-[10px] font-black uppercase text-slate-400 hover:text-primary gap-1.5">
                                            <IconRefresh size={14} />
                                            {t('reset_view')}
                                        </Button>
                                    </div>
                                    <Chart options={chartOptions} series={chartSeries} type="rangeBar" height={350} />

                                    <div className="mt-4 flex items-center justify-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
                                        <TooltipProvider delayDuration={100}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-2 cursor-help">
                                                        <div className="w-3 h-3 rounded bg-[#10b981]"></div>
                                                        {t('on_time')}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-emerald-600 font-bold border-none shadow-xl">
                                                    <p>{t('tooltip_on_time')}</p>
                                                </TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-2 cursor-help">
                                                        <div className="w-3 h-3 rounded bg-[#f59e0b]"></div>
                                                        {t('late_warning')}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-amber-600 font-bold border-none shadow-xl">
                                                    <p>{t('tooltip_late_warning')}</p>
                                                </TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-2 cursor-help">
                                                        <div className="w-3 h-3 rounded bg-[#ef4444]"></div>
                                                        {t('late')}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-rose-600 font-bold border-none shadow-xl">
                                                    <p>{t('tooltip_extreme_late')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>
                            </div>
                        )}
                    </PerfectScrollbar>
                </div>

                <style
                    dangerouslySetInnerHTML={{
                        __html: `
                    /* Aggressively hide ApexCharts default tooltip wrapper artifacts */
                    .apexcharts-tooltip {
                        background: transparent !important;
                        background-color: transparent !important;
                        border: none !important;
                        box-shadow: none !important;
                        overflow: visible !important;
                        z-index: 1000 !important;
                    }
                    .apexcharts-tooltip.apexcharts-theme-light,
                    .apexcharts-tooltip.apexcharts-theme-dark {
                        background: transparent !important;
                        background-color: transparent !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                `,
                    }}
                />
            </DialogContent>
        </Dialog>
    );
};

export default AttendanceTimelineView;
