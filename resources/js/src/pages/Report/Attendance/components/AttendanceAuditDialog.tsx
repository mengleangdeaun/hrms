import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { useAttendanceTimeline } from '@/hooks/useHRData';
import { IconAlertTriangle, IconBeach, IconAlarmSnooze, IconCalendarCheck, IconRefresh, IconLoader2, IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import dayjs from 'dayjs';
import { cn } from "@/lib/utils";
import PerfectScrollbar from 'react-perfect-scrollbar';

interface AttendanceAuditDialogProps {
    employee: any;
    dateRange: { start_date: string; end_date: string };
    onClose: () => void;
}

const AttendanceAuditDialog: React.FC<AttendanceAuditDialogProps> = ({ employee, dateRange, onClose }) => {
    const { t } = useTranslation('report');
    
    const { data: timelineResponse, isLoading } = useAttendanceTimeline(employee.ulid, {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
    });

    const timelineData = timelineResponse?.timeline || [];

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl gap-0 p-0 max-h-[90vh] flex flex-col h-auto overflow-hidden bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 rounded-3xl [&>button]:hidden">
                <DialogHeader className="p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-600">
                                <IconCalendarCheck size={24} />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-slate-800 dark:text-white leading-tight">
                                    {t('daily_audit_logs')}
                                </DialogTitle>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                                    {employee.full_name} • {t('audit_logs_desc')}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                            <IconX size={20} />
                        </Button>
                    </div>
                </DialogHeader>

                <PerfectScrollbar options={{ suppressScrollX: true }} className="p-6 flex-1 min-h-0 bg-slate-50 dark:bg-black/20">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <IconLoader2 size={40} className="animate-spin text-primary opacity-20" />
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('analyzing_performance')}</span>
                        </div>
                    ) : (
                        <>
                            {/* Analytics Summary Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('expected_days', 'Expected')}</div>
                                    <div className="text-xl font-black text-slate-800 dark:text-white">{timelineResponse?.analytics?.expected_working_days || 0}</div>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('present_days', 'Present')}</div>
                                    <div className="text-xl font-black text-emerald-500">{timelineData.filter((d: any) => d.type === 'present').length}</div>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('absent_days', 'Absent')}</div>
                                    <div className="text-xl font-black text-rose-500">{(timelineResponse?.analytics?.expected_working_days || 0) - timelineData.filter((d: any) => d.type === 'present').length}</div>
                                </div>
                                <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none">
                                    <div className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1">{t('total_work_time', 'Total Time')}</div>
                                    <div className="text-xl font-black text-white">{timelineResponse?.analytics?.formatted_total_work_hours || '0h 00m'}</div>
                                </div>
                            </div>

                            <div className="bg-white overflow-hidden dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 shadow-sm">
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{t('date')}</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-center">{t('expected')}</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{t('status')}</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{t('working_hours')}</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right">{t('mode')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {timelineData.map((day: any) => (
                                        <tr key={day.date} className={cn(
                                            "group transition-colors",
                                            day.type === 'absent' ? "bg-rose-50/30 dark:bg-rose-950/5" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                                        )}>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">{dayjs(day.date).format('DD MMM')}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{dayjs(day.date).format('dddd')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {day.is_expected ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">{t('expected')}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1 opacity-20">
                                                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">—</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {day.type === 'present' && <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">{t('status_present')}</span>}
                                                    {day.type === 'absent' && <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><IconAlertTriangle size={12} />{t('status_absent')}</span>}
                                                    {day.type === 'holiday' && <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><IconBeach size={12} />{day.holiday || t('status_holiday')}</span>}
                                                    {day.type === 'leave' && <span className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><IconAlarmSnooze size={12} />{day.leave || t('status_leave')}</span>}
                                                    {day.type === 'off' && <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest">{t('status_off')}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                                                {day.record ? (
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                            {day.record.clock_in}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                                            {day.record.clock_out}
                                                        </div>
                                                        <span className="text-[10px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded ml-2">
                                                            {day.record.formatted_duration || '0h 0m'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-700 italic">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {day.is_expected && (
                                                    <div className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-400 group-hover:text-primary transition-colors" title={day.context_source === 'snapshot' ? 'Historical Snapshot' : 'Policy Estimate'}>
                                                        {day.context_source === 'snapshot' ? <IconCalendarCheck size={14} /> : <IconRefresh size={14} />}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </PerfectScrollbar>

            </DialogContent>
        </Dialog>
    );
};

export default AttendanceAuditDialog;
