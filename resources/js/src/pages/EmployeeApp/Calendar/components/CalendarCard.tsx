import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmployeeCalendar } from '@/components/ui/pwa/EmployeeCalendar';
import { startOfDay } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { playSwipeSound } from '@/lib/audio';

interface CalendarCardProps {
    selectedDate: Date | undefined;
    setSelectedDate: (date: Date | undefined) => void;
    currentMonth: Date;
    setCurrentMonth: (date: Date) => void;
    data: any;
}

export const CalendarCard: React.FC<CalendarCardProps> = ({ 
    selectedDate, 
    setSelectedDate, 
    currentMonth, 
    setCurrentMonth,
    data 
}) => {
    const { t } = useTranslation('pwa');
    const [direction, setDirection] = React.useState(0);

    // Handle month change from both swipe and buttons
    const handleMonthChange = (newMonth: Date) => {
        const diff = newMonth.getTime() - currentMonth.getTime();
        if (diff === 0) return;
        setDirection(diff > 0 ? 1 : -1);
        setCurrentMonth(newMonth);
        playSwipeSound();
    };

    const adjustMonth = (offset: number) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + offset);
        handleMonthChange(newMonth);
    };

    // Swipe handler
    const handlePanEnd = (e: any, info: any) => {
        const threshold = 30;
        const velocity = info.velocity.x;
        if (info.offset.x > threshold || velocity > 500) {
            adjustMonth(-1); // Swipe Right -> Prev Month
        } else if (info.offset.x < -threshold || velocity < -500) {
            adjustMonth(1); // Swipe Left -> Next Month
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="m-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white/50 dark:border-gray-700/30 overflow-hidden relative"
        >
            <motion.div
                onPanEnd={handlePanEnd}
                className="touch-none" // Prevent native scrolling interfere with swipe
            >
                <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                    <motion.div
                        key={currentMonth.toISOString()}
                        custom={direction}
                        initial={{ opacity: 0, x: direction > 0 ? 120 : -120 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction > 0 ? -120 : 120 }}
                        transition={{ 
                            type: 'spring', 
                            stiffness: 500, 
                            damping: 40,
                            mass: 0.8
                        }}
                    >
                        <EmployeeCalendar
                            selected={selectedDate}
                            onSelect={(date) => setSelectedDate(date ? startOfDay(date) : undefined)}
                            onMonthChange={handleMonthChange}
                            month={currentMonth}
                            attendance={data.attendance}
                            holidays={data.holidays}
                            leaves={data.leaves}
                            dayOffs={data.day_offs}
                            workingDays={data.working_days}
                        />
                    </motion.div>
                </AnimatePresence>
            </motion.div>

            {/* Legend Section */}
            <div className="px-6 py-5 bg-gray-50/30 dark:bg-gray-900/40 border-t border-white/20 dark:border-gray-700/30 flex flex-wrap justify-around gap-x-4 gap-y-2 text-[9px] font-black uppercase text-gray-400">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]"></div> {t('day_off', 'Day Off') as string}
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {t('present', 'Present') as string}
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> {t('holiday', 'Holiday') as string}
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.3)]"></div> {t('leave', 'Leave') as string}
                </div>
            </div>
            
        </motion.div>
    );
};
