import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface HistoryRecord {
    id: number;
    date: string;
    clock_in_time: string | null;
    session_1_out_time: string | null;
    session_2_in_time: string | null;
    clock_out_time: string | null;
    status: string;
    in_status: string | null;
    out_status: string | null;
    early_minutes?: number;
    late_minutes?: number;
    warning_minutes?: number;
    early_departure_minutes?: number;
    overtime_minutes?: number;
    stay_late_minutes?: number;
    total_hours?: number;
}

interface HistoryCardProps {
    record: HistoryRecord;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({ record }) => {
    const { t } = useTranslation('pwa');
    const date = new Date(record.date);
    const dayName = t(format(date, 'eee').toLowerCase());
    const dayNum = format(date, 'd');
    const monthName = t(format(date, 'MMM').toLowerCase());

    const formatTime = (time: string | null | undefined) => {
        if (!time) return '--:--';
        return format(new Date(time), 'hh:mm');
    };
    const formatAmPm = (time: string | null | undefined) => {
        if (!time) return '';
        return format(new Date(time), 'a').toUpperCase();
    };

    const formatMins = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0) {
            return `${h}h ${m}m`;
        }
        return `${m} ${t('mins', 'mins') as string}`;
    };

    const isSplit = !!record.session_2_in_time || !!record.session_1_out_time;
    const isMissingOut1 = record.status === 'Present' && !record.clock_out_time && !record.session_1_out_time;
    const isMissingOut2 = record.status === 'Present' && !!record.session_2_in_time && !record.clock_out_time;

    const getStatusTheme = (rec: HistoryRecord) => {
        const netMins =
            (rec.overtime_minutes || 0) + (rec.stay_late_minutes || 0) + (rec.early_minutes || 0) -
            (rec.late_minutes || 0) - (rec.warning_minutes || 0) - (rec.early_departure_minutes || 0);
        if (netMins < 0) return {
            bar: 'bg-amber-400',
            badgeBg: 'bg-amber-50 dark:bg-amber-400/10',
            badgeText: 'text-amber-600 dark:text-amber-400',
            badgeRing: 'ring-amber-200 dark:ring-amber-400/30',
            label: t('deficit', 'Deficit') as string,
            inDot: 'bg-amber-400',
        };
        if (rec.overtime_minutes && rec.overtime_minutes > 0) return {
            bar: 'bg-emerald-500',
            badgeBg: 'bg-emerald-50 dark:bg-emerald-400/10',
            badgeText: 'text-emerald-600 dark:text-emerald-400',
            badgeRing: 'ring-emerald-200 dark:ring-emerald-400/30',
            label: t('overtime', 'Overtime') as string,
            inDot: 'bg-emerald-500',
        };
        return {
            bar: 'bg-blue-500',
            badgeBg: 'bg-blue-50 dark:bg-blue-400/10',
            badgeText: 'text-blue-600 dark:text-blue-400',
            badgeRing: 'ring-blue-200 dark:ring-blue-400/30',
            label: (rec.clock_in_time && !rec.in_status) ? t('recorded', 'Recorded') : t('on_time', 'On Time'),
            inDot: 'bg-blue-500',
        };
    };

    const calculateDuration = () => {
        // Priority 1: Use the backend-calculated total_hours (already accounts for breaks/policy)
        const parsedTotalHours = parseFloat(String(record.total_hours || 0));
        if (!isNaN(parsedTotalHours) && parsedTotalHours > 0) {
            const totalMinutes = Math.round(parsedTotalHours * 60);
            return {
                h: Math.floor(totalMinutes / 60),
                m: totalMinutes % 60
            };
        }

        // Priority 2: Fallback to raw frontend calculation (for ongoing days or missing data)
        if (!record.clock_in_time || !record.clock_out_time) return null;
        let totalMs = 0;
        if (isSplit) {
            if (record.clock_in_time && record.session_1_out_time)
                totalMs += new Date(record.session_1_out_time).getTime() - new Date(record.clock_in_time).getTime();
            if (record.session_2_in_time && record.clock_out_time)
                totalMs += new Date(record.clock_out_time).getTime() - new Date(record.session_2_in_time).getTime();
        } else {
            totalMs = new Date(record.clock_out_time).getTime() - new Date(record.clock_in_time).getTime();
        }
        if (totalMs <= 0) return null;
        const totalMinutes = Math.floor(totalMs / (1000 * 60));
        return {
            h: Math.floor(totalMinutes / 60),
            m: totalMinutes % 60
        };
    };

    const theme = getStatusTheme(record);
    const duration = calculateDuration();



    // A single session row: Vertical layout with Clock-in and Clock-out
    const SessionRow = ({
        inTime,
        outTime,
        isActiveOut,
        inDotColor = 'bg-emerald-400',
    }: {
        inTime: string | null;
        outTime: string | null;
        isActiveOut?: boolean;
        inDotColor?: string;
    }) => {
        return (
            <div className="flex items-center gap-3">
                {/* Status Dot */}
                <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    isActiveOut ? "bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" : inDotColor
                )} />

                {/* Times Row */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Clock In */}
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black tabular-nums tracking-tight text-gray-900 dark:text-white leading-none">
                            {formatTime(inTime)}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 leading-none uppercase">{formatAmPm(inTime)}</span>
                    </div>

                    {/* Separator */}
                    <div className="flex items-center gap-2 flex-1 min-w-0 px-1">
                         <div className="h-px bg-gray-100 dark:bg-gray-800/50 flex-1" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-gray-300 dark:text-gray-600">to</span>
                         <div className="h-px bg-gray-100 dark:bg-gray-800/50 flex-1" />
                    </div>

                    {/* Clock Out */}
                    <div className="flex items-baseline gap-1.5 justify-end">
                        <span className={cn(
                            "text-lg font-black tabular-nums tracking-tight leading-none text-right",
                            isActiveOut ? "text-amber-500 italic" : "text-gray-900 dark:text-white"
                        )}>
                            {isActiveOut ? t('active_state', 'Active') as string : formatTime(outTime)}
                        </span>
                        {!isActiveOut && <span className="text-[10px] font-bold text-gray-400 leading-none uppercase">{formatAmPm(outTime)}</span>}
                    </div>
                </div>
            </div>
        );
    };

    const statusLabel = (() => {
        const parts: { text: string; translationKey: string; color: string }[] = [];
        if (record.in_status && record.in_status !== 'In-On time') {
            const isWarn = record.in_status.toLowerCase().includes('late') || record.in_status.toLowerCase().includes('warning');
            const cleanStatus = record.in_status.replace('In-', '');
            parts.push({ 
                text: cleanStatus, 
                translationKey: cleanStatus.toLowerCase().replace(' ', '_'),
                color: isWarn ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400' 
            });
        }
        if (record.out_status && record.out_status !== 'Out-On time') {
            const isRose = record.out_status.toLowerCase().includes('departure');
            const isGreen = record.out_status.toLowerCase().includes('overtime');
            const cleanStatus = record.out_status.replace('Out-', '');
            parts.push({
                text: cleanStatus,
                translationKey: cleanStatus.toLowerCase().replace(' ', '_'),
                color: isRose ? 'text-rose-600 dark:text-rose-400' : isGreen ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
            });
        }
        return parts;
    })();

    return (
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 active:scale-[0.99] transition-transform duration-100">
            {/* Top accent bar */}
            <div className={cn("h-[3px]", theme.bar)} />

            <div className="flex gap-5 p-5">
                {/* Date */}
                <div className="flex flex-col items-center justify-center w-12 shrink-0">
                    <span className="text-[10px] font-extrabold text-gray-400 leading-none mb-1.5 uppercase">{dayName}</span>
                    <span className="text-3xl font-black text-gray-900 dark:text-white leading-none mb-1.5">{dayNum}</span>
                    <span className="text-[10px] font-extrabold text-blue-500 leading-none uppercase">{monthName}</span>
                </div>

                {/* Divider */}
                <div className="w-px bg-gray-100 dark:bg-gray-800 self-stretch" />

                {/* Content */}
                <div className="flex-1 flex flex-col gap-5 min-w-0 justify-center">
                    {/* Top row: status + duration */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {statusLabel.length === 0 ? (
                                <span className={cn(
                                    "text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 ring-inset tracking-wide",
                                    theme.badgeBg, theme.badgeText, theme.badgeRing
                                )}>
                                    {theme.label}
                                </span>
                            ) : statusLabel.map((s, i) => (
                                <React.Fragment key={i}>
                                    {i > 0 && <span className="text-gray-300 dark:text-gray-600 text-xs">·</span>}
                                    <span className={cn("text-[11px] font-bold tracking-wide", s.color)}>{t(s.translationKey, s.text) as string}</span>
                                </React.Fragment>
                            ))}
                        </div>

                        {duration ? (
                            <div className="flex items-baseline gap-1 shrink-0">
                                <span className="text-[11px] font-black text-gray-800 dark:text-gray-100  tracking-widest leading-none">
                                    {formatMins(duration.h * 60 + duration.m)}
                                </span>
                            </div>
                        ) : (
                            <span className="text-xs text-gray-300 dark:text-gray-600 font-medium">{t('no_clock_out', 'No clock-out') as string}</span>
                        )}
                    </div>

                    {/* Session rows */}
                    <div className="flex flex-col gap-3.5">
                        <SessionRow
                            inTime={record.clock_in_time}
                            outTime={isSplit ? record.session_1_out_time : record.clock_out_time}
                            isActiveOut={isMissingOut1}
                            inDotColor="bg-emerald-400"
                        />

                        {isSplit && (
                            <>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 border-t border-dashed border-gray-100 dark:border-gray-800" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-300 dark:text-gray-600">{t('break', 'Break') as string}</span>
                                    <div className="flex-1 border-t border-dashed border-gray-100 dark:border-gray-800" />
                                </div>
                                <SessionRow
                                    inTime={record.session_2_in_time}
                                    outTime={record.clock_out_time}
                                    isActiveOut={isMissingOut2}
                                    inDotColor="bg-blue-400"
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};