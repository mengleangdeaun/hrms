import React from 'react';
import { 
    IconRotateClockwise,
    IconClock,
    IconArrowRightBar,
    IconArrowLeftBar,
    IconHistory,
    IconTrendingUp,
    IconCheck,
} from '@tabler/icons-react';
import BottomSheet from '@/components/ui/bottom-sheet';
import { cn } from '@/lib/utils';
import { startOfToday, startOfYesterday, startOfWeek, subWeeks, startOfMonth, format, subDays } from 'date-fns';
import { PwaDatePicker } from '@/components/ui/pwa/pwa-date-picker';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface HistoryFilterSheetProps {
    isOpen: boolean;
    onClose: () => void;
    filters: {
        status: string;
        in_status: string;
        out_status: string;
        date_from: string;
        date_to: string;
    };
    onApply: (filters: any) => void;
}

const AUDIT_CATEGORIES = [
    { id: 'early_in',        label: 'Early In',      translationKey: 'early_in',        key: 'in_status',  value: 'Early',     icon: IconArrowRightBar, color: 'text-emerald-500', activeBg: 'bg-emerald-500', ring: 'ring-emerald-500' },
    { id: 'late_in',         label: 'Late In',        translationKey: 'late_in',         key: 'in_status',  value: 'Late',      icon: IconClock,         color: 'text-amber-500',   activeBg: 'bg-amber-500',   ring: 'ring-amber-500' },
    { id: 'early_departure', label: 'Early Depart',   translationKey: 'early_depart',     key: 'out_status', value: 'Early',     icon: IconArrowLeftBar,  color: 'text-rose-500',    activeBg: 'bg-rose-500',    ring: 'ring-rose-500' },
    { id: 'stay_late',       label: 'Stay Late',      translationKey: 'stay_late',       key: 'out_status', value: 'Stay Late', icon: IconHistory,       color: 'text-indigo-500',  activeBg: 'bg-indigo-500',  ring: 'ring-indigo-500' },
    { id: 'overtime',        label: 'Overtime',       translationKey: 'overtime',        key: 'out_status', value: 'Overtime',  icon: IconTrendingUp,    color: 'text-purple-500',  activeBg: 'bg-purple-500',  ring: 'ring-purple-500' },
];

export const HistoryFilterSheet: React.FC<HistoryFilterSheetProps> = ({ isOpen, onClose, filters, onApply }) => {
    const { t } = useTranslation('pwa');

    const DATE_PRESETS = [
        { id: 'today',      label: t('today', 'Today') },
        { id: 'yesterday',  label: t('yesterday', 'Yesterday') },
        { id: 'this_week',  label: t('this_week', 'This Week') },
        { id: 'last_week',  label: t('last_week', 'Last Week') },
        { id: 'this_month', label: t('this_month', 'This Month') },
    ];

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
        const today = new Date();
        let from = '', to = '';
        switch (preset) {
            case 'today':      from = to = format(startOfToday(), 'yyyy-MM-dd'); break;
            case 'yesterday':  from = to = format(startOfYesterday(), 'yyyy-MM-dd'); break;
            case 'this_week':
                from = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                to   = format(today, 'yyyy-MM-dd');
                break;
            case 'last_week':
                from = format(startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');
                to   = format(subDays(startOfWeek(today, { weekStartsOn: 1 }), 1), 'yyyy-MM-dd');
                break;
            case 'this_month':
                from = format(startOfMonth(today), 'yyyy-MM-dd');
                to   = format(today, 'yyyy-MM-dd');
                break;
        }
        setLocalFilters({ ...localFilters, date_from: from, date_to: to });
    };

    const handleClear = () => {
        setLocalFilters({ status: '', in_status: '', out_status: '', date_from: '', date_to: '' });
    };

    const toggleAudit = (cat: typeof AUDIT_CATEGORIES[0]) => {
        const key = cat.key as 'in_status' | 'out_status';
        setLocalFilters({ ...localFilters, [key]: localFilters[key] === cat.value ? '' : cat.value });
    };

    const activeAuditCount = AUDIT_CATEGORIES.filter(c => localFilters[c.key as keyof typeof localFilters] === c.value).length;
    const hasFilters = !!localFilters.date_from || !!localFilters.date_to || activeAuditCount > 0;

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title={t('attendance_audit', 'Attendance Audit')}
        >
            {/* Scrollable body */}
            <div className="flex flex-col gap-7 pt-1 pb-6">

                {/* ── Review Range ── */}
                <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('review_range', 'Review Range')}</span>
                        {hasFilters && (
                            <button
                                onClick={handleClear}
                                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-500 active:scale-95 transition-transform"
                            >
                                <IconRotateClockwise size={11} />
                                {t('reset_all', 'Reset All')}
                            </button>
                        )}
                    </div>

                    {/* Presets — pill row, wrapping */}
                    <div className="flex flex-wrap gap-2">
                        {DATE_PRESETS.map((p) => {
                            const selected = activePreset === p.id;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => setPreset(p.id)}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-[11px] font-bold border transition-all active:scale-95",
                                        selected
                                            ? "bg-primary text-white shadow-sm shadow-blue-200 dark:shadow-blue-900/40"
                                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                                    )}
                                >
                                    {p.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Custom date */}
                    <PwaDatePicker
                        className="w-full bg-gray-50 dark:bg-gray-800/50"
                        label={t('specific_day', 'Specific Day')}
                        placeholder={t('select_date', 'Select specific day')}
                        value={localFilters.date_from === localFilters.date_to ? localFilters.date_from : ''}
                        onChange={(val) => setLocalFilters({ ...localFilters, date_from: val, date_to: val })}
                    />
                </section>

                {/* ── Audit Categories ── */}
                <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('audit_categories', 'Audit Categories')}</span>
                        {activeAuditCount > 0 && (
                            <span className="text-[10px] font-black text-blue-500">{activeAuditCount} {t('selected', 'selected')}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Clock In Status */}
                        <div className="flex p-1 bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl relative border border-white dark:border-gray-700/30">
                            {AUDIT_CATEGORIES.filter(c => c.key === 'in_status').map((cat) => {
                                const selected = localFilters.in_status === cat.value;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => toggleAudit(cat)}
                                        className={cn(
                                            "relative flex-1 py-2.5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wide transition-all z-10",
                                            selected ? "text-gray-900 dark:text-white" : "text-gray-400 hover:text-gray-500"
                                        )}
                                    >
                                        <cat.icon className={cn("w-3.5 h-3.5", selected ? cat.color : "opacity-70")} />
                                        {t(cat.translationKey, cat.label)}

                                        {selected && (
                                            <motion.div
                                                layoutId="active-in-status"
                                                className="absolute inset-0 bg-white dark:bg-gray-700 rounded-xl shadow-sm -z-10"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Clock Out Status */}
                        <div className="flex p-1 bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl relative border border-white dark:border-gray-700/30">
                            {AUDIT_CATEGORIES.filter(c => c.key === 'out_status').map((cat) => {
                                const selected = localFilters.out_status === cat.value;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => toggleAudit(cat)}
                                        className={cn(
                                            "relative flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-wide transition-all z-10",
                                            selected ? "text-gray-900 dark:text-white" : "text-gray-400 hover:text-gray-500"
                                        )}
                                    >
                                        <cat.icon className={cn("w-3.5 h-3.5", selected ? cat.color : "opacity-70")} />
                                        <span className="truncate">{t(cat.translationKey, cat.label)}</span>

                                        {selected && (
                                            <motion.div
                                                layoutId="active-out-status"
                                                className="absolute inset-0 bg-white dark:bg-gray-700 rounded-xl shadow-sm -z-10"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </div>

            {/* ── Sticky Apply button — pinned to sheet bottom ── */}
            <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-slate-900 pt-3 pb-safe">
                <div className="pb-2">
                    <button
                        onClick={() => onApply(localFilters)}
                        className="w-full py-4 rounded-full bg-primary text-white text-[12px] font-black uppercase tracking-wide shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all"
                    >
                        {t('apply_filter', 'Apply Filter')}
                        {hasFilters && (
                            <span className="ml-2 bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                {(activeAuditCount + (localFilters.date_from ? 1 : 0))} {t('active', 'active')}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </BottomSheet>
    );
};