import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface WorkdayViewProps {
    data: any;
    formatTime: (time: string | null) => string;
}

export const WorkdayView: React.FC<WorkdayViewProps> = ({ data, formatTime }) => {
    const { t } = useTranslation('pwa');
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

    if (!data.working_days) return null;

    return (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-4 border border-white/50 dark:border-gray-700/30 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[11px] uppercase tracking-wide text-gray-400">{t('weekly_schedule', 'Weekly Schedule') as string}</h3>
            </div>

            <div className="space-y-3">
                {days.map((day, i) => {
                    const schedule = data.working_days[day];
                    const isToday = format(new Date(), 'eeee').toLowerCase() === day;
                    
                    // Find an active custom day-off assignment
                    const activeAssignment = (data.day_offs || []).find((d: any) => {
                        const start = d.effective_from;
                        const end = d.effective_to;
                        const today = format(new Date(), 'yyyy-MM-dd');
                        return today >= start && (!end || today <= end);
                    });

                    // If we have an active assignment, use its days_off list to determine if THIS day is off
                    let isWorking = schedule?.is_working;
                    let isOverridden = false;

                    if (activeAssignment) {
                        const daysOffList = (activeAssignment.days_off || []).map((d: string) => d.toLowerCase());
                        const isOffInAssignment = daysOffList.includes(day);
                        isWorking = !isOffInAssignment;
                        isOverridden = true;
                    }

                    if (!schedule && !isOverridden) return null;

                    return (
                        <motion.div
                            key={day}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                                "p-3 rounded-2xl border transition-all",
                                isToday
                                    ? "bg-primary/5 border-primary/20 ring-1 ring-primary/10"
                                    : "bg-gray-50/50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800"
                            )}
                        >
                            <div className="flex justify-between items-center mb-3">
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-widest",
                                    isToday ? "text-primary" : "text-gray-900 dark:text-white"
                                )}>
                                    {t(day) as string}
                                    {isToday && <span className="ml-2 text-[8px] bg-primary text-white px-1.5 py-0.5 rounded shadow-sm">{t('today', 'TODAY') as string}</span>}
                                </span>
                                <span className={cn(
                                    "text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm",
                                    isWorking ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400" : "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400"
                                )}>
                                    {isWorking ? t('required', 'Required') as string : t('day_off', 'Day Off') as string}
                                </span>
                            </div>

                            {isWorking ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4 bg-white/50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <div className="flex-1">
                                            <span className="text-[8px] font-black text-primary uppercase block mb-0.5 opacity-60">{t('hours', 'Hours') as string}</span>
                                            <p className="text-xs font-black text-gray-800 dark:text-gray-200">
                                                {formatTime(schedule.start_time)} — {formatTime(schedule.end_time)}
                                            </p>
                                        </div>
                                        {schedule.has_break && (
                                            <div className="border-l border-gray-100 dark:border-gray-700 pl-4">
                                                <span className="text-[8px] font-black text-orange-500 uppercase block mb-0.5 opacity-60">{t('break', 'Break') as string}</span>
                                                <p className="text-[10px] font-bold text-gray-500">
                                                    {formatTime(schedule.break_start)} — {formatTime(schedule.break_end)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[10px] font-bold text-red-400/80 italic pl-1">{t('no_working_hours', 'No working hours scheduled.') as string}</p>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
