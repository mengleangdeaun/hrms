import { useState } from 'react';
import { pwaToast } from '@/utils/pwaToast';
import { IconSend, IconMessage2, IconDeviceMobile, IconAlertCircle, IconLoader2 } from '@tabler/icons-react';
import BottomSheet from '@/components/ui/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea';
import { pwaFetch } from '@/lib/pwa-fetch';

interface AppFeedbackDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AppFeedbackDrawer({ isOpen, onClose }: AppFeedbackDrawerProps) {
    const { t } = useTranslation('pwa');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setSubmitting(true);
        const token = localStorage.getItem('employee_auth_token');

        try {
            // Basic device info collection
            const deviceInfo = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                vendor: navigator.vendor,
                screen: `${window.screen.width}x${window.screen.height}`,
                language: navigator.language,
                standalone: (navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches
            };

            const response = await pwaFetch('/api/employee-app/app-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: message.trim(),
                    device_info: deviceInfo
                })
            });

            const data = await response.json();

            if (response.ok) {
                pwaToast.success(data.message || t('feedback_submitted', 'Feedback submitted!'));
                setMessage('');
                onClose();
            } else {
                throw new Error(data.message || 'Failed to submit feedback');
            }
        } catch (error: any) {
            pwaToast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title={t('app_feedback', 'App Feedback')}
        >
            <form onSubmit={handleSubmit} className="space-y-6 pb-8 mx-auto max-w-lg">
                <div className="flex flex-col items-center text-center space-y-2 mb-2">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                        <IconMessage2 size={32} />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {t('help_us_improve', 'Help us improve')}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-[280px]">
                        {t('feedback_desc', 'Found a bug or have a suggestion? Tell us about it.')}
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pl-1">
                        {t('your_message', 'Your Message')}
                    </label>
                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t('feedback_placeholder', 'Describe your experience or suggestion...')}
                        className="w-full min-h-[160px] p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 focus:ring-primary/20 focus:border-primary transition-all resize-none text-sm"
                        disabled={submitting}
                        required
                    />
                </div>

                <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-500/20 flex gap-3">
                    <IconDeviceMobile className="text-amber-600 dark:text-amber-500 shrink-0" size={20} />
                    <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
                        {t('device_info_hint', 'Basic device info (OS, screen size) is automatically attached to help us debug.')}
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={submitting || !message.trim()}
                    className="w-full h-14 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-primary/20"
                >
                    {submitting ? (
                        <>
                            <IconLoader2 className='animate-spin' size={20} />
                            {t('submitting', 'Submitting...')}
                        </>
                    ) : (
                        <>
                            <IconSend size={20} />
                            {t('send_feedback', 'Send Feedback')}
                        </>
                    )}
                </button>
            </form>
        </BottomSheet>
    );
}
