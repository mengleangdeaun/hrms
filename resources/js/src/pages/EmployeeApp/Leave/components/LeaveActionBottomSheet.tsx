import React from 'react';
import BottomSheet from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { IconCheck, IconX, IconAlertTriangle, IconMessage2 } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface LeaveActionBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason?: string) => void;
    mode: 'approve' | 'reject' | 'cancel' | null;
    isLoading?: boolean;
}

export const LeaveActionBottomSheet: React.FC<LeaveActionBottomSheetProps> = ({
    isOpen,
    onClose,
    onConfirm,
    mode,
    isLoading = false
}) => {
    const { t } = useTranslation('pwa');
    const [reason, setReason] = React.useState('');

    React.useEffect(() => {
        if (isOpen) setReason('');
    }, [isOpen]);

    const configs = {
        approve: {
            title: t('approve_request_title', 'Approve Request'),
            message: t('approve_request_msg', "Are you sure you want to approve this leave? The employee's balance will be deducted immediately."),
            icon: <IconCheck className="w-8 h-8 text-emerald-500" />,
            confirmLabel: t('confirm_approval', 'Confirm Approval'),
            variant: 'primary',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20'
        },
        reject: {
            title: t('reject_request_title', 'Reject Request'),
            message: t('reject_request_msg', 'Please provide a reason for rejecting this request. This will be shared with the employee.'),
            icon: <IconX className="w-8 h-8 text-rose-500" />,
            confirmLabel: t('confirm_rejection', 'Confirm Rejection'),
            variant: 'danger',
            bg: 'bg-rose-50 dark:bg-rose-900/20'
        },
        cancel: {
            title: t('cancel_request_title', 'Cancel Request'),
            message: t('cancel_request_msg', 'Are you sure you want to cancel your leave request? This action cannot be undone.'),
            icon: <IconAlertTriangle className="w-8 h-8 text-amber-500" />,
            confirmLabel: t('yes_cancel', 'Yes, Cancel'),
            variant: 'danger',
            bg: 'bg-amber-50 dark:bg-amber-900/20'
        }
    };

    const config = mode ? configs[mode] : null;

    if (!config) return null;

    const handleConfirm = () => {
        if (mode === 'reject' && !reason.trim()) return;
        onConfirm(reason);
    };

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title={config.title}
        >
            <div className="space-y-6 pt-2">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className={cn("w-20 h-20 rounded-[2.5rem] flex items-center justify-center transition-all animate-in zoom-in-50 duration-500", config.bg)}>
                        {config.icon}
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed px-4">
                            {config.message}
                        </p>
                    </div>
                </div>

                {mode === 'reject' && (
                    <div className="relative group">
                        <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors">
                            <IconMessage2 className="w-5 h-5" />
                        </div>
                        <textarea
                            autoFocus
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={t('type_rejection_reason', 'Type rejection reason here...')}
                            className="w-full h-36 pl-12 pr-6 py-4 rounded-3xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                        />
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <Button
                        disabled={isLoading || (mode === 'reject' && !reason.trim())}
                        onClick={handleConfirm}
                        className={cn(
                            "h-14 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-primary/10",
                            mode === 'reject' || mode === 'cancel' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-primary hover:bg-primary/90'
                        )}
                    >
                        {isLoading ? t('processing', 'Processing...') : config.confirmLabel}
                    </Button>
                    <Button
                        variant="ghost"
                        disabled={isLoading}
                        onClick={onClose}
                        className="h-14 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95"
                    >
                        {t('go_back', 'Go Back')}
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};
