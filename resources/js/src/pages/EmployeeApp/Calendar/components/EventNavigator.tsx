import React from 'react';
import { motion } from 'framer-motion';
import { IconClock, IconConfetti, IconCalendarPlus, IconCalendarOff } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface EventNavigatorProps {
    activeTab: 'workday' | 'holiday' | 'leave' | 'day_off';
    setActiveTab: (tab: 'workday' | 'holiday' | 'leave' | 'day_off') => void;
    hasApprovals?: boolean;
}

export const EventNavigator: React.FC<EventNavigatorProps> = ({ activeTab, setActiveTab }) => {
    const { t } = useTranslation('pwa');
    const tabs = [
        { id: 'workday', label: t('tab_workday', 'Workday') as string, icon: IconClock },
        { id: 'holiday', label: t('tab_holiday', 'Holiday') as string, icon: IconConfetti },
        { id: 'leave', label: t('tab_leave', 'Leave') as string, icon: IconCalendarPlus },
        { id: 'day_off', label: t('day_off', 'Day Off') as string, icon: IconCalendarOff },
    ] as const;

    return (
        <div className="flex p-1 bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl relative border border-white dark:border-gray-700/30">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                        "relative flex-1 py-2.5 flex items-center justify-center gap-1 text-[9px] font-black uppercase transition-all z-10",
                        activeTab === tab.id ? "text-gray-900 dark:text-white" : "text-gray-400 hover:text-gray-500"
                    )}
                >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span className="mb-0">{tab.label}</span>

                    {activeTab === tab.id && (
                        <motion.div
                            layoutId="active-tab"
                            className="absolute inset-0 bg-white dark:bg-gray-700 rounded-xl shadow-sm -z-10"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                </button>
            ))}
        </div>
    );
};
