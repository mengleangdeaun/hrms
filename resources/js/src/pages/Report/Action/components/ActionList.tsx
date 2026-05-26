import React from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { IconMapPin, IconQuestionMark, IconPlayerPlay, IconPlayerStop, IconActivity, IconCoffee } from '@tabler/icons-react';
import { DatePicker } from '@/components/ui/date-picker';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useFormatDate } from '@/hooks/useFormatDate';

interface ActionListProps {
    actions: any[];
    activeActionId: string | null;
    onActionClick: (id: string) => void;
    getEventColor: (category: string) => string;
    getEventIcon: (category: string) => React.ReactNode;
}

const ActionList = ({ actions, activeActionId, onActionClick, getEventColor, getEventIcon }: ActionListProps) => {
    const { t } = useTranslation('report');
    const { formatTime, formatDate } = useFormatDate();
    const [filterDate, setFilterDate] = React.useState<Date | undefined>(undefined);

    const filteredActions = React.useMemo(() => {
        if (!filterDate) return actions;
        const formattedFilter = dayjs(filterDate).format('YYYY-MM-DD');
        return actions.filter(action => action.date === formattedFilter);
    }, [actions, filterDate]);

    const IconLegend = () => (
        <div className="p-3 space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                {t('icon_legend', 'Icon Legend')}
            </h4>
            <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-900">
                        <IconPlayerPlay className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('clock_in', 'Clock In')}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{t('clock_in_desc', 'Start of work session')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center border border-rose-100 dark:border-rose-900">
                        <IconPlayerStop className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('clock_out', 'Clock Out')}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{t('clock_out_desc', 'End of work session')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center border border-amber-100 dark:border-amber-900">
                        <IconCoffee className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('session_break', 'Session Break')}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{t('session_break_desc', 'Break or lunch session')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/5 dark:bg-primary/10 flex items-center justify-center border border-primary/10 dark:border-primary/20">
                        <IconActivity className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('activity', 'Activity')}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{t('activity_desc', 'Work activity or field report')}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <Card className="lg:col-span-5 h-[calc(100vh-280px)] overflow-hidden rounded-xl flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-4">
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-500 whitespace-nowrap">{t('action_list', 'Action List')}</h3>
                
                <div className="flex items-center gap-2">
                    <DatePicker 
                        value={filterDate} 
                        onChange={setFilterDate} 
                        placeholder={t('filter_by_date', 'Filter by date')}
                        className="h-8 text-[11px] dark:bg-gray-900 w-[140px] px-2 font-bold uppercase tracking-tight"
                        align="end"
                    />

                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                <IconQuestionMark size={14} stroke={3} />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent side="top" align="end" className="w-64 p-0 shadow-xl border-slate-200 dark:border-slate-800">
                            <IconLegend />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredActions.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('no_actions_on_this_date', 'No actions found')}</p>
                        </div>
                    ) : (
                        filteredActions.map((action: any) => (
                            <button
                                key={action.id}
                                onClick={() => onActionClick(action.id)}
                                className={cn(
                                    "relative w-full text-left px-4 py-2.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-4 group",
                                    activeActionId === action.id ? "bg-primary/5 dark:bg-primary/10" : ""
                                )}
                            >
                                {/* Active Indicator Pill */}
                                {activeActionId === action.id && (
                                    <div className="absolute left-0 w-1 h-full bg-primary  shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]" />
                                )}
                                
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-110",
                                    getEventColor(action.category)
                                )}>
                                    {getEventIcon(action.category)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <h4 className="text-sm font-black text-slate-800 dark:text-white truncate">
                                            {action.label}
                                        </h4>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {formatDate(action.date)}
                                            </span>
                                            <span className="text-xs font-black text-slate-800 dark:text-white">
                                                {formatTime(action.time)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate">
                                        <IconMapPin size={10} />
                                        <span className="truncate">{action.location}</span>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
};

export default ActionList;
