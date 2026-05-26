import React from 'react';
import { IconClock, IconCheck, IconX, IconAlertCircle, IconPhoto } from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/km';
import 'dayjs/locale/zh-cn';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface LeaveRequestCardProps {
    request: any;
    onCancel: (id: number) => void;
    onPreviewImage: (images: string[], index: number) => void;
}

const getStatusConfig = (status: string, t: any) => {
    switch (status) {
        case 'pending': return { icon: <IconClock className="w-4 h-4" />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30', label: t('status_pending', 'Pending') };
        case 'approved': return { icon: <IconCheck className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30', label: t('status_approved', 'Approved') };
        case 'rejected': return { icon: <IconX className="w-4 h-4" />, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30', label: t('status_rejected', 'Rejected') };
        case 'cancelled': return { icon: <IconAlertCircle className="w-4 h-4" />, color: 'text-slate-500 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700', label: t('status_cancelled', 'Cancelled') };
        default: return { icon: <IconClock className="w-4 h-4" />, color: 'text-gray-500 bg-gray-50', label: status };
    }
};

const getDurationLabel = (type: string, days: number, t: any) => {
    const typeLabels: any = {
        'full_day': t('duration_full_day', 'Full Day'),
        'first_half': t('morning', 'Morning'),
        'second_half': t('afternoon', 'Afternoon'),
        'multi_day': t('multi_day', 'Multi-day'),
        'custom_time': t('hourly', 'Hourly')
    };
    const formattedDays = Number(days).toFixed(2);
    return `${typeLabels[type] || type} (${formattedDays} ${t('days', 'days')})`;
};

export const LeaveRequestCard: React.FC<LeaveRequestCardProps> = ({ request, onCancel, onPreviewImage }) => {
    const { t, i18n } = useTranslation('pwa');
    
    // Set dayjs locale based on current language
    const dayjsLocale = i18n.language === 'kh' ? 'km' : (i18n.language === 'zh' ? 'zh-cn' : 'en');
    const status = getStatusConfig(request.status, t);
    const isMulti = request.start_date !== request.end_date;
    const isCustomTime = request.duration_type === 'custom_time' && request.start_time;

    return (
        <div 
            className="bg-white dark:bg-gray-800/80 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 relative overflow-hidden group active:scale-[0.98] transition-all shadow-sm"
        >
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 mr-4">
                        <div 
                            className="inline-flex items-center px-3 py-1 rounded-lg mb-2 border  transition-all"
                            style={{ 
                                backgroundColor: `${request.leave_type?.color || '#3b82f6'}15`, 
                                borderColor: `${request.leave_type?.color || '#3b82f6'}30`,
                                color: request.leave_type?.color || '#3b82f6'
                            }}
                        >
                            <h4 className="font-black text-[11px] uppercase tracking-wider">
                                {request.leave_type?.name || t('leave_request', 'Leave Request')}
                            </h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                {getDurationLabel(request.duration_type, request.total_days, t)}
                            </span>
                        </div>
                    </div>
                    <div className={cn("px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border shadow-sm shrink-0", status.color)}>
                        {status.icon}
                        {status.label}
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-4 border border-gray-100 dark:border-gray-800/50">
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-800 dark:text-gray-200">
                        {isMulti ? (
                            <div className="flex w-full items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wide mb-1">{t('from', 'From')}</span>
                                    <span className="text-xs">{dayjs(request.start_date).locale(dayjsLocale).format('MMM D, YYYY')}</span>
                                </div>
                                <div className="flex-1 max-w-[40px] border-t-2 border-dashed border-gray-200 dark:border-gray-700 mx-2" />
                                <div className="flex flex-col text-right">
                                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wide mb-1">{t('to', 'To')}</span>
                                    <span className="text-xs">{dayjs(request.end_date).locale(dayjsLocale).format('MMM D, YYYY')}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wide mb-1">{t('date', 'Date')}</span>
                                    <span className="text-xs font-black">{dayjs(request.start_date).locale(dayjsLocale).format('MMM D, YYYY')}</span>
                                </div>
                                {isCustomTime && (
                                    <div className="flex flex-col text-right">
                                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-wide mb-1">{t('time_range', 'Time Range')}</span>
                                        <span className="text-xs">{dayjs(`2000-01-01 ${request.start_time}`).format('h:mm A')} - {dayjs(`2000-01-01 ${request.end_time}`).format('h:mm A')}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    {request.reason && (
                        <div className="relative pl-4 border-l-2 border-gray-100 dark:border-gray-800">
                             <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">{t('reason_label', 'Reason')}</span>
                             <p className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed italic">
                                 "{request.reason}"
                             </p>
                        </div>
                    )}

                    {request.attachments && request.attachments.length > 0 && (
                        <div className="mt-4 mb-2">
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <IconPhoto className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('attachments', 'Attachments')}</span>
                            </div>
                            <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x hide-scrollbars">
                                {request.attachments.map((url: string, idx: number) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => onPreviewImage(request.attachments, idx)}
                                        className="snap-start shrink-0 w-20 h-20 rounded-2xl border-2 border-white dark:border-gray-800 shadow-sm bg-gray-100 dark:bg-gray-900 overflow-hidden active:scale-95 transition-all"
                                    >
                                        <img src={url} className="w-full h-full object-cover" alt="Evidence" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {request.status === 'rejected' && request.rejection_reason && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20">
                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">{t('rejection_note', 'Rejection Note')}</p>
                            <p className="text-xs text-rose-700 dark:text-rose-400 font-medium leading-relaxed">
                                {request.rejection_reason}
                            </p>
                        </div>
                    )}

                    {request.actioned_at && (
                        <div className="flex items-center gap-2 mt-1 px-1 opacity-60">
                             <IconClock className="w-3.5 h-3.5 text-gray-400" />
                             <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                                 {request.status === 'approved' ? t('approved_at', 'Approved At') : t('rejected_at', 'Rejected At')}: {dayjs(request.actioned_at).locale(dayjsLocale).format('MMM D, YYYY h:mm A')}
                             </span>
                        </div>
                    )}
                </div>

                {request.status === 'pending' && (
                    <div className="mt-5 pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-end">
                        <button
                            onClick={() => onCancel(request.id)}
                            className="text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-900/10 px-4 py-2 rounded-xl active:scale-95 transition-all"
                        >
                            {t('cancel_request', 'Cancel Request')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
