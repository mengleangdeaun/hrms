import React from 'react';
import { IconPhoto, IconCheck, IconX, IconCalendar } from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/km';
import 'dayjs/locale/zh-cn';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ApprovalCardProps {
    request: any;
    index?: number;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
    onPreviewImage: (images: string[], index: number) => void;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({ request, index, onApprove, onReject, onPreviewImage }) => {
    const { t, i18n } = useTranslation('pwa');
    
    // Set dayjs locale based on current language
    const dayjsLocale = i18n.language === 'kh' ? 'km' : (i18n.language === 'zh' ? 'zh-cn' : 'en');

    const getDurationLabel = (type: string, days: number) => {
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

    const formatDate = (date: string) => {
        return dayjs(date).locale(dayjsLocale).format('MMM D');
    };
    return (
        <div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 relative overflow-hidden group active:scale-[0.98] transition-all shadow-sm"
        >
            <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Avatar className="w-12 h-12 rounded-2xl border border-gray-50 dark:border-gray-800">
                            <AvatarImage src={request.employee?.profile_image_url} className="object-cover" />
                            <AvatarFallback className="rounded-2xl bg-gray-100 dark:bg-gray-700/50 text-primary/40 font-black text-xl">
                                {request.employee?.full_name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-black text-gray-900 dark:text-white text-base leading-tight truncate">
                                {request.employee?.full_name}
                            </h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-2">
                                <span className="bg-primary/5 text-primary/60 px-2 py-0.5 rounded-lg border border-primary/10">ID: {request.employee?.employee_id}</span>
                            </p>
                        </div>
                    </div>
                    <div 
                        className="inline-flex items-center px-3 py-1 rounded-lg border transition-all shrink-0 mt-1"
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
                </div>

                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-0.5">
                            {getDurationLabel(request.duration_type, request.total_days)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                            {formatDate(request.start_date)}
                            {request.start_date !== request.end_date && <span className="text-gray-300 dark:text-gray-600 mx-1">→</span>}
                            {request.start_date !== request.end_date && formatDate(request.end_date)}
                        </p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{dayjs(request.start_date).locale(dayjsLocale).format('YYYY')}</p>
                    </div>
                </div>

                <div className="relative pl-4 border-l-2 border-gray-100 dark:border-gray-800 mb-5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">{t('reason_label', 'Reason')}</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic font-medium">
                        "{request.reason}"
                    </p>
                </div>

                {request.attachments && request.attachments.length > 0 && (
                    <div className="mb-5">
                        <div className="flex items-center gap-2 mb-2 px-1">
                            <IconPhoto className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('supporting_evidence', 'Supporting Evidence')}</span>
                        </div>
                        <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x hide-scrollbars">
                            {request.attachments.map((url: string, idx: number) => (
                                <div 
                                    key={idx} 
                                    onClick={() => onPreviewImage(request.attachments, idx)}
                                    className="snap-start shrink-0 w-24 h-24 rounded-2xl border-2 border-white dark:border-gray-800 shadow-sm bg-gray-100 dark:bg-gray-900 overflow-hidden active:scale-95 transition-all"
                                >
                                    <img src={url} className="w-full h-full object-cover" alt="Evidence" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={() => onApprove(request.id)}
                        className="flex-1 h-12 bg-primary text-white rounded-full text-xs font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <IconCheck className="w-4 h-4" />
                        {t('approve', 'Approve')}
                    </button>
                    <button
                        onClick={() => onReject(request.id)}
                        className="flex-1 h-12 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 rounded-full text-xs font-black uppercase tracking-wider border border-rose-100/50 dark:border-rose-900/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <IconX className="w-4 h-4" />
                        {t('reject', 'Reject')}
                    </button>
                </div>
            </div>
        </div>
    );
};
