import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { IconActivity, IconBriefcase, IconCamera, IconSend } from '@tabler/icons-react';
import PageHeader from '@/components/ui/pwa/PageHeader';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { playSuccessSound } from '@/lib/audio';
import { format } from 'date-fns';

// Modular Components
import { TypeStep } from './components/TypeStep';
import { AttachmentStep } from './components/AttachmentStep';
import { CommentStep } from './components/CommentStep';
import { useAttendance } from '@/context/AttendanceContext';
import { useConnection } from '@/context/ConnectionContext';
import { offlineDB } from '@/lib/offline-db';
import { pwaFetch } from '@/lib/pwa-fetch';

type Step = 'type' | 'attachments' | 'comment';

export default function EmployeePwaActivityCreate() {
    const { t } = useTranslation('pwa');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const token = localStorage.getItem('employee_auth_token');
    const { isOnline } = useConnection();

    // Form State
    const [step, setStep] = useState<Step>('type');
    const [activityType, setActivityType] = useState<string>('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [comment, setComment] = useState('');
    const [location, setLocation] = useState<{ lat: number; lng: number; name?: string } | null>(null);
    
    // UI State
    const [locLoading, setLocLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    const { permissions, requestLocationPermission, location: globalLocation } = useAttendance();

    useEffect(() => {
        dispatch(setPageTitle(t('new_activity', 'New Activity') as string));
        
        // Auto-request location only if we haven't been denied yet
        if (permissions.location !== 'denied') {
            requestLocation();
        }
    }, [dispatch, t, permissions.location]);

    // Effect to perform reverse geocoding when coordinates are available
    useEffect(() => {
        if (globalLocation.lat !== null && globalLocation.lng !== null && !location) {
            const performReverseGeocoding = async () => {
                let name: string | undefined;
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000);
                    
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${globalLocation.lat}&lon=${globalLocation.lng}&format=json`, {
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (res.ok) {
                        const data = await res.json();
                        const parts = [data.address?.road, data.address?.suburb, data.address?.city].filter(Boolean);
                        name = parts.slice(0, 2).join(', ');
                    }
                } catch (e) {
                    name = t('location_captured_offline', 'Location Captured (Offline)') as string;
                }
                setLocation({ lat: globalLocation.lat as number, lng: globalLocation.lng as number, name });
            };
            performReverseGeocoding();
        }
    }, [globalLocation, location, t]);

    const requestLocation = async () => {
        if (!navigator.geolocation) return;
        setLocLoading(true);
        const granted = await requestLocationPermission();
        setLocLoading(false);
        if (!granted && permissions.location === 'denied') {
            toast.error(t('location_hidden_alert', 'Location hidden. Enable it in Settings for precise logging.') as string);
        }
    };

    const handleSubmit = async () => {
        if (!activityType) {
            toast.error(t('select_type_error', 'Please select an activity type') as string);
            setStep('type');
            return;
        }
        if (attachments.length === 0) {
            toast.error(t('attach_photo_error', 'Please attach at least one photo') as string);
            setStep('attachments');
            return;
        }
        if (!token) { navigate('/employee/login'); return; }

        setSubmitting(true);

        const now = new Date();
        const activityData = {
            activity_type: activityType,
            attachments: attachments, // Array of Files
            comment: comment,
            latitude: location ? String(location.lat) : undefined,
            longitude: location ? String(location.lng) : undefined,
            location_name: location?.name,
            activity_date: format(now, 'yyyy-MM-dd'),
            submitted_at: format(now, 'yyyy-MM-dd HH:mm:ss'), // Send as local time string
            status: 'pending' as const
        };

        // OFFLINE LOGIC
        if (!isOnline) {
            try {
                await offlineDB.saveActivity(activityData);
                playSuccessSound();
                toast.success(t('activity_saved_offline', 'Activity Saved Locally') as string, {
                    description: t('sync_when_online', 'It will be automatically synced when connection returns.') as string
                });
                navigate('/employee/activity');
                return;
            } catch (err) {
                console.error('Offline save failed', err);
                toast.error(t('offline_save_failed', 'Failed to save locally') as string);
                setSubmitting(false);
                return;
            }
        }

        const form = new FormData();
        form.append('activity_type', activityType);
        attachments.forEach((file) => {
            form.append('attachments[]', file);
        });

        if (comment) form.append('comment', comment);
        
        // Ensure coordinates are sent if available
        if (location) {
            form.append('latitude', String(location.lat));
            form.append('longitude', String(location.lng));
            if (location.name) form.append('location_name', location.name);
        }
        
        // Add timestamps to online submission too for consistency
        form.append('activity_date', activityData.activity_date);
        form.append('submitted_at', activityData.submitted_at);

        try {
            const res = await pwaFetch('/api/employee-app/activities', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: form,
            });
            const data = await res.json();
            if (res.ok) {
                playSuccessSound();
                toast.success(t('activity_logged_success', 'Activity Logged Successfully') as string);
                navigate('/employee/activity');
            } else {
                toast.error(data.message || t('submission_failed', 'Submission failed') as string);
            }
        } catch { 
            // Fallback to offline if network fails during request
            try {
                await offlineDB.saveActivity(activityData);
                playSuccessSound();
                toast.info(t('network_error_saved_offline', 'Network error. Activity saved locally.') as string);
                navigate('/employee/activity');
            } catch {
                toast.error(t('network_error_check', 'Network error. Check your connection.') as string); 
            }
        } finally { 
            setSubmitting(false); 
        }
    };

    const handleTypeSelect = (type: string) => {
        setActivityType(type);
        setStep('attachments');
    };

    // Navigator Helper
    const steps = [
        { id: 'type', label: t('step_type', 'Type') as string, icon: IconBriefcase },
        { id: 'attachments', label: t('step_photos', 'Photos') as string, icon: IconCamera },
        { id: 'comment', label: t('step_finalize', 'Finalize') as string, icon: IconSend },
    ] as const;

    const currentIdx = steps.findIndex(s => s.id === step);

    const canNavigate = (targetStep: Step) => {
        if (targetStep === 'type') return true;
        if (targetStep === 'attachments') return !!activityType;
        if (targetStep === 'comment') return !!activityType && attachments.length > 0;
        return false;
    };

    return (
        <div className="flex flex-col min-h-[100dvh] bg-gray-50/50 dark:bg-[#060818] pb-10">
            <PageHeader 
                title={t('create_activity', 'Create Activity') as string}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary" width="22" height="22" color="none" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="13" r="3" stroke="currentColor" stroke-width="1.5"></circle><path opacity="0.5" d="M9.77778 21H14.2222C17.3433 21 18.9038 21 20.0248 20.2646C20.51 19.9462 20.9267 19.5371 21.251 19.0607C22 17.9601 22 16.4279 22 13.3636C22 10.2994 22 8.76721 21.251 7.6666C20.9267 7.19014 20.51 6.78104 20.0248 6.46268C19.3044 5.99013 18.4027 5.82123 17.022 5.76086C16.3631 5.76086 15.7959 5.27068 15.6667 4.63636C15.4728 3.68489 14.6219 3 13.6337 3H10.3663C9.37805 3 8.52715 3.68489 8.33333 4.63636C8.20412 5.27068 7.63685 5.76086 6.978 5.76086C5.59733 5.82123 4.69555 5.99013 3.97524 6.46268C3.48995 6.78104 3.07328 7.19014 2.74902 7.6666C2 8.76721 2 10.2994 2 13.3636C2 16.4279 2 17.9601 2.74902 19.0607C3.07328 19.5371 3.48995 19.9462 3.97524 20.2646C5.09624 21 6.65675 21 9.77778 21Z" stroke="currentColor" stroke-width="1.5"></path><path d="M19 10H18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>} 
            />

            <div className="flex-1 p-5 max-w-lg mx-auto w-full">
                {/* Step Navigator - Interactive Pills */}
                <div className="flex p-1 bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl relative border border-gray-100 dark:border-gray-700/50 mb-8 overflow-hidden shadow-sm">
                    {steps.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => canNavigate(s.id) && setStep(s.id)}
                            disabled={!canNavigate(s.id)}
                            className={cn(
                                "relative flex-1 py-3 flex flex-col items-center justify-center gap-1 text-[12px] font-black uppercase tracking-wider transition-all z-10",
                                step === s.id ? "text-primary" : "text-gray-400 disabled:opacity-30"
                            )}
                        >
                            <s.icon className={cn("w-4 h-4 transition-transform", step === s.id && "scale-110")} />
                            {s.label}
                            
                            {step === s.id && (
                                <motion.div
                                    layoutId="active-step-pill"
                                    className="absolute inset-0 bg-primary/5 dark:bg-primary/10 rounded-xl -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            
                            {/* Done checkmark indicator */}
                            {((s.id === 'type' && activityType)) && step !== s.id && (
                                <div className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                            )}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 'type' && (
                        <TypeStep 
                            key="type"
                            selectedType={activityType}
                            onSelect={handleTypeSelect}
                        />
                    )}

                    {step === 'attachments' && (
                        <AttachmentStep 
                            key="attachments"
                            attachments={attachments}
                            onChange={setAttachments}
                            onNext={() => setStep('comment')}
                        />
                    )}

                    {step === 'comment' && (
                        <CommentStep 
                            key="comment"
                            comment={comment}
                            onChange={setComment}
                            onBack={() => setStep('attachments')}
                            onSubmit={handleSubmit}
                            submitting={submitting}
                            
                            // Background location props
                            location={location}
                            locLoading={locLoading}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
