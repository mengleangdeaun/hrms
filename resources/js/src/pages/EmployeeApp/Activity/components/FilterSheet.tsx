import React from 'react';
import { motion } from 'framer-motion';
import {
    IconMapPin,
    IconBuildingSkyscraper,
    IconMessages,
    IconPackage,
    IconSchool,
    IconTrianglePlus2,
    IconDots,
    IconTools,
    IconCalendar,
    IconChevronRight,
    IconRotateClockwise,
} from '@tabler/icons-react';
import BottomSheet from '@/components/ui/bottom-sheet';
import { cn } from '@/lib/utils';
import { startOfToday, startOfYesterday, startOfWeek, subWeeks, startOfMonth, format, subDays } from 'date-fns';
import { PwaDatePicker } from '@/components/ui/pwa/pwa-date-picker';
import { useTranslation } from 'react-i18next';

interface FilterSheetProps {
    isOpen: boolean;
    onClose: () => void;
    filters: {
        activity_type: string;
        date_from: string;
        date_to: string;
    };
    onApply: (filters: any) => void;
}

const ACTIVITY_TYPES = [
    { id: 'Sale Outdoor', label: 'Sale Outdoor', translationKey: 'sale_outdoor', icon: IconMapPin, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'Site Visit', label: 'Site Visit', translationKey: 'site_visit', icon: IconBuildingSkyscraper, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { id: 'On-Site Service', label: 'On-Site Service', translationKey: 'on-site_service', icon: IconTools, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { id: 'Meeting / Discussion', label: 'Meeting / Discussion', translationKey: 'meeting_discussion', icon: IconMessages, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { id: 'Delivery / Collection', label: 'Delivery / Collection', translationKey: 'delivery_collection', icon: IconPackage, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { id: 'Training', label: 'Training', translationKey: 'training', icon: IconSchool, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { id: 'Support', label: 'Support', translationKey: 'support', icon: IconTrianglePlus2, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { id: 'Other', label: 'Other', translationKey: 'other', icon: IconDots, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20' },
];

export const FilterSheet: React.FC<FilterSheetProps> = ({ isOpen, onClose, filters, onApply }) => {
    const { t } = useTranslation('pwa');
    const [localFilters, setLocalFilters] = React.useState(filters);

    React.useEffect(() => {
        if (isOpen) {
            setLocalFilters(filters);
        }
    }, [isOpen, filters]);

    const activePreset = (() => {
        const today = new Date();
        const todayStr = format(startOfToday(), 'yyyy-MM-dd');
        const yesterdayStr = format(startOfYesterday(), 'yyyy-MM-dd');
        const thisWeekFrom = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const lastWeekStart = format(startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const lastWeekEnd = format(subDays(startOfWeek(today, { weekStartsOn: 1 }), 1), 'yyyy-MM-dd');
        const thisMonthFrom = format(startOfMonth(today), 'yyyy-MM-dd');

        if (localFilters.date_from === todayStr && localFilters.date_to === todayStr) return 'today';
        if (localFilters.date_from === yesterdayStr && localFilters.date_to === yesterdayStr) return 'yesterday';
        if (localFilters.date_from === thisWeekFrom && localFilters.date_to === format(today, 'yyyy-MM-dd')) return 'this_week';
        if (localFilters.date_from === lastWeekStart && localFilters.date_to === lastWeekEnd) return 'last_week';
        if (localFilters.date_from === thisMonthFrom && localFilters.date_to === format(today, 'yyyy-MM-dd')) return 'this_month';
        return null;
    })();
    const setPreset = (preset: string) => {
        let from = '';
        let to = '';
        const today = new Date();

        switch (preset) {
            case 'today':
                from = to = format(startOfToday(), 'yyyy-MM-dd');
                break;
            case 'yesterday':
                from = to = format(startOfYesterday(), 'yyyy-MM-dd');
                break;
            case 'this_week':
                from = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                to = format(today, 'yyyy-MM-dd');
                break;
            case 'last_week':
                const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
                from = format(lastWeekStart, 'yyyy-MM-dd');
                to = format(subDays(startOfWeek(today, { weekStartsOn: 1 }), 1), 'yyyy-MM-dd');
                break;
            case 'this_month':
                from = format(startOfMonth(today), 'yyyy-MM-dd');
                to = format(today, 'yyyy-MM-dd');
                break;
        }

        setLocalFilters({ ...localFilters, date_from: from, date_to: to });
    };

    const handleClear = () => {
        setLocalFilters({ activity_type: '', date_from: '', date_to: '' });
    };

    const hasFilters = !!localFilters.date_from || !!localFilters.date_to || !!localFilters.activity_type;

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title={t('filter_activities', 'Filter Activities') as string}>
            <div className="flex flex-col gap-7 pt-1 pb-6">
                {/* Date Presets */}
                <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('review_range', 'Review Range') as string}</span>
                        {hasFilters && (
                            <button onClick={handleClear} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-500 active:scale-95 transition-transform">
                                <IconRotateClockwise size={11} />
                                {t('reset_all', 'Reset All') as string}
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'today', label: t('today', 'Today') as string },
                            { id: 'yesterday', label: t('yesterday', 'Yesterday') as string },
                            { id: 'this_week', label: t('this_week', 'This Week') as string },
                            { id: 'last_week', label: t('last_week', 'Last Week') as string },
                            { id: 'this_month', label: t('this_month', 'This Month') as string },
                        ].map((p) => {
                            const selected = activePreset === p.id;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => setPreset(p.id)}
                                    className={cn(
                                        'px-4 py-2 rounded-full text-[11px] font-bold border transition-all active:scale-95',
                                        selected
                                            ? 'bg-primary text-white shadow-sm shadow-blue-200 dark:shadow-blue-900/40'
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300',
                                    )}
                                >
                                    {p.label}
                                </button>
                            );
                        })}
                    </div>

                    <PwaDatePicker
                        className="w-full bg-gray-50 dark:bg-gray-800/50"
                        label={t('specific_day', 'Or Custom Date') as string}
                        placeholder={t('select_date', 'Select specific day') as string}
                        value={localFilters.date_from === localFilters.date_to ? localFilters.date_from : ''}
                        onChange={(val) => setLocalFilters({ ...localFilters, date_from: val, date_to: val })}
                    />
                </section>

                {/* Activity Types */}
                <section className="flex flex-col gap-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('audit_categories', 'Activity Category') as string}</span>
                    <div className="grid grid-cols-2 gap-2.5">
                        {ACTIVITY_TYPES.map((type) => {
                            const selected = localFilters.activity_type === type.id;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => setLocalFilters({ ...localFilters, activity_type: selected ? '' : type.id })}
                                    className={cn(
                                        'relative py-4 flex flex-col items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wide transition-all z-10',
                                        'bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-white dark:border-gray-700/30 active:scale-95',
                                        selected ? 'text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-500',
                                    )}
                                >
                                    <type.icon className={cn('w-5 h-5 shrink-0 transition-colors', selected ? type.color : 'opacity-70')} />
                                    <span className="text-center px-2 leading-tight">{t(type.translationKey, type.label) as string}</span>

                                    {selected && (
                                        <motion.div
                                            layoutId="active-activity-type"
                                            className="absolute inset-1 bg-white dark:bg-gray-700 rounded-xl shadow-md -z-10"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center font-medium px-4 leading-relaxed italic">
                        {t('activity_type_helper')}
                    </p>
                </section>
            </div>

            <div className="sticky z-50 bottom-0 left-0 right-0 bg-white dark:bg-slate-900 pt-3">
                <div className="pb-safe">
                    <button
                        onClick={() => onApply(localFilters)}
                        className="w-full py-4 rounded-full bg-primary text-white text-[12px] font-black uppercase tracking-wide shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all"
                    >
                        {t('apply_filter', 'Apply Filter') as string}
                        {hasFilters && (
                            <span className="ml-2 bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                {(localFilters.activity_type ? 1 : 0) + (localFilters.date_from ? 1 : 0)} {t('active', 'active') as string}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </BottomSheet>
    );
};
