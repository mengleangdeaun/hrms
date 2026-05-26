import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    IconCheck, 
    IconX, 
    IconSquareRoundedArrowRightFilled,
    IconCalendar
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface DayOffApprovalCardProps {
    request: any;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
}

export function DayOffApprovalCard({ request, onApprove, onReject }: DayOffApprovalCardProps) {
    const { t, i18n } = useTranslation('pwa');

    const currentLang = i18n.language?.startsWith('kh') || i18n.language?.startsWith('km') ? 'km' : 
                        i18n.language?.startsWith('zh') ? 'zh-cn' : 'en';

    useEffect(() => {
        dayjs.locale(currentLang);
    }, [currentLang]);

    const emp = request.employee;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 relative overflow-hidden group active:scale-[0.98] transition-all shadow-sm"
        >
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar className="w-12 h-12 rounded-2xl border border-gray-50 dark:border-gray-800">
                        <AvatarImage src={emp?.profile_image_url} className="object-cover" />
                        <AvatarFallback className="rounded-2xl bg-primary/5 text-primary/40 font-black text-xl">
                            {emp?.full_name?.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-black text-gray-900 dark:text-white text-base leading-tight truncate">
                            {emp?.full_name}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-2">
                            ID: {emp?.employee_id}
                        </p>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <div className="flex flex-col items-end">
                        <span className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tight tabular-nums">
                            {dayjs(request.created_at).locale(currentLang).format('DD MMM, YYYY')}
                        </span>
                        <span className="text-[9px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-[0.2em] mt-0.5">
                            {dayjs(request.created_at).locale(currentLang).format('hh:mm A')}   
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800/50 overflow-hidden mb-4">
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-[0.1em] text-gray-400 block px-0.5">
                                {t('current', 'Current')}
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {(request.current_days_off || []).length > 0 ? (
                                    (request.current_days_off || []).map((d: string) => (
                                        <span key={d} className="px-2.5 py-1 bg-white dark:bg-gray-800 rounded-lg text-[10px] font-bold text-gray-500 border border-gray-200 dark:border-gray-700 shadow-sm">
                                            {t(d.toLowerCase())}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-[10px] text-gray-400 italic px-1 lowercase">
                                        {t('no_day_off', 'No day off')}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/5 text-primary/40">
                            <IconSquareRoundedArrowRightFilled size={20} />
                        </div>

                        <div className="flex-1 space-y-1.5 text-right">
                            <label className="text-[9px] font-black uppercase tracking-[0.1em] text-primary/60 block px-0.5">
                                {t('requested', 'Requested')}
                            </label>
                            <div className="flex flex-wrap gap-1.5 justify-end">
                                {request.frequency === 'specific_dates' ? (
                                    (request.specific_dates || []).map((d: string) => (
                                        <span key={d} className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-black border border-amber-500/20 shadow-sm shadow-amber-500/20 tabular-nums">
                                            {dayjs(d).locale(currentLang).format('D MMM')}
                                        </span>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-end gap-1.5">
                                        <div className="flex flex-wrap gap-1.5 justify-end">
                                            {(request.requested_days_off || []).map((d: string) => (
                                                <span key={d} className="px-2.5 py-1 bg-primary text-white rounded-lg text-[10px] font-black border border-primary/20 shadow-sm shadow-primary/20">
                                                    {t(d.toLowerCase())}
                                                </span>
                                            ))}
                                        </div>
                                        {request.frequency === 'monthly' && (
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[8px] font-black text-violet-400 uppercase tracking-widest">{t('weeks', 'Weeks')}</span>
                                                <div className="flex flex-wrap gap-1 justify-end">
                                                    {request.weeks_of_month?.map((w: number) => (
                                                        <span key={w} className="px-2 py-0.5 bg-violet-500 text-white rounded-md text-[9px] font-black border border-violet-500/20 shadow-sm shadow-violet-500/20">
                                                            {w === 5 ? t('last') : w}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <IconCalendar size={14} className='text-gray-300' />
                            <span className="text-[10px] font-semibold tracking-wide mb-0 text-gray-400">
                                {t('effective_period', 'Effective Period')}
                            </span>
                        </div>
                        <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 tabular-nums">
                            {dayjs(request.effective_from).locale(currentLang).format('MMM D')}
                            {request.effective_to ? <span className="mx-1.5 text-gray-300">→</span> : <span className="mx-1.5 text-gray-300">|</span>}
                            {request.effective_to ? dayjs(request.effective_to).locale(currentLang).format('MMM D, YYYY') : t('ongoing', 'Ongoing')}
                        </span>
                    </div>
                </div>
            </div>

            {request.reason && (
                <div className="relative pl-4 border-l-2 border-gray-100 dark:border-gray-800 mb-5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">{t('reason_label', 'Reason')}</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic font-medium line-clamp-3">
                        "{request.reason}"
                    </p>
                </div>
            )}

            <div className="flex gap-3">
                <button 
                    onClick={() => onApprove(request.id)}
                    className="flex-1 h-12 bg-primary text-white rounded-full text-xs font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <IconCheck size={16} />
                    {t('approve', 'Approve')}
                </button>
                <button 
                    onClick={() => onReject(request.id)}
                    className="flex-1 h-12 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 rounded-full text-xs font-black uppercase tracking-wider border border-rose-100/50 dark:border-rose-900/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <IconX size={16} />
                    {t('reject', 'Reject')}
                </button>
            </div>
        </motion.div>
    );
}
