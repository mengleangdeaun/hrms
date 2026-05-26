import React from 'react';
import { motion } from 'framer-motion';
import { IconCalendarCheck, IconConfetti, IconCalendarPlus, IconCalendarOff } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface CalendarStatsProps {
    attendanceCount: number;
    holidayCount: number;
    leaveCount: number;
    dayOffCount: number;
}

export const CalendarStats: React.FC<CalendarStatsProps> = ({ attendanceCount, holidayCount, leaveCount, dayOffCount }) => {
    const { t } = useTranslation('pwa');
    const stats = [
        { label: t('present', 'Present') as string, value: attendanceCount, icon: IconCalendarCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
        { label: t('holiday', 'Holidays') as string, value: holidayCount, icon: IconConfetti, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
        { label: t('leave', 'Leaves') as string, value: leaveCount, icon: IconCalendarPlus, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/10' },
        { label: t('day_off', 'Day Off') as string, value: dayOffCount, icon: IconCalendarOff, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/10' },
    ];

    return (
        <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, i) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-3 border border-white/50 dark:border-gray-700/30 shadow-sm flex items-center gap-3 active:scale-95 transition-transform"
                >
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-base font-black text-gray-900 dark:text-white leading-tight">
                            {stat.value}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 truncate">
                            {stat.label}
                        </span>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
