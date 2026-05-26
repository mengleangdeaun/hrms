import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IconMapPin,
    IconLoader2,
    IconAlertTriangle,
    IconCircleXFilled,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import type { RadarVerificationCardProps } from '../types';

/**
 * The primary card in the scanning flow. Renders one of three visual states:
 *  - **idle**      – Pulsing map-pin + GPS warm-up copy
 *  - **verifying** – Spinning loader + authenticating copy
 *  - **error**     – Rose error card with distance badge and retry / cancel actions
 *
 * A "Waiting for explanation" badge also appears inside the idle state when a
 * reason is required but not yet submitted.
 */
export default function RadarVerificationCard({
    status,
    message,
    distance,
    reasonRequired,
    isPrecise,
    isWarmingUp,
    onCancel,
    onRetry,
}: RadarVerificationCardProps) {
    const { t } = useTranslation('pwa');

    return (
        <>
            {/* ── Non-error states ──────────────────────────────────────── */}
            {status !== 'error' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="w-full max-w-md text-center space-y-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-10 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-500/5"
                >
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="w-24 h-24 rounded-full flex items-center justify-center mx-auto bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 shadow-lg shadow-primary/10"
                    >
                        {status === 'verifying' ? (
                            <IconLoader2 size={48} className="animate-spin text-primary" />
                        ) : (
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <IconMapPin size={48} className="text-primary" strokeWidth={1.5} />
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Title & description */}
                    <div className="space-y-3">
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            {status === 'verifying'
                                ? t('authenticating', 'Authenticating')
                                : t('securing_location', 'Securing Location')}
                        </h2>
                        <div className="space-y-1">
                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                {status === 'verifying'
                                    ? message || t('verifying_desc', 'Verifying your credentials and location...')
                                    : t('gps_warmup_desc', 'Establishing high-accuracy GPS lock...')}
                            </p>

                            {/* Low-accuracy inline badge */}
                            {!isPrecise && status === 'idle' && !isWarmingUp && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-800/50"
                                >
                                    <IconAlertTriangle size={14} />
                                    {t('low_accuracy', 'Low Location Accuracy')}
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Reason-awaiting badge */}
                    <AnimatePresence>
                        {reasonRequired && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="px-4 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-800/50"
                            >
                                <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                    <IconAlertTriangle size={14} />
                                    {t('waiting_for_reason', 'Awaiting explanation')}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Cancel button */}
                    <div className="pt-4 w-full">
                        <Button
                            variant="ghost"
                            onClick={onCancel}
                            className="h-12 w-full text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest"
                        >
                            {t('cancel', 'Cancel')}
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* ── Error state ───────────────────────────────────────────── */}
            {status === 'error' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="w-full max-w-md text-center space-y-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-10 border border-rose-100 dark:border-rose-800/30 shadow-2xl shadow-rose-500/10"
                >
                    {/* Error icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="w-24 h-24 bg-rose-500 text-white ring-1 ring-rose-200 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-rose-500/30"
                    >
                        <IconCircleXFilled size={64} />
                    </motion.div>

                    <div className="space-y-3">
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            {t('verification_failed', 'Verification Failed')}
                        </h2>
                        <div className="space-y-1">
                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                {message}
                            </p>
                            {distance && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold uppercase tracking-wider border border-rose-200 dark:border-rose-800/50 mt-2"
                                >
                                    <IconMapPin size={14} />
                                    {t('away_by', { distance: Math.round(distance) })}
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <Button
                            onClick={onRetry}
                            className="h-12 w-full bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all text-[11px] uppercase tracking-widest"
                        >
                            {t('try_again', 'TRY AGAIN')}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onCancel}
                            className="h-12 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest"
                        >
                            {t('cancel', 'Cancel')}
                        </Button>
                    </div>
                </motion.div>
            )}
        </>
    );
}
