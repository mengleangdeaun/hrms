import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { pwaFetch } from '@/lib/pwa-fetch';
import { pwaToast } from '@/utils/pwaToast';
import {
    IconClock,
    IconNotes,
    IconCalendarPlus,
    IconCheck,
    IconInfoCircle,
    IconSend,
    IconLoader2
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import PageHeader from '@/components/ui/pwa/PageHeader';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { playSuccessSound } from '@/lib/audio';
import { PwaDatePicker } from '@/components/ui/pwa/pwa-date-picker';
import { PwaTimePicker } from '@/components/ui/pwa/pwa-time-picker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { PwaMultiImageUpload } from '@/components/ui/pwa/pwa-multi-image-upload';
import { pwaCache } from '@/lib/pwa-cache';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function LeaveCreate() {
    const { t } = useTranslation('pwa');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const cachedBalances = pwaCache.get('leave_balances') || [];
    const cachedProfile = pwaCache.get('employee_profile');
    
    // Derived Leave Types from cached balances
    const initialTypes = cachedBalances
        .filter((b: any) => b.leave_type)
        .map((b: any) => ({
            ...b.leave_type,
            balance: parseFloat(b.balance)
        }));

    const [submitting, setSubmitting] = useState(false);
    const [leaveTypes, setLeaveTypes] = useState<any[]>(initialTypes);
    const [profile, setProfile] = useState<any>(cachedProfile);
    const [loading, setLoading] = useState(initialTypes.length === 0);

    const draft = pwaCache.get('leave_draft');

    const [form, setForm] = useState({
        leave_type_id: draft?.leave_type_id || '',
        duration_type: draft?.duration_type || 'full_day',
        start_date: draft?.start_date || dayjs().format('YYYY-MM-DD'),
        end_date: draft?.end_date || dayjs().format('YYYY-MM-DD'),
        start_time: draft?.start_time || '09:00',
        end_time: draft?.end_time || '18:00',
        reason: draft?.reason || '',
        attachments: [] as File[]
    });

    // Auto-save draft
    useEffect(() => {
        const { attachments, ...draftData } = form;
        pwaCache.set('leave_draft', draftData);
    }, [form]);

    useEffect(() => {
        dispatch(setPageTitle(t('new_leave', 'New Leave')));
    }, [dispatch, t]);

    useEffect(() => {
        const token = localStorage.getItem('employee_auth_token');
        if (!token) return navigate('/employee/login');

        const fetchData = async () => {
            if (!navigator.onLine) {
                setLoading(false);
                return;
            }

            try {
                const [balRes, profileRes] = await Promise.all([
                    pwaFetch('/api/employee-app/my-leave-balances', { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } }),
                    pwaFetch('/api/employee-app/profile', { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } })
                ]);

                if (balRes.status === 401) {
                    localStorage.removeItem('employee_auth_token');
                    navigate('/employee/login');
                    return;
                }

                if (balRes.ok) {
                    const balances = await balRes.json();
                    pwaCache.set('leave_balances', balances);
                    
                    // Extract unique leave types from balances
                    const types = balances
                        .filter((b: any) => b.leave_type)
                        .map((b: any) => ({
                            ...b.leave_type,
                            balance: parseFloat(b.balance)
                        }));
                    
                    setLeaveTypes(types);
                }

                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setProfile(profileData);
                    pwaCache.set('employee_profile', profileData);
                }
            } catch (e) {
                pwaToast.error('Network error loading data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!navigator.onLine) {
            pwaToast.error(t('connection_required_to_submit', 'Connection required to submit leave request'));
            return;
        }

        if (!form.leave_type_id) {
            pwaToast.error(t('please_select_leave_type', 'Please select a leave type'));
            return;
        }

        // Date Validation
        const today = dayjs().startOf('day');
        const start = dayjs(form.start_date);
        const end = dayjs(form.duration_type === 'multi_day' ? form.end_date : form.start_date);

        if (start.isBefore(today)) {
            pwaToast.error(t('past_dates_error', 'Cannot request leave for past dates'));
            return;
        }

        if (end.isBefore(start)) {
            pwaToast.error(t('end_date_error', 'End date cannot be before start date'));
            return;
        }

        setSubmitting(true);

        const token = localStorage.getItem('employee_auth_token');

        const formData = new FormData();
        
        // Add basic fields
        formData.append('leave_type_id', form.leave_type_id);
        formData.append('duration_type', form.duration_type);
        formData.append('start_date', form.start_date);
        formData.append('reason', form.reason);

        // Conditional fields
        const endDate = form.duration_type === 'multi_day' ? form.end_date : form.start_date;
        formData.append('end_date', endDate);

        if (form.duration_type === 'custom_time') {
            formData.append('start_time', form.start_time);
            formData.append('end_time', form.end_time);
        }

        // Add attachments
        form.attachments.forEach((file) => {
            formData.append('attachments[]', file);
        });

        try {
            const res = await pwaFetch('/api/employee-app/leave-requests', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                pwaCache.clear('leave_draft');
                playSuccessSound();
                pwaToast.success(t('leave_submitted', 'Leave request submitted successfully'));
            } else {
                if (data.errors) {
                    Object.values(data.errors).forEach((err: any) => pwaToast.error(err[0]));
                } else {
                    pwaToast.error(data.message || t('submit_error', 'Error submitting request'));
                }
            }
        } catch (e) {
            pwaToast.error('Network error');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedCategory = leaveTypes.find(t => String(t.id) === String(form.leave_type_id));
    
    // Dynamic Approver Resolution
    const currentApprover = selectedCategory?.specific_approver || profile?.line_manager || {
        name: 'HR Administrator',
        designation: 'System Default'
    };

    const selectedLeaveType = leaveTypes.find(t => t.id === form.leave_type_id);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize for textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [form.reason]);

    const durationOptions = [
        { id: 'full_day', label: t('duration_full_day', 'Full Day') },
        { 
            id: 'first_half', 
            label: t('duration_first_half', 'Session 1 (Morning)'),
            visible: selectedLeaveType?.allow_half_day ?? true 
        },
        { 
            id: 'second_half', 
            label: t('duration_second_half', 'Session 2 (Afternoon)'),
            visible: selectedLeaveType?.allow_half_day ?? true 
        },
        { id: 'multi_day', label: t('duration_multi_day', 'Multiple Days') },
        { 
            id: 'custom_time', 
            label: t('duration_custom_time', 'Time (From time to time)'),
            visible: selectedLeaveType?.allow_hourly ?? true
        },
    ].filter(opt => opt.visible !== false);

    // If current duration_type becomes hidden due to leave type change, reset to full_day
    useEffect(() => {
        if (form.duration_type !== 'full_day' && form.duration_type !== 'multi_day') {
            const isVisible = durationOptions.some(opt => opt.id === form.duration_type);
            if (!isVisible) {
                setForm(prev => ({ ...prev, duration_type: 'full_day' }));
            }
        }
    }, [form.leave_type_id]);

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#060818] dark:to-[#0a0e2a] pb-10">
            <PageHeader title={t('new_leave', 'New Leave')} icon={<svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5 text-primary'  width="22" height="22" color="none" fill="none" viewBox="0 0 24 24"><path d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12V14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14V12Z" stroke="currentColor" stroke-width="1.5"></path><path d="M18 16L16 16M16 16L14 16M16 16L16 14M16 16L16 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M7 4V2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M17 4V2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M2 9H22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>} />

            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-20">
                <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
                    
                    {/* Hero Header Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-primary/20 via-primary/5 to-transparent p-6 rounded-3xl border border-primary/10 backdrop-blur-sm shadow-sm relative overflow-hidden mb-2"
                    >
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                        <div className="relative z-10 flex items-center gap-5">
                            <div className="bg-primary/20 p-4 rounded-3xl shadow-inner">
                                <IconCalendarPlus className="text-primary w-9 h-9" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                                    {selectedLeaveType ? t('plan_your_leave', 'Plan your {{type}}', { type: selectedLeaveType.name }) : t('planning_time_off', 'Planning time off?')}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {selectedLeaveType 
                                        ? t('leave_balance_msg', 'You have {{balance}} days left', { balance: selectedLeaveType.balance || 0 }) 
                                        : t('select_type_to_start', 'Select a leave type to begin')}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* 1. Leave Type Selection */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-[12px] font-black uppercase tracking-wide text-gray-400">1. {t('select_leave_type', 'Select Leave Type')}</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {loading && leaveTypes.length === 0 ? (
                                <>
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-24 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 animate-pulse flex flex-col p-5 gap-2">
                                            <div className="h-4 w-2/3 bg-gray-100 dark:bg-gray-700 rounded" />
                                            <div className="h-3 w-1/2 bg-gray-50 dark:bg-gray-700 rounded" />
                                        </div>
                                    ))}
                                </>
                            ) : leaveTypes.length === 0 ? (
                                <div className="col-span-2">
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-white dark:bg-gray-800/50 rounded-3xl p-8 border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center text-center shadow-sm"
                                    >
                                        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/10 rounded-2xl flex items-center justify-center mb-4 border border-amber-100/50 dark:border-amber-900/20">
                                            <IconInfoCircle className="w-8 h-8 text-amber-500" />
                                        </div>
                                        <h3 className="text-[13px] font-black text-gray-900 dark:text-white mb-2 leading-tight">
                                            {t('no_leave_allocation_msg')}
                                        </h3>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-[220px] leading-relaxed">
                                            {t('no_leave_allocation_desc', 'Please contact your HR department or supervisor.')}
                                        </p>
                                    </motion.div>
                                </div>
                            ) : (
                                leaveTypes.map(type => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setForm({ ...form, leave_type_id: type.id })}
                                        className={cn(
                                            "relative p-5 rounded-2xl border-2 text-[13px] font-black transition-all text-left overflow-hidden active:scale-[0.96] touch-manipulation",
                                            form.leave_type_id == type.id
                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 ring-4 ring-primary/10 scale-[1.02]"
                                                : "bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-primary/30"
                                        )}
                                    >
                                        <span className="relative z-10 block truncate">{type.name}</span>
                                        {form.leave_type_id == type.id && (
                                            <motion.div 
                                                layoutId="check"
                                                className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center backdrop-blur-md"
                                            >
                                                <IconCheck className="w-3 h-3 text-primary" />
                                            </motion.div>
                                        )}
                                        <div className="mt-2 text-[10px] opacity-80 font-medium">
                                            {Number(type.balance || 0).toFixed(2)} {t('days', 'days')}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>

                    {/* Sections below only if leave types are available */}
                    {leaveTypes.length > 0 && (
                        <>
                            {/* Approver Card */}
                            {profile && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="bg-white dark:bg-gray-800/80 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/50 flex items-center justify-between shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 rounded-full ring-2 ring-primary shrink-0">
                                    <AvatarImage src={currentApprover.profile_image_url} className="object-cover" />
                                    <AvatarFallback className="rounded-full text-xs font-black text-primary bg-primary/10 flex items-center justify-center">
                                        {currentApprover.name ? currentApprover.name.charAt(0).toUpperCase() : <IconCheck className="w-5 h-5" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest mb-1">{t('your_approver', 'Your Approver')}</p>
                                    <h5 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                                        {currentApprover.name}
                                    </h5>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] font-black uppercase tracking-tighter bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full text-gray-500 whitespace-nowrap">
                                    {currentApprover.designation}
                                </span>
                            </div>
                        </motion.div>
                    )}

                    {/* 2. Duration Details */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-5"
                    >
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-[12px] font-black uppercase tracking-wide text-gray-400">2. {t('duration_details', 'Duration Details')}</h4>
                        </div>

                        <div className="bg-white dark:bg-gray-800/80 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 backdrop-blur-md space-y-6">
                            
                            {/* Duration Type Dropdown (Shadcn Select) */}
                            <div className="space-y-2">
                                <label className="text-[12px] font-black uppercase tracking-wide text-gray-400 ml-1">{t('duration_type', 'Duration Type')}</label>
                                <Select
                                    value={form.duration_type}
                                    onValueChange={val => setForm({ ...form, duration_type: val })}
                                >
                                    <SelectTrigger className="w-full h-14 bg-gray-50 dark:bg-gray-900/50 border-none rounded-xl pl-4 pr-4 text-sm font-black focus:ring-2 focus:ring-primary/50 transition-all dark:text-white">
                                        <div className="flex items-center gap-3">
                                            <IconClock className="w-5 h-5 text-primary opacity-60" />
                                            <SelectValue placeholder={t('select_type', 'Select type')} />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                        {durationOptions.map(opt => (
                                            <SelectItem 
                                                key={opt.id} 
                                                value={opt.id}
                                                className="py-3 font-bold rounded-lg"
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date Area (PWA Date Picker) */}
                            <div className={cn(
                                "grid gap-4 p-0 bg-transparent dark:bg-transparent rounded-2xl border border-none dark:border-none",
                                form.duration_type === 'multi_day' ? "grid-cols-2" : "grid-cols-1"
                            )}>
                                <PwaDatePicker
                                    className="bg-gray-50/50 dark:bg-gray-900/30"
                                    label={form.duration_type === 'multi_day' ? t('start_date', 'Start Date') : t('date', 'Date')}
                                    value={form.start_date}
                                    fromDate={new Date()}
                                    onChange={val => setForm({ ...form, start_date: val, end_date: form.duration_type !== 'multi_day' ? val : form.end_date })}
                                />

                                {form.duration_type === 'multi_day' && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                    >
                                        <PwaDatePicker
                                            className="bg-gray-50/50 dark:bg-gray-900/30"
                                            label={t('end_date', 'End Date')}
                                            value={form.end_date}
                                            fromDate={dayjs(form.start_date).toDate()}
                                            onChange={val => setForm({ ...form, end_date: val })}
                                        />
                                    </motion.div>
                                )}
                            </div>

                            {/* Time Area (PWA Time Picker) */}
                            <AnimatePresence>
                                {form.duration_type === 'custom_time' && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="grid grid-cols-2 gap-4 overflow-hidden pt-2"
                                    >
                                        <PwaTimePicker
                                            className='bg-gray-50'
                                            label={t('from', 'From')}
                                            value={form.start_time}
                                            onChange={val => setForm({ ...form, start_time: val })}
                                        />
                                        <PwaTimePicker
                                            className='bg-gray-50 dark:bg-gray-800'
                                            label={t('to', 'To')}
                                            value={form.end_time}
                                            onChange={val => setForm({ ...form, end_time: val })}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* 3. Reason & Attachments */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-[12px] font-black uppercase tracking-wide text-gray-400">3. {t('additional_info', 'Reason & Attachments')}</h4>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-black uppercase tracking-wide text-gray-400 ml-1">{t('reason_label', 'Reason')}</label>
                                <Textarea
                                    ref={textareaRef}
                                    value={form.reason}
                                    onChange={e => setForm({ ...form, reason: e.target.value })}
                                    className="w-full bg-gray-50/50 dark:bg-gray-900/50  rounded-2xl p-4 text-sm font-medium transition-all resize-none min-h-[100px] dark:text-white"
                                    placeholder={t('leave_reason_placeholder', 'Why are you requesting this leave?')}
                                    required
                                />
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-700/50 pt-4">
                                <PwaMultiImageUpload 
                                    value={form.attachments}
                                    onChange={files => setForm({ ...form, attachments: files })}
                                />
                            </div>

                            <div className="flex items-center gap-2 text-[12px] text-gray-400 font-bold uppercase tracking-wide bg-gray-50 dark:bg-gray-900/30 p-2 rounded-xl">
                                <IconInfoCircle className="w-3.5 h-3.5 text-primary" />
                                {t('auto_saved')}
                            </div>
                        </div>
                    </motion.div>

                    {/* Submit Action */}
                    <div className="pt-4 pb-12">
                        <button
                            type="submit"
                            disabled={submitting || !form.leave_type_id}
                            className={cn(
                                "w-full h-16 rounded-full font-black text-xs uppercase tracking-wide shadow transition-all active:scale-[0.98] flex items-center justify-center gap-3 touch-manipulation",
                                submitting || !form.leave_type_id
                                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                                    : "bg-primary text-white shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.01]"
                            )}
                        >
                            {submitting ? (
                                <>
                                    <IconLoader2 className="w-6 h-6 animate-spin" />
                                    <span>{t('submitting', 'Submitting')}...</span>
                                </>
                            ) : (
                                <>
                                    <span>{t('send_request', 'Send Leave Request')}</span>
                                    <IconSend className="w-5 h-5 opacity-80" />
                                </>
                            )}
                        </button>
                        
                        <AnimatePresence>
                            {!form.leave_type_id && (
                                <motion.p 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-center text-primary text-[12px] mt-5 font-black uppercase tracking-wide"
                                >
                                    {t('select_type_warning', 'Please pick a leave type to proceed')}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                            </>
                        )}
                    </form>
            </div>
        </div>
    );
}
