import { useTranslation } from 'react-i18next';
import { IconAlertTriangle, IconLoader2, IconSend } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import BottomSheet from '@/components/ui/bottom-sheet';
import type { ReasonSubmissionSheetProps } from '../types';

/**
 * BottomSheet that collects a written justification from the employee
 * when they are late or departing early beyond the company tolerance.
 */
export default function ReasonSubmissionSheet({
    isOpen,
    reasonType,
    lateMinutes,
    reason,
    isVerifying,
    onReasonChange,
    onSubmit,
    onClose,
}: ReasonSubmissionSheetProps) {
    const { t } = useTranslation('pwa');

    // Format the delay/early duration as "Xh Ym" or "Y min"
    const mins     = Math.round(Math.abs(lateMinutes));
    const duration =
        mins >= 60
            ? `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}m` : ''}`
            : `${mins} min`;

    const typeLabel =
        reasonType === 'late'
            ? t('beyond_tolerance', 'beyond tolerance')
            : t('earlier_than_scheduled', 'earlier than scheduled');

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title={t('reason_required', 'Reason Required')}>
            <div className="flex flex-col gap-6 py-2">
                {/* Alert callout */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-500/20">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                        <IconAlertTriangle size={24} />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider">
                            {reasonType === 'late'
                                ? t('late_arrival', 'Late Arrival')
                                : t('early_departure', 'Early Departure')}
                        </p>
                        <p className="text-sm text-orange-700/80 dark:text-orange-400/80 mt-0.5 leading-snug">
                            {t('policy_alert_desc', { minutes: duration, type: typeLabel })}
                        </p>
                    </div>
                </div>

                {/* Reason text area */}
                <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400 ml-1">
                        {t('brief_explanation', 'Brief Explanation')}
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => onReasonChange(e.target.value)}
                        placeholder={t('reason_placeholder', 'Example: Traffic jam, personal emergency...')}
                        className="w-full min-h-[120px] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold resize-none"
                        autoFocus
                    />
                </div>

                {/* Submit button */}
                <Button
                    onClick={onSubmit}
                    disabled={isVerifying}
                    className="h-14 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20 active:scale-95 transition-all text-sm uppercase tracking-wider disabled:opacity-70"
                >
                    {isVerifying ? (
                        <IconLoader2 size={20} className="animate-spin" />
                    ) : (
                        <IconSend size={20} />
                    )}
                    {isVerifying ? t('submitting', 'Submitting...') : t('submit_and_clock')}
                </Button>

                {/* Cancel */}
                <button
                    onClick={onClose}
                    className="w-full py-2 text-sm font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors uppercase tracking-widest mt-2"
                >
                    {t('cancel', 'Cancel')}
                </button>
            </div>
        </BottomSheet>
    );
}
