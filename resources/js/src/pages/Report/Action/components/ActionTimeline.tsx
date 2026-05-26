import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { IconClock, IconMapPin, IconCalendar, IconExternalLink, IconCamera } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useFormatDate } from '@/hooks/useFormatDate';

interface ActionTimelineProps {
    actions: any[];
    activeActionId: string | null;
    timelineRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
    getEventColor: (category: string) => string;
    getEventIcon: (category: string) => React.ReactNode;
    openPreview: (src: string, title: string) => void;
}

const ActionTimeline = ({ 
    actions, 
    activeActionId, 
    timelineRefs, 
    getEventColor, 
    getEventIcon, 
    openPreview 
}: ActionTimelineProps) => {
    const { t } = useTranslation('report');
    const { formatTime, formatDate } = useFormatDate();

    // Group actions by date
    const groupedActions = actions.reduce((acc: any, action: any) => {
        const date = action.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(action);
        return acc;
    }, {});

    return (
        <div className="lg:col-span-7 h-[calc(100vh-280px)] flex flex-col bg-slate-50/30 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-slate-800 p-0 overflow-hidden">
            <ScrollArea className="flex-1">
                <div className="relative space-y-6 p-6 before:absolute before:inset-0 before:ml-[40px] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                    
                    {Object.entries(groupedActions).map(([date, actions]: [string, any]) => (
                        <div key={date} className="relative pt-4">
                            {/* Date Divider */}
                            <div className="sticky top-2 z-20 py-2 mb-6">
                                <div className="inline-flex items-center gap-3 bg-background/90 backdrop-blur-sm dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm ml-[-4px]">
                                    <IconCalendar className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                                        {formatDate(date)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-8 mt-4 pb-8">
                                {actions.map((action: any) => (
                                    <div 
                                        key={action.id} 
                                        ref={(el) => timelineRefs.current[action.id] = el}
                                        className={cn(
                                            "relative flex items-start gap-6 group transition-all duration-500",
                                            activeActionId === action.id ? "" : ""
                                        )}
                                    >
                                        {/* Icon Circle */}
                                        <div className={cn(
                                            "flex items-center justify-center w-8 h-8 rounded-full border-4 border-white dark:border-black shadow-lg shrink-0 z-10 transition-all duration-300",
                                            getEventColor(action.category),
                                            activeActionId === action.id ? "ring-4 ring-primary/20 " : ""
                                        )}>
                                            {getEventIcon(action.category)}
                                        </div>

                                        {/* Content Card */}
                                        <div className={cn(
                                            "flex-1 p-4 rounded-2xl transition-all duration-300 border shadow-sm",
                                            activeActionId === action.id 
                                                ? "bg-white dark:bg-slate-900 border-primary shadow-primary/10 ring-1 ring-primary/50" 
                                                : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                                        )}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <IconClock size={14} className="text-slate-400" />
                                                    <span className="text-sm font-black text-slate-800 dark:text-white">
                                                        {formatTime(action.time)}
                                                    </span>
                                                </div>
                                                <Badge 
                                                    variant={action.type === 'attendance' ? 'success' : 'warning'} 
                                                    className="text-[10px] font-black uppercase tracking-wider h-5"
                                                >
                                                    {action.type}
                                                </Badge>
                                            </div>

                                            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">{action.label}</h4>
                                            
                                            {action.description && (
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">
                                                    {action.description}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-50 dark:border-slate-800/50">
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                                    <button 
                                                        onClick={() => {
                                                            const url = (action.latitude && action.longitude)
                                                                ? `https://www.google.com/maps?q=${action.latitude},${action.longitude}`
                                                                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(action.location)}`;
                                                            window.open(url, '_blank');
                                                        }}
                                                        className="flex items-center gap-1.5 hover:text-primary transition-colors text-left group/loc"
                                                        title={t('view_on_google_maps', 'View on Google Maps')}
                                                    >
                                                        <IconMapPin size={14} className="text-primary/70 group-hover/loc:text-primary transition-colors" />
                                                        <span className="truncate max-w-[200px] font-bold text-slate-600 dark:text-slate-400 group-hover/loc:text-primary transition-colors border-b border-dashed border-transparent group-hover/loc:border-primary/30">
                                                            {action.location}
                                                        </span>
                                                        <IconExternalLink size={12} className="opacity-0 group-hover/loc:opacity-100 transition-opacity" />
                                                    </button>
                                                </div>

                                                {action.status && (
                                                    <Badge className="ml-auto text-[9px] font-black uppercase tracking-tighter h-5">
                                                        {action.status}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Attachments for Activity */}
                                            {action.attachments && action.attachments.length > 0 && (
                                                <div className="flex gap-2 mt-4 overflow-x-auto pb-0 scrollbar-hide">
                                                    {action.attachments.map((img: string, idx: number) => (
                                                        <div 
                                                            key={idx} 
                                                            className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm shrink-0 cursor-pointer group/img"
                                                            onClick={() => openPreview(img, action.label)}
                                                        >
                                                            <img src={img} alt="activity" className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                                <IconCamera size={16} className="text-white" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Meta for Attendance */}
                                            {action.meta && (
                                                <div className="flex gap-2 mt-3">
                                                    {action.meta.late_minutes > 0 && (
                                                        <Badge variant="destructive" className="text-[10px] h-5 font-bold">
                                                            {t('late', 'Late')}: {action.meta.late_minutes}m
                                                        </Badge>
                                                    )}
                                                    {action.meta.overtime_minutes > 0 && (
                                                        <Badge className="bg-emerald-500 text-[10px] h-5 border-none text-white font-bold">
                                                            {t('ot', 'OT')}: {action.meta.overtime_minutes}m
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};

export default ActionTimeline;
