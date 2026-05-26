import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IconAlertTriangle, IconSend } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Button } from '../button';
import { useAttendanceStatus } from '@/hooks/useAttendanceStatus';
import { Textarea } from '../textarea';
import { formatMinutesToDuration } from '@/utils/timeFormat';

interface AttendanceReasonEnforcerProps {
    onProceed: (reason: string) => void;
    onCancel?: () => void;
    initialReason?: string;
}

export const AttendanceReasonEnforcer: React.FC<AttendanceReasonEnforcerProps> = ({ 
    onProceed, 
    onCancel,
    initialReason = '' 
}) => {
    const { t } = useTranslation('pwa');
    const { proactiveStatus, reasonPresets } = useAttendanceStatus();
    const [reason, setReason] = useState(initialReason);

    const durationStr = useMemo(() => {
        return formatMinutesToDuration(proactiveStatus?.minutes || 0, t);
    }, [proactiveStatus?.minutes, t]);

    const filteredPresets = useMemo(() => {
        if (!proactiveStatus?.type || !reasonPresets) return [];
        return reasonPresets.filter((p: any) => 
            p.is_active && (p.type === 'both' || p.type === proactiveStatus.type)
        );
    }, [reasonPresets, proactiveStatus?.type]);

    if (!proactiveStatus) return null;

    return (
        <div className="mt-4">
            {/* Status Alert */}
            <div className="flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl mb-6 border border-orange-100 dark:border-orange-500/10">
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 shrink-0">
                    <IconAlertTriangle size={24} />
                </div>
                <div>
                    <p className="font-black text-orange-900 dark:text-orange-200 uppercase tracking-wider text-[12px]">
                        {proactiveStatus.type === 'late' ? t('late_detected', 'Late Detected') : 
                         proactiveStatus.type === 'off' ? t('non_working_day', 'Non-Working Day') :
                         t('early_departure', 'Early Departure')}
                    </p>
                    <p className="text-[16px] font-bold text-orange-700 dark:text-orange-300">
                        {proactiveStatus.type === 'late' 
                            ? t('late_msg_formatted', 'You are {{duration}} late', { duration: durationStr })
                            : proactiveStatus.type === 'off'
                                ? t('non_working_day_msg', 'Today is marked as a non-working day')
                                : t('early_msg_formatted', 'You are leaving {{duration}} early', { duration: durationStr })
                        }
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-gray-400 tracking-wide ml-1">
                    {t('reason_required_q', 'Why are you {{type}}?', { 
                        type: proactiveStatus.type === 'late' ? t('late_detected', 'late') : 
                              proactiveStatus.type === 'off' ? t('non_working_day', 'off') :
                              t('early_departure', 'early') 
                    })}
                </label>

                {/* Preset Chips */}
                {filteredPresets.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {filteredPresets.map((preset: any) => (
                            <button
                                key={preset.id}
                                onClick={() => setReason(preset.reason_text)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                    reason === preset.reason_text 
                                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/30" 
                                        : "bg-gray-100 dark:bg-gray-800 border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                                )}
                            >
                                {preset.reason_text}
                            </button>
                        ))}
                    </div>
                )}

                {/* Custom Textarea */}
                <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t('reason_placeholder', 'Or enter custom reason here...')}
                    className="w-full h-32 p-4 rounded-2xl text-sm font-medium resize-none text-gray-900 dark:text-white"
                />
                
                {/* Submit Button */}
                <Button 
                    size="lg"
                    disabled={!reason.trim()}
                    className="w-full rounded-2xl h-14 bg-primary text-white font-black uppercase tracking-wide text-sm mt-4 shadow-xl shadow-primary/20"
                    onClick={() => onProceed(reason)}
                >
                    {t('proceed_to_scan', 'Proceed to Scan')}
                </Button>

                {/* Cancel Button */}
                {onCancel && (
                    <button 
                        onClick={onCancel}
                        className="w-full py-2 text-sm font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors uppercase tracking-wide mt-2"
                    >
                        {t('cancel', 'Cancel')}
                    </button>
                )}
            </div>
        </div>
    );
};
