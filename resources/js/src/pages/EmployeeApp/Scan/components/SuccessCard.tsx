import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { IconCircleCheckFilled } from '@tabler/icons-react';

/**
 * Full-screen success state shown immediately after a successful (or offline-queued)
 * clock-in. Disappears automatically once the redirect fires.
 */
export default function SuccessCard() {
    const { t } = useTranslation('pwa');

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                className="max-w-md w-full text-center space-y-6 bg-white/70 backdrop-blur-xl rounded-3xl p-10 border border-emerald-100 shadow-2xl shadow-emerald-500/10"
            >
                {/* Animated checkmark */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="w-24 h-24 bg-emerald-500 text-white ring-1 ring-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30"
                >
                    <IconCircleCheckFilled size={64} />
                </motion.div>

                <div className="space-y-3">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">
                        {t('attendance_recorded', 'Attendance Recorded!')}
                    </h2>
                    <div className="space-y-1">
                        <p className="text-slate-500 font-medium leading-relaxed">
                            {t('attendance_success_desc', 'Your clock-in has been verified and logged successfully.')}
                        </p>
                        <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wide pt-2">
                            {t('redirecting_to_dashboard', 'Redirecting to your dashboard...')}
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
