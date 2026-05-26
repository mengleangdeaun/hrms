import React from 'react';
import { motion } from 'framer-motion';
import { IconMapPin, IconCalendarEvent, IconCheck, IconAlertTriangle, IconClock } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface ActivityCardProps {
    activity: any;
    statusConfig: Record<string, { label: string; translationKey?: string; color: string; icon: React.ReactNode }>;
}

export function ActivityCard({ activity, statusConfig }: ActivityCardProps) {
    const { t } = useTranslation('pwa');
    const status = statusConfig[activity.status] ?? statusConfig.submitted;
    const attachments = activity.attachment_urls || (activity.photo_url ? [activity.photo_url] : []);

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800/80 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm group"
        >
            {/* Image Gallery */}
            <div className="relative w-full h-56 bg-gray-100 dark:bg-gray-900 group overflow-hidden">
                <div className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbars h-full">
                    {attachments.map((url: string, idx: number) => (
                        <div key={idx} className="flex-none w-full h-full snap-center relative">
                            <img
                                src={url}
                                alt={`Activity ${idx + 1}`}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {/* Overlay for multiple images indicator */}
                            {attachments.length > 1 && (
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full">
                                    {attachments.map((_: any, iIdx: number) => (
                                        <div 
                                            key={iIdx} 
                                            className={cn(
                                                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                                idx === iIdx ? "bg-white w-3" : "bg-white/40"
                                            )} 
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Status Badge */}
                <div className={cn(
                    'absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md shadow-sm', 
                    status.color
                )}>
                    {status.icon}
                    <span>{t(status.translationKey || status.label.toLowerCase(), status.label) as string}</span>
                </div>
                
                {/* Image Count Indicator */}
                {attachments.length > 1 && (
                    <div className="absolute top-4 left-4 flex gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl text-[9px] font-black text-white uppercase tracking-wider">
                        {attachments.length} {t('photos', 'Photos') as string}
                    </div>
                )}
            </div>

            {/* Content Details */}
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1.5 flex flex-col">
                        {activity.activity_type && (
                            <div className="text-[10px] font-black text-primary uppercase tracking-wider px-1">
                                {t(activity.activity_type.toLowerCase().replace(/ \/ /g, '_').replace(/ /g, '_'), activity.activity_type) as string}
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-900/40 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800/50 w-fit">
                            <IconCalendarEvent className="w-3.5 h-3.5" />
                            <span>{new Date(activity.submitted_at).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            <span className="opacity-30">|</span>
                            <span>{new Date(activity.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>

                {activity.comment && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed mb-4">
                        {activity.comment}
                    </p>
                )}

                {(activity.latitude || activity.location_name) && (
                    <div className="flex items-start gap-2 text-xs text-gray-500 font-semibold bg-primary/5 p-3 rounded-2xl border border-primary/10">
                        <IconMapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="leading-snug truncate">
                            {activity.location_name ?? `${parseFloat(activity.latitude).toFixed(5)}, ${parseFloat(activity.longitude).toFixed(5)}`}
                        </span>
                    </div>
                )}

                {activity.admin_note && (
                    <div className="mt-5 p-4 bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl border border-rose-100/50 dark:border-rose-900/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full -mr-8 -mt-8" />
                        <p className="text-[9px] font-black text-rose-500 uppercase tracking-wider mb-2 leading-none">{t('supervisor_remark', 'Supervisor Remark') as string}</p>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-normal">{activity.admin_note}</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
