// CalendarView.tsx – Improved with larger fonts, square cards, and full time info
import React from 'react';
import { IconClock, IconCoffee, IconChecks, IconInfoCircle } from '@tabler/icons-react';
import { cn } from '../../../lib/utils';
import dayjs from 'dayjs';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';

interface CalendarViewProps {
    shift: any;
}

const CalendarView: React.FC<CalendarViewProps> = ({ shift }) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const workingDays = typeof shift.working_days === 'string' ? JSON.parse(shift.working_days) : shift.working_days;

    // Slightly taller for better readability
    const startHour = 6;
    const endHour = 22;
    const totalHours = endHour - startHour;
    const hourHeight = 56;      // increased from 48px
    const timeColumnWidth = 70;  // slightly wider for better text fit
    const totalGridHeight = totalHours * hourHeight;

    const hours = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i);

    const getPosition = (timeStr: string) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        const totalMinutes = (h - startHour) * 60 + m;
        return (totalMinutes / 60) * hourHeight;
    };

    const getHeight = (startStr: string, endStr: string) => {
        if (!startStr || !endStr) return 0;
        const [h1, m1] = startStr.split(':').map(Number);
        const [h2, m2] = endStr.split(':').map(Number);
        const diffMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
        return (diffMinutes / 60) * hourHeight;
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '-';
        return dayjs(`2024-01-01 ${timeStr}`).format('hh:mm A');
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
            {/* Header – compact but readable */}
            <div className="shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm z-10">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2.5 rounded-md">
                            <IconClock className="text-primary w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Weekly Time Grid</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{shift.name}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-400" />
                                <span className={cn(
                                    "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                                    shift.shift_type === 'split' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                )}>
                                    {shift.shift_type === 'split' ? 'Split Session' : 'Continuous'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="hidden lg:flex items-center gap-5">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-primary shadow-sm" />
                            <span className="text-[10px] font-bold uppercase text-gray-500">Session 1</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-indigo-600 shadow-sm" />
                            <span className="text-[10px] font-bold uppercase text-gray-500">Session 2</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-amber-400 shadow-sm" />
                            <span className="text-[10px] font-bold uppercase text-gray-500">Break</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Grid */}
            <PerfectScrollbar
                options={{
                    suppressScrollX: false,
                }}
                className="flex-1 w-full"
            >
                <div className="min-w-[1000px] relative pb-4">
                    {/* Day Headers */}
                    <div className="sticky top-0 z-30 flex border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                        <div style={{ width: timeColumnWidth }} className="shrink-0" />
                        <div className="flex-1 grid grid-cols-7 border-l border-gray-200 dark:border-gray-800">
                            {days.map(day => (
                                <div key={day} className="py-3 text-center border-r border-gray-200 dark:border-gray-800 last:border-r-0">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        {day.slice(0, 3)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Grid Content */}
                    <div className="flex relative">
                        {/* Time Column */}
                        <div style={{ width: timeColumnWidth }} className="shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-10">
                            {hours.map(hour => (
                                <div key={hour} style={{ height: hourHeight }} className="flex items-start justify-end pr-3 pt-2 border-b">
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                        {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Grid Columns */}
                        <div className="flex-1 grid grid-cols-7 relative">
                            {/* Horizontal grid lines */}
                            <div className="absolute inset-0 pointer-events-none">
                                {hours.map((hour, idx) => (
                                    <div
                                        key={hour}
                                        style={{ height: hourHeight, top: idx * hourHeight }}
                                        className="absolute w-full border-b border-gray-200/60 dark:border-gray-800/50"
                                    />
                                ))}
                            </div>

                            {/* Day columns */}
                            {days.map(day => {
                                const data = workingDays[day];
                                const isWorking = data?.is_working;
                                const dayShiftType = data?.day_shift_type || shift.shift_type;
                                const isSplit = dayShiftType === 'split';

                                return (
                                    <div
                                        key={day}
                                        className="relative border-r border-gray-200 dark:border-gray-800 last:border-r-0 hover:bg-gray-50/30 dark:hover:bg-gray-800/10 transition-colors"
                                        style={{ minHeight: totalGridHeight }}
                                    >
                                        {!isWorking && (
                                            <div className="absolute inset-0 bg-gray-100/40 dark:bg-gray-900/30 flex items-center justify-center pointer-events-none">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-600 rotate-90">Rest</span>
                                            </div>
                                        )}

                                        {isWorking && (
                                            <>

                                                {/* Override marker */}
                                                {dayShiftType !== shift.shift_type && (
                                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[90%] z-40">
                                                        <div className="bg-white/95 dark:bg-gray-800/95 border border-orange-300 dark:border-orange-700 px-2 py-1 shadow-md flex items-center justify-center gap-2">
                                                            <IconInfoCircle size={10} className="text-orange-500" />
                                                            <span className="text-[9px] font-bold text-gray-700 dark:text-gray-300 uppercase">
                                                                {isSplit ? 'Full Day' : 'Half Day'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Soft background for the whole shift period */}
                                                <div
                                                    style={{
                                                        top: getPosition(data.start_time),
                                                        height: getHeight(data.start_time, data.end_time)
                                                    }}
                                                    className="absolute inset-x-1 bg-primary/5 dark:bg-primary/5 border border-primary/20 dark:border-primary/30 z-0"
                                                />

                                                {/* Session 1 (or whole shift if continuous) */}
                                                <div
                                                    style={{
                                                        top: getPosition(data.start_time),
                                                        height: isSplit ? getHeight(data.start_time, data.break_start) : getHeight(data.start_time, data.end_time)
                                                    }}
                                                    className="absolute inset-x-1 group overflow-hidden bg-primary text-white shadow-md z-20 transition-all hover:shadow-lg cursor-pointer"
                                                >
                                                    <div className="p-2.5">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <IconClock size={12} stroke={2} />
                                                                <span className="text-[10px] font-bold uppercase tracking-wide">
                                                                    {isSplit ? 'Session 1' : 'Work'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm font-bold">
                                                            {formatTime(data.start_time)}
                                                        </div>
                                                        {/* Always show end time for session 1 */}
                                                        <div className="text-[11px] font-medium opacity-90 mt-1">
                                                            {isSplit ? formatTime(data.break_start) : formatTime(data.end_time)}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Break block (split or continuous) */}
                                                {isSplit && data.break_start && data.break_end && (
                                                    <div
                                                        style={{
                                                            top: getPosition(data.break_start),
                                                            height: getHeight(data.break_start, data.break_end)
                                                        }}
                                                        className="absolute inset-x-1 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 z-10 flex flex-col items-center justify-center gap-1"
                                                    >
                                                        <IconCoffee size={14} className="text-amber-600 dark:text-amber-400" />
                                                        <span className="text-[11px] font-bold uppercase text-amber-700 dark:text-amber-300">Break</span>
                                                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                                            {formatTime(data.break_start)} – {formatTime(data.break_end)}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Session 2 (split) */}
                                                {isSplit && data.break_end && (
                                                    <div
                                                        style={{
                                                            top: getPosition(data.break_end),
                                                            height: getHeight(data.break_end, data.end_time)
                                                        }}
                                                        className="absolute inset-x-1 group overflow-hidden bg-indigo-600 text-white shadow-md z-20 transition-all hover:shadow-lg cursor-pointer"
                                                    >
                                                        <div className="p-2.5">
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <div className="flex items-center gap-1.5">
                                                                    <IconChecks size={12} stroke={2} />
                                                                    <span className="text-[10px] font-bold uppercase tracking-wide">Session 2</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-sm font-bold">
                                                                {formatTime(data.break_end)}
                                                            </div>
                                                            <div className="text-[11px] font-medium opacity-90 mt-1">
                                                                {formatTime(data.end_time)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Continuous break pill (non-split) */}
                                                {!isSplit && data.has_break && data.break_start && data.break_end && (
                                                    <div
                                                        style={{
                                                            top: getPosition(data.break_start),
                                                            height: getHeight(data.break_start, data.break_end)
                                                        }}
                                                        className="absolute inset-x-2 bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 z-30 flex items-center justify-center gap-2 shadow-md"
                                                    >
                                                        <IconCoffee size={12} className="text-amber-500" />
                                                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">Break</span>
                                                        <span className="text-[9px] text-gray-600 dark:text-gray-300">
                                                            {formatTime(data.break_start)} – {formatTime(data.break_end)}
                                                        </span>
                                                    </div>
                                                )}


                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </PerfectScrollbar>
        </div>
    );
};

export default CalendarView;