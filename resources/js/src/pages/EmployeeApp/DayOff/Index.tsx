import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
    IconCalendarOff, 
    IconPlus, 
    IconClock, 
    IconCheck, 
    IconX, 
    IconLoader2,
    IconCalendar,
    IconNotes,
    IconSend,
    IconCalendarCheck,
    IconSquareRoundedArrowRightFilled,
    IconTrash
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/km';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/ui/pwa/PageHeader';
import { PwaDatePicker } from '@/components/ui/pwa/pwa-date-picker';
import { PwaActionButton } from '@/components/ui/pwa/PwaActionButton';
import { PwaEmptyState } from '@/components/ui/pwa/pwa-empty-state';
import { Textarea } from '@/components/ui/textarea';
import { playSuccessSound } from '@/lib/audio';
import { pwaToast } from '@/utils/pwaToast';
import { cn } from '@/lib/utils';
import { useEmployeeDayOffData } from '@/hooks/useEmployeeAppData';

// Sub-components
import { DayOffApprovalCard } from './components/DayOffApprovalCard';
import { DayOffActionBottomSheet } from './components/DayOffActionBottomSheet';

const ALL_DAYS = ['mon','tue','wed','thu','fri','sat','sun'];
const FULL_DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

export default function EmployeeDayOff() {
    const { t, i18n } = useTranslation('pwa');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Determine dayjs locale based on i18n language
    const currentLang = i18n.language?.startsWith('kh') || i18n.language?.startsWith('km') ? 'km' : 
                        i18n.language?.startsWith('zh') ? 'zh-cn' : 'en';

    useEffect(() => {
        dayjs.locale(currentLang);
    }, [currentLang]);
    
    const { 
        dayOffInfo, 
        dayOffRequests, 
        teamDayOffRequests,
        submitRequest, 
        approveTeamRequest, 
        rejectTeamRequest, 
        cancelRequest 
    } = useEmployeeDayOffData();

    // Pull to Refresh Implementation
    useEffect(() => {
        const handleRefresh = () => {
            dayOffInfo.refetch();
            dayOffRequests.refetch();
            teamDayOffRequests.refetch();
        };
        window.addEventListener('pwa-refresh', handleRefresh);
        return () => window.removeEventListener('pwa-refresh', handleRefresh);
    }, [dayOffInfo, dayOffRequests, teamDayOffRequests]);
    
    const info = dayOffInfo.data;
    const requests = Array.isArray(dayOffRequests.data) ? dayOffRequests.data : [];
    const teamRequests = Array.isArray(teamDayOffRequests.data) ? teamDayOffRequests.data : [];
    const loading = dayOffInfo.isLoading;
    
    // UI State
    const [activeTab, setActiveTab] = useState<'my' | 'approvals'>((searchParams.get('tab') as any) || 'my');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ 
        requested_days_off: [] as string[], 
        frequency: 'weekly',
        weeks_of_month: [] as number[],
        specific_dates: [] as string[],
        effective_from: dayjs().format('YYYY-MM-DD'), 
        effective_to: '', 
        reason: '' 
    });
    const [error, setError] = useState('');

    // Action State
    const [actionId, setActionId] = useState<number | null>(null);
    const [actionMode, setActionMode] = useState<'approve' | 'reject' | 'cancel' | null>(null);

    const toggleDay = (day: string) => {
        const dayKey = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
        setForm(p => ({
            ...p,
            requested_days_off: p.requested_days_off.includes(dayKey) 
                ? p.requested_days_off.filter(d => d !== dayKey) 
                : [...p.requested_days_off, dayKey]
        }));
    };

    const toggleWeek = (week: number) => {
        setForm(p => ({
            ...p,
            weeks_of_month: p.weeks_of_month.includes(week) ? p.weeks_of_month.filter(w => w !== week) : [...p.weeks_of_month, week]
        }));
    };

    const addSpecificDate = (date: string) => {
        if (!form.specific_dates.includes(date)) {
            setForm(p => ({ ...p, specific_dates: [...p.specific_dates, date].sort() }));
        }
    };

    const removeSpecificDate = (date: string) => {
        setForm(p => ({ ...p, specific_dates: p.specific_dates.filter(d => d !== date) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.frequency !== 'specific_dates' && form.requested_days_off.length === 0) { setError(t('select_at_least_one_day', 'Please select at least one day')); return; }
        if (form.frequency === 'monthly' && form.weeks_of_month.length === 0) { setError(t('select_at_least_one_week', 'Please select at least one week')); return; }
        if (form.frequency === 'specific_dates' && form.specific_dates.length === 0) { setError(t('select_at_least_one_date', 'Please select at least one date')); return; }
        if (!form.reason.trim()) { setError(t('provide_reason', 'Please provide a reason')); return; }
        setError('');
        
        submitRequest.mutate(form, {
            onSuccess: () => {
                playSuccessSound();
                pwaToast.success(t('request_submitted_successfully', 'Request submitted successfully'));
                setShowForm(false);
                setForm({ 
                    requested_days_off: [], 
                    frequency: 'weekly',
                    weeks_of_month: [],
                    specific_dates: [],
                    effective_from: dayjs().format('YYYY-MM-DD'), 
                    effective_to: '', 
                    reason: '' 
                });
            },
            onError: (err: any) => {
                const msg = err.response?.data?.message || t('failed_to_submit', 'Failed to submit');
                setError(msg);
                pwaToast.error(msg);
            }
        });
    };

    const handleAction = async (reason?: string) => {
        if (!actionId || !actionMode) return;
        
        if (actionMode === 'approve') {
            approveTeamRequest.mutate(actionId, {
                onSuccess: () => {
                    pwaToast.success(t('request_approved', 'Request approved successfully'));
                    closeAction();
                }
            });
        } else if (actionMode === 'reject') {
            rejectTeamRequest.mutate({ id: actionId, reason: reason || '' }, {
                onSuccess: () => {
                    pwaToast.success(t('request_rejected', 'Request rejected successfully'));
                    closeAction();
                }
            });
        } else if (actionMode === 'cancel') {
            cancelRequest.mutate(actionId, {
                onSuccess: () => {
                    pwaToast.success(t('request_cancelled', 'Request cancelled'));
                    closeAction();
                }
            });
        }
    };

    const closeAction = () => {
        setActionId(null);
        setActionMode(null);
    };

    const getStatusStyles = (s: string) => {
        if (s === 'approved') return { icon: <IconCheck size={14} />, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
        if (s === 'rejected') return { icon: <IconX size={14} />, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
        return { icon: <IconClock size={14} />, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    };

    if (loading && !info) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-[#060818] pb-32">
            <PageHeader 
                title={t('day_off', 'Day Off')}
                icon={<IconCalendarCheck className="w-5 h-5 text-primary" />}
                rightAction={
                    !showForm && activeTab === 'my' && (
                        <PwaActionButton
                            icon={<IconPlus />}
                            variant="soft"
                            onClick={() => { 
                                setShowForm(true); 
                                setForm({ 
                                    requested_days_off: [], 
                                    frequency: 'weekly',
                                    weeks_of_month: [],
                                    specific_dates: [],
                                    effective_from: dayjs().format('YYYY-MM-DD'), 
                                    effective_to: '', 
                                    reason: '' 
                                }); 
                            }}
                        />
                    )
                }
            />

            {/* Sticky Tabs */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 sticky top-[56px] z-30">
                <div className="flex px-4">
                    <button
                        onClick={() => { setActiveTab('my'); setShowForm(false); }}
                        className={cn(
                            "relative px-6 py-4 text-[12px] font-black uppercase tracking-wider transition-all duration-300",
                            activeTab === 'my' ? "text-primary" : "text-gray-400"
                        )}
                    >
                        <span className="relative z-10">{t('tab_my_requests', 'My Requests')}</span>
                        {activeTab === 'my' && (
                            <motion.div layoutId="dayOffTab" className="absolute bottom-0 left-4 right-4 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary-rgb),0.2)]" />
                        )}
                    </button>
                    
                    {teamRequests.length > 0 && (
                        <button
                            onClick={() => { setActiveTab('approvals'); setShowForm(false); }}
                            className={cn(
                                "relative px-6 py-4 text-[12px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2",
                                activeTab === 'approvals' ? "text-primary" : "text-gray-400"
                            )}
                        >
                            <span className="relative z-10">{t('tab_approvals', 'Approvals')}</span>
                            <span className={cn(
                                "relative z-10 px-2 min-w-[20px] h-5 flex items-center justify-center text-[10px] rounded-full font-black shadow-sm",
                                activeTab === 'approvals' ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                            )}>
                                {teamRequests.length}
                            </span>
                            {activeTab === 'approvals' && (
                                <motion.div layoutId="dayOffTab" className="absolute bottom-0 left-4 right-4 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary-rgb),0.2)]" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="px-5 pt-6 space-y-8">
                {activeTab === 'my' ? (
                    <>
                        {/* Current Schedule Card */}
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow shadow-black/5 border border-gray-100 dark:border-gray-800 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <IconCalendar size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('current_schedule', 'Current Schedule')}</h2>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{info?.working_shift?.name || t('standard_shift', 'Standard Shift')}</p>
                                    </div>
                                </div>
                            </div>

                            {info?.day_off_frequency === 'specific_dates' ? (
                                <div className="flex flex-wrap gap-2">
                                    {info.day_off_specific_dates?.map((d: string) => (
                                        <div key={d} className="px-3 py-2 bg-primary/10 rounded-xl text-[10px] font-black text-primary border border-primary/20">
                                            {dayjs(d).locale(currentLang).format('DD MMM, YYYY')}
                                        </div>
                                    ))}
                                    {(!info.day_off_specific_dates || info.day_off_specific_dates.length === 0) && (
                                        <p className="text-xs text-gray-400 italic">{t('no_specific_dates', 'No dates defined')}</p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-7 gap-1.5">
                                        {ALL_DAYS.map((d, i) => {
                                            const dayName = FULL_DAYS[i].charAt(0).toUpperCase() + FULL_DAYS[i].slice(1).toLowerCase();
                                            const isOff = (info?.resolved_days_off || []).some((d: string) => d.toLowerCase() === FULL_DAYS[i]);
                                            return (
                                                <div key={d} className="space-y-2">
                                                    <div className={cn(
                                                        "py-3 rounded-2xl text-center transition-all duration-300 border",
                                                        isOff 
                                                            ? "bg-primary text-white border-primary" 
                                                            : "bg-gray-50 dark:bg-gray-800/50 text-gray-400 border-gray-100 dark:border-gray-800"
                                                    )}>
                                                        <span className="text-[11px] font-black uppercase">{t(d).slice(0, 9)}</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className={cn(
                                                            "text-[8px] font-black uppercase tracking-tighter",
                                                            isOff ? "text-primary" : "text-gray-300 dark:text-gray-600"
                                                        )}>
                                                            {isOff ? t('off', 'Off') : t('work', 'Work')}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {info?.day_off_frequency === 'monthly' && (
                                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800/50">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                {t('occurs_on_weeks', 'Occurs on')}: <span className="text-primary">{info.day_off_weeks?.map((w:number) => w === 5 ? t('last', 'Last') : `${w}${w===1?'st':w===2?'nd':w===3?'rd':'th'}`).join(', ')}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Request Form */}
                        <AnimatePresence>
                            {showForm && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0, y: -20 }}
                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                    exit={{ opacity: 0, height: 0, y: -20 }}
                                    className="overflow-hidden rounded-3xl shadow shadow-black/5 border border-gray-100 dark:border-gray-800 "
                                >
                                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <IconCalendarCheck size={20} />
                                            </div>
                                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('request_change', 'Request Change')}</h3>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            {/* Frequency Toggle */}
                                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
                                                {['weekly', 'monthly', 'specific_dates'].map(f => (
                                                    <button 
                                                        key={f} type="button" 
                                                        onClick={() => setForm(p => ({...p, frequency: f}))}
                                                        className={cn(
                                                            "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                                            form.frequency === f ? "bg-white dark:bg-gray-700 text-primary shadow-sm" : "text-gray-400"
                                                        )}
                                                    >
                                                        {t(f)}
                                                    </button>
                                                ))}
                                            </div>

                                            {form.frequency !== 'specific_dates' && (
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-wide text-gray-400 px-1">{t('new_days_off', 'New Day(s) Off')}</label>
                                                    <div className="grid grid-cols-7 gap-1.5">
                                                        {FULL_DAYS.map((day, i) => {
                                                            const dayKey = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
                                                            return (
                                                                <button 
                                                                    key={day} 
                                                                    type="button" 
                                                                    onClick={() => toggleDay(day)}
                                                                    className={cn(
                                                                        "py-3 rounded-2xl text-[11px] font-black transition-all border",
                                                                        form.requested_days_off.includes(dayKey) 
                                                                            ? "bg-primary text-white border-primary " 
                                                                            : "bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-100 dark:border-gray-800"
                                                                    )}
                                                                >
                                                                    {t(ALL_DAYS[i]).slice(0, 9)}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {form.frequency === 'monthly' && (
                                                <div className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/10 space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-violet-400">{t('on_weeks', 'On Weeks')}</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {[1,2,3,4,5].map(w => (
                                                            <button 
                                                                key={w} type="button"
                                                                onClick={() => toggleWeek(w)}
                                                                className={cn(
                                                                    "px-3 py-2 rounded-xl text-[10px] font-black border transition-all",
                                                                    form.weeks_of_month.includes(w) ? "bg-violet-500 text-white border-violet-500" : "bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-800"
                                                                )}
                                                            >
                                                                {w === 5 ? t('last') : `${w}${w===1?'st':w===2?'nd':w===3?'rd':'th'}`}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {form.frequency === 'specific_dates' && (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-wide text-gray-400 px-1">{t('add_dates', 'Add Dates')}</label>
                                                        <PwaDatePicker 
                                                            value="" 
                                                            onChange={addSpecificDate} 
                                                            placeholder={t('tap_to_add_date', 'Tap to add a date')}
                                                        />
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 min-h-[40px]">
                                                        {form.specific_dates.map(d => (
                                                            <div key={d} className="px-3 py-2 bg-amber-500/10 rounded-xl text-[10px] font-black text-amber-500 border border-amber-500/20 flex items-center gap-2">
                                                                {dayjs(d).format('DD MMM, YYYY')}
                                                                <button type="button" onClick={() => removeSpecificDate(d)}><IconTrash size={12} /></button>
                                                            </div>
                                                        ))}
                                                        {form.specific_dates.length === 0 && <p className="text-[10px] text-gray-400 italic px-1">{t('no_dates_added', 'No dates added yet')}</p>}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">{t('effective_from', 'From')}</label>
                                                    <PwaDatePicker 
                                                        value={form.effective_from} 
                                                        onChange={val => setForm(p => ({...p, effective_from: val}))} 
                                                        placeholder={t('select_date', 'Select Date')}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">{t('effective_to', 'To')} <span className="text-[8px] opacity-50 italic">({t('optional', 'Opt')})</span></label>
                                                    <PwaDatePicker 
                                                        value={form.effective_to} 
                                                        onChange={val => setForm(p => ({...p, effective_to: val}))} 
                                                        placeholder={t('no_end_date', 'Ongoing')}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 flex items-center gap-1.5">
                                                    <IconNotes size={12} />
                                                    {t('reason', 'Reason')}
                                                </label>
                                                <Textarea 
                                                    value={form.reason} 
                                                    onChange={e => setForm(p => ({...p, reason: e.target.value}))} 
                                                    placeholder={t('day_off_reason_placeholder', 'Why do you need this change?')}
                                                    className="min-h-[100px] rounded-xl bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 focus:ring-primary/20"
                                                    required 
                                                />
                                            </div>

                                            {error && (
                                                <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-bold text-rose-500 px-1">{error}</motion.p>
                                            )}

                                            <div className="flex gap-3 pt-2">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowForm(false)} 
                                                    className="flex-1 h-14 rounded-2xl border border-gray-100 dark:border-gray-800 text-[11px] font-black uppercase tracking-wide text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                                                >
                                                    {t('cancel', 'Cancel')}
                                                </button>
                                                <button 
                                                    type="submit" 
                                                    disabled={submitRequest.isPending} 
                                                    className="flex-[2] h-14 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-wide disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition-all"
                                                >
                                                    {submitRequest.isPending ? <IconLoader2 className="w-5 h-5 animate-spin" /> : <>{t('submit_request', 'Submit Request')} <IconSend size={16} /></>}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Request History */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('request_history', 'Request History')}</h3>
                                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">{requests.length} {t('entries', 'Entries')}</span>
                            </div>

                            <div className="space-y-3">
                                {dayOffRequests.isLoading ? (
                                    [1, 2].map(i => (
                                        <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-3xl border border-gray-100 dark:border-gray-800" />
                                    ))
                                ) : requests.length === 0 ? (
                                    <PwaEmptyState 
                                        illustration="notification" 
                                        title={t('no_history_yet', 'No history yet')} 
                                        description={t('no_pending_requests_desc', 'Any requests you submit will appear here until they are reviewed.')} 
                                    />
                                ) : (
                                    requests.map((req: any, idx: number) => {
                                        const styles = getStatusStyles(req.status);
                                        return (
                                            <motion.div 
                                                key={req.id} 
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                                className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 group"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border", styles.color)}>
                                                        {styles.icon} {t(`status_${req.status}`, req.status) as string}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tight tabular-nums">
                                                            {dayjs(req.created_at).locale(currentLang).format('DD MMM, YYYY')}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-[0.2em] mt-0.5">
                                                            {dayjs(req.created_at).locale(currentLang).format('HH:mm')}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {req.actioned_at && (
                                                    <div className="mb-4 flex items-center justify-between px-3 py-2 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('processed_on', 'Processed On')}</span>
                                                        <span className="text-[10px] font-bold text-gray-500 tabular-nums">
                                                            {dayjs(req.actioned_at).locale(currentLang).format('DD MMM, YYYY')} • {dayjs(req.actioned_at).locale(currentLang).format('HH:mm')}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="flex -space-x-1">
                                                        {req.frequency === 'specific_dates' ? (
                                                            <div className="px-2 py-1 bg-amber-500/10 rounded-lg text-[9px] font-black text-amber-500 border border-amber-500/20">{t('specific_dates')}</div>
                                                        ) : (
                                                            <>
                                                                {(req.current_days_off || []).slice(0, 1).map((d: string) => (
                                                                    <div key={d} className="px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg text-[9px] font-bold text-gray-400 border border-gray-100 dark:border-gray-800">{t(d.toLowerCase()).slice(0, 9)}</div>
                                                                ))}
                                                                {(req.current_days_off || []).length > 1 && <div className="px-1.5 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg text-[9px] font-bold text-gray-300 border border-gray-100 dark:border-gray-800">+{(req.current_days_off || []).length - 1}</div>}
                                                            </>
                                                        )}
                                                    </div>
                                                    <IconSquareRoundedArrowRightFilled size={14} className="text-gray-200" />
                                                    <div className="flex flex-wrap gap-1">
                                                        {req.frequency === 'specific_dates' ? (
                                                            (req.specific_dates || []).map((d: string) => (
                                                                <div key={d} className="px-2 py-1 bg-primary/10 rounded-lg text-[9px] font-black text-primary border border-primary/20">{dayjs(d).locale(currentLang).format('D MMM')}</div>
                                                            ))
                                                        ) : (
                                                            <>
                                                                {(req.requested_days_off || []).map((d: string) => (
                                                                    <div key={d} className="px-2 py-1 bg-primary/10 rounded-lg text-[9px] font-black text-primary border border-primary/20">{t(d.toLowerCase()).slice(0, 9)}</div>
                                                                ))}
                                                                {req.frequency === 'monthly' && (
                                                                    <div className="px-2 py-1 bg-violet-500/10 rounded-lg text-[9px] font-black text-violet-500 border border-violet-500/20">
                                                                        {req.weeks_of_month?.map((w:number) => w === 5 ? t('last') : w).join(',')}
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2 bg-gray-50/50 dark:bg-gray-800/30 p-3 rounded-xl border border-gray-50 dark:border-gray-800/50 italic">"{req.reason}"</p>
                                                {req.rejection_reason && (
                                                    <div className="mt-3 p-3 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                                                        <p className="text-[10px] font-bold text-rose-500 flex items-center gap-2"><IconX size={12} /> {req.rejection_reason}</p>
                                                    </div>
                                                )}
                                                {req.status === 'pending' && (
                                                    <button 
                                                        onClick={() => { setActionId(req.id); setActionMode('cancel'); }} 
                                                        disabled={cancelRequest.isPending}
                                                        className="mt-4 w-full h-11 flex items-center justify-center rounded-2xl border border-rose-100 dark:border-rose-900/30 text-rose-500 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        {t('cancel_request', 'Cancel Request')}
                                                    </button>
                                                )}
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    /* Approvals Tab */
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('pending_team_requests', 'Team Requests')}</h3>
                        </div>
                        {teamDayOffRequests.isLoading ? (
                            [1, 2].map(i => (
                                <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-3xl border border-gray-100 dark:border-gray-800" />
                            ))
                        ) : teamRequests.length === 0 ? (
                            <PwaEmptyState 
                                illustration="notification" 
                                title={t('no_pending_approvals', 'No Pending Approvals')} 
                                description={t('no_pending_approvals_desc', "You don't have any day-off requests to review right now.")} 
                            />
                        ) : (
                            teamRequests.map((req: any) => (
                                <DayOffApprovalCard 
                                    key={req.id} 
                                    request={req} 
                                    onApprove={(id) => { setActionId(id); setActionMode('approve'); }}
                                    onReject={(id) => { setActionId(id); setActionMode('reject'); }}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>

            <DayOffActionBottomSheet 
                isOpen={!!actionMode}
                onClose={closeAction}
                mode={actionMode}
                isLoading={approveTeamRequest.isPending || rejectTeamRequest.isPending || cancelRequest.isPending}
                onConfirm={handleAction}
            />
        </div>
    );
}
