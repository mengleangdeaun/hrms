import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { parseISO, startOfDay, format } from "date-fns";

interface EmployeeCalendarProps {
    className?: string;
    selected?: Date;
    onSelect?: (date: Date | undefined) => void;
    onMonthChange?: (date: Date) => void;
    month?: Date;
    attendance?: any[];
    holidays?: any[];
    leaves?: any[];
    dayOffs?: any[];
    workingDays?: any;
}

export function EmployeeCalendar({
    className,
    selected,
    onSelect,
    onMonthChange,
    month,
    attendance = [],
    holidays = [],
    leaves = [],
    dayOffs = [],
    workingDays = [],
    ...props
}: EmployeeCalendarProps) {
    const defaultClassNames = getDefaultClassNames();

    const modifiers = React.useMemo(() => {
        const attendanceDays = (attendance || []).map((a: any) =>
            startOfDay(parseISO(a.date))
        );

        const holidayDays: Date[] = [];
        (holidays || []).forEach((h: any) => {
            const start = startOfDay(parseISO(h.start_date));
            const end = startOfDay(parseISO(h.end_date));
            let curr = new Date(start);
            while (curr <= end) {
                holidayDays.push(new Date(curr));
                curr.setDate(curr.getDate() + 1);
            }
        });

        const leaveDays: Date[] = [];
        (leaves || []).forEach((l: any) => {
            const start = startOfDay(parseISO(l.start_date));
            const end = startOfDay(parseISO(l.end_date));
            let curr = new Date(start);
            while (curr <= end) {
                leaveDays.push(new Date(curr));
                curr.setDate(curr.getDate() + 1);
            }
        });

        const getDayConfig = (date: Date) => {
            // Priority: Check if there's a custom day-off assignment for this date
            if (dayOffs && dayOffs.length > 0) {
                const dateStr = startOfDay(date).getTime();
                const activeAssignment = dayOffs.find((d: any) => {
                    const from = startOfDay(parseISO(d.effective_from)).getTime();
                    const to = d.effective_to ? startOfDay(parseISO(d.effective_to)).getTime() : Infinity;
                    return dateStr >= from && dateStr <= to;
                });

                if (activeAssignment) {
                    if (activeAssignment.frequency === 'specific_dates') {
                        const dateStrFormatted = format(date, 'yyyy-MM-dd');
                        return { is_working: !(activeAssignment.specific_dates || []).includes(dateStrFormatted) };
                    }

                    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
                    const dayName = days[date.getDay()];
                    const daysOff = (activeAssignment.days_off || []).map((d: string) => d.toLowerCase());

                    if (activeAssignment.frequency === 'monthly') {
                        if (!daysOff.includes(dayName)) return { is_working: true };
                        
                        const weekOfMonth = Math.ceil(date.getDate() / 7);
                        const isLastWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7).getMonth() !== date.getMonth();
                        const weeks = activeAssignment.weeks_of_month || [];
                        const isOff = weeks.includes(weekOfMonth) || (weeks.includes(5) && isLastWeek);
                        
                        return { is_working: !isOff };
                    }

                    // Default: Weekly
                    const isOff = daysOff.includes(dayName);
                    return { is_working: !isOff };
                }
            }

            if (!workingDays) return null;
            const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
            const dayName = days[date.getDay()];
            return Array.isArray(workingDays) ? workingDays[date.getDay()] : workingDays[dayName];
        };

        const isHalfDay = (date: Date) => {
            const config = getDayConfig(date);
            if (!config || !config.is_working || !config.start_time || !config.end_time) return false;

            try {
                const [startH, startM] = config.start_time.split(':').map(Number);
                const [endH, endM] = config.end_time.split(':').map(Number);
                const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
                return durationMinutes > 0 && durationMinutes <= 300;
            } catch (e) {
                return false;
            }
        };

        const isDayOff = (date: Date) => {
            const config = getDayConfig(date);
            return config && (config.is_working === false || config.is_working === 0 || config.is_working === "0");
        };

        return {
            attended: attendanceDays,
            holiday: holidayDays,
            leave: leaveDays,
            halfDay: (date: Date) => isHalfDay(date),
            dayOff: (date: Date) => isDayOff(date),
        };
    }, [attendance, holidays, leaves, workingDays]);

    return (
        <div className="p-3">
            <DayPicker
                mode="single"
                selected={selected}
                onSelect={onSelect}
                onMonthChange={onMonthChange}
                month={month}
                weekStartsOn={1}
                className={cn("w-full", className)}
                modifiers={modifiers}
            classNames={{
                ...defaultClassNames,
                // Override root padding that react-day-picker adds
                root: "!p-0 !m-0",
                // Root container
                months: "flex flex-col sm:flex-row space-y-6 sm:space-x-6 sm:space-y-0 w-full relative !p-0 !m-0",
                month: "w-full !p-0 !m-0",
                // Month header with proper spacing - aligned with nav buttons vertically at top
                month_caption: "flex justify-center relative items-center px-0 min-w-0 h-9 mb-4",
                caption_label: "text-base font-semibold text-gray-800 dark:text-gray-200 tracking-tight whitespace-nowrap flex items-center justify-center",
                // Navigation buttons - positioned absolutely with equal spacing
                nav: "flex items-center absolute inset-x-1 top-0 justify-between z-40 pointer-events-none",
                button_previous: cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-10 w-10 p-0 text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-primary/10 transition-all duration-200 rounded-full pointer-events-auto flex-shrink-0 hover:scale-110 active:scale-90"
                ),
                button_next: cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-10 w-10 p-0 text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-primary/10 transition-all duration-200 rounded-full pointer-events-auto flex-shrink-0 hover:scale-110 active:scale-90"
                ),
                // Table grid with proper spacing
                table: "w-full border-collapse select-none",
                weekdays: "grid grid-cols-7 gap-2 w-full mb-2",
                weekday: "text-gray-500 dark:text-gray-500 h-8 font-semibold text-[12px] uppercase text-center tracking-widest flex items-center justify-center",
                // Week rows with consistent gap
                week: "grid grid-cols-7 gap-2 w-full",
                // Day cells - centered with proper spacing
                day: "h-10 w-10 p-0 m-0 relative focus-within:z-20 flex items-center justify-center",
                day_button: cn(
                    "h-10 w-10 text-sm font-semibold transition-all rounded-full relative flex items-center justify-center",
                    "!p-0 !m-0 !min-w-0 !min-h-0 !border-0"
                ),
                selected: "!bg-transparent !hover:bg-transparent !text-inherit",
            }}
            components={{
                Chevron: ({ orientation }) =>
                    orientation === "left" ? (
                        <ChevronLeftIcon className="h-5 w-5" />
                    ) : (
                        <ChevronRightIcon className="h-5 w-5" />
                    ),
                DayButton: ({ day: dayObj, modifiers, ...props }: any) => {
                    const date = dayObj.date;
                    const isToday = modifiers.today;
                    const isSelected = modifiers.selected;
                    const isAttended = modifiers.attended;
                    const isHoliday = modifiers.holiday;
                    const isLeave = modifiers.leave;
                    const isDayOffModifier = modifiers.dayOff;

                    // 1. Get the Raw Config for this day
                    const weekDays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
                    const dayName = weekDays[date.getDay()];
                    
                    // Resilient config lookup (handles Custom Day Offs, Objects, and Arrays)
                    let config = null;

                    // A. Check Custom Day Offs FIRST
                    if (dayOffs && dayOffs.length > 0) {
                        const dateStr = startOfDay(date).getTime();
                        const activeAssignment = dayOffs.find((d: any) => {
                            const from = startOfDay(parseISO(d.effective_from)).getTime();
                            const to = d.effective_to ? startOfDay(parseISO(d.effective_to)).getTime() : Infinity;
                            return dateStr >= from && dateStr <= to;
                        });

                        if (activeAssignment) {
                            if (activeAssignment.frequency === 'specific_dates') {
                                const dateStrFormatted = format(date, 'yyyy-MM-dd');
                                const isOff = (activeAssignment.specific_dates || []).includes(dateStrFormatted);
                                config = { is_working: !isOff };
                            } else {
                                const daysOff = (activeAssignment.days_off || []).map((d: string) => d.toLowerCase());
                                
                                if (activeAssignment.frequency === 'monthly') {
                                    if (daysOff.includes(dayName)) {
                                        const weekOfMonth = Math.ceil(date.getDate() / 7);
                                        const isLastWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7).getMonth() !== date.getMonth();
                                        const weeks = activeAssignment.weeks_of_month || [];
                                        const isOff = weeks.includes(weekOfMonth) || (weeks.includes(5) && isLastWeek);
                                        config = { is_working: !isOff };
                                    } else {
                                        config = { is_working: true };
                                    }
                                } else {
                                    // Default: Weekly
                                    const isOff = daysOff.includes(dayName);
                                    config = { is_working: !isOff };
                                }
                            }
                        }
                    }

                    // B. Fallback to Working Shift config
                    if (!config && workingDays && typeof workingDays === 'object') {
                        if (Array.isArray(workingDays)) {
                            // If it's a 7-item array, check if index 0 is Sunday or Monday
                            const dayIndex = date.getDay(); // 0-6 (Sun-Sat)
                            if (workingDays.length === 7) {
                                const candidate = workingDays[dayIndex];
                                if (dayIndex === 0 && candidate?.day && candidate.day !== 'sunday') {
                                    config = workingDays[6];
                                } else {
                                    config = candidate;
                                }
                            }
                        } else {
                            config = workingDays[dayName] || workingDays[dayName.charAt(0).toUpperCase() + dayName.slice(1)];
                        }
                    }

                    // 2. Evaluate 'Day Off' vs 'Half Day' logic
                    // If we have a config but it is specifically NOT working
                    const isDayOff = config && (config.is_working === false || config.is_working === 0 || config.is_working === "0");
                    
                    // Fallback: If NO config at all, Sunday is likely a day off
                    const isImplicitDayOff = !config && date.getDay() === 0;

                    let isHalfDay = false;
                    if (config && config.is_working && config.start_time && config.end_time) {
                        try {
                            const [sH, sM] = config.start_time.split(':').map(Number);
                            const [eH, eM] = config.end_time.split(':').map(Number);
                            const duration = (eH * 60 + eM) - (sH * 60 + sM);
                            isHalfDay = duration > 0 && duration <= 300;
                        } catch(e) {}
                    }

                    const showDayOff = isDayOff || isImplicitDayOff;

                    return (
                        <button
                            {...props}
                            className={cn(
                                "h-10 w-10 text-sm font-semibold rounded-full relative inline-flex items-center justify-center flex-shrink-0",
                                "!p-0 !m-0 !border-0 !min-w-0 !min-h-0 !outline-0",
                                "transition-all duration-200",
                                // Highlight logic (Matched intensities for cohesive look)
                                !isSelected && (
                                    showDayOff ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20" :
                                    isHalfDay ? "bg-[linear-gradient(45deg,rgba(244,63,94,0.15)_50%,transparent_50%)] text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20" :
                                    isHoliday ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20" :
                                    isLeave ? "bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20" :
                                    "text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                                ),
                                // Today ring
                                isToday && !isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-[#060818]",
                                // Selected day
                                isSelected && "bg-primary text-white font-bold shadow-lg scale-110 z-10"
                            )}
                        >
                            <span className="relative z-10 text-sm font-bold leading-none">
                                {date.getDate()}
                            </span>

                            {/* Attendance dot - bottom indicator (Emerald) */}
                            {isAttended && !isHalfDay && (
                                <span
                                    className={cn(
                                        "absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full shadow-sm flex-shrink-0",
                                        isSelected ? "bg-white" : "bg-emerald-500"
                                    )}
                                />
                            )}

                            {/* Holiday/Leave/DayOff accent dots */}
                            {(isHoliday || isLeave || isDayOffModifier) && !isSelected && (
                                <span
                                    className={cn(
                                        "absolute top-1.5 right-1.5 w-1 h-1 rounded-full flex-shrink-0",
                                        isHoliday ? "bg-amber-500" : (isLeave ? "bg-violet-500" : "bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]")
                                    )}
                                />
                            )}
                        </button>
                    );
                },
            }}
            {...props}
        />
        </div>
    );
}