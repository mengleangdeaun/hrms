import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentSaleShift, useOpenSaleShift, useCloseSaleShift } from '@/hooks/useSaleDashboardData';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const SmartShiftButton = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    
    // Find primary branch or fallback to first
    const activeBranch = user?.branches?.find(b => b.pivot?.is_primary) || user?.branches?.[0];
    const branchId = activeBranch?.id || user?.employee?.branch_id;
    const branchName = activeBranch?.name || user?.branches?.find(b => b.id === branchId)?.name;

    const { data: shiftData, isLoading } = useCurrentSaleShift(branchId);
    const openShiftMutation = useOpenSaleShift();
    const closeShiftMutation = useCloseSaleShift();

    // Hold interaction state
    const [holdProgress, setHoldProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);
    const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const holdDuration = 1200; // ms to complete hold
    const progressStep = 20; // interval in ms

    const handleAction = async () => {
        if (!branchId) {
            toast.error(t('no_branch_assigned', 'No branch assigned to your account'));
            return;
        }

        if (shiftData?.shift) {
            // Close shift
            toast.promise(closeShiftMutation.mutateAsync(shiftData.shift.id), {
                loading: t('closing_shift', 'Closing shift...'),
                success: t('shift_closed_success', 'Shift closed successfully'),
                error: (err) => err.message || t('shift_closed_error', 'Failed to close shift')
            });
        } else {
            // Open shift
            toast.promise(openShiftMutation.mutateAsync(branchId), {
                loading: t('opening_shift', 'Opening shift...'),
                success: t('shift_opened_success', 'Shift opened successfully'),
                error: (err) => err.message || t('shift_opened_error', 'Failed to open shift')
            });
        }
    };

    useEffect(() => {
        if (isHolding) {
            holdIntervalRef.current = setInterval(() => {
                setHoldProgress(prev => {
                    const next = prev + (progressStep / holdDuration) * 100;
                    if (next >= 100) {
                        setIsHolding(false);
                        handleAction();
                        return 0;
                    }
                    return next;
                });
            }, progressStep);
        } else {
            if (holdIntervalRef.current) {
                clearInterval(holdIntervalRef.current);
            }
            // Rapidly reset progress
            const resetInterval = setInterval(() => {
                setHoldProgress(prev => {
                    if (prev <= 0) {
                        clearInterval(resetInterval);
                        return 0;
                    }
                    return Math.max(0, prev - 10);
                });
            }, 10);
        }

        return () => {
            if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        };
    }, [isHolding]);

    if (!branchId) return null;

    const isOpen = !!shiftData?.shift;
    const isProcessing = openShiftMutation.isPending || closeShiftMutation.isPending;

    const startHolding = () => {
        if (isProcessing || isLoading) return;
        setIsHolding(true);
    };

    const stopHolding = () => {
        setIsHolding(false);
    };

    return (
        <div className="flex items-center gap-2">
            {branchName && (
                <span className="text-[14px] font-semibold uppercase tracking-wider hidden md:inline-block p-2 px-4 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60">
                    {branchName}
                </span>
            )}
            <button
                type="button"
                onMouseDown={startHolding}
                onMouseUp={stopHolding}
                onMouseLeave={stopHolding}
                onTouchStart={startHolding}
                onTouchEnd={stopHolding}
                disabled={isProcessing || isLoading}
                className={`group relative p-2 rounded-full transition-all duration-300 overflow-hidden ${
                    isOpen 
                        ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20' 
                        : 'bg-white-light/40 dark:bg-dark/40 text-slate-500 hover:text-primary'
                } ${isProcessing ? 'animate-pulse' : ''} ${isHolding ? 'scale-110 shadow-lg' : 'scale-100 shadow-none'}`}
                title={isOpen ? t('hold_to_close', 'Hold to Close Shift') : t('hold_to_open', 'Hold to Open Shift')}
            >
                {/* Progress Background */}
                <div 
                    className={`absolute inset-0 transition-opacity duration-300 ${isHolding || holdProgress > 0 ? 'opacity-100' : 'opacity-0'} ${isOpen ? 'bg-rose-500/30' : 'bg-emerald-500/30'}`}
                    style={{ 
                        clipPath: `inset(${100 - holdProgress}% 0 0 0)`,
                    }}
                />
                
                {/* Fully filled indicator animation when close to completion */}
                <div 
                    className={`absolute inset-0 bg-emerald-500 transition-opacity duration-150 ${holdProgress >= 99 ? 'opacity-100 scale-150' : 'opacity-0 scale-100'}`}
                />

                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" height="20" color="none" fill="none" viewBox="0 0 24 24"
                    className={`relative z-10 transition-transform duration-300 ${isHolding ? 'scale-90' : 'scale-100'}`}
                >
                    <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"></circle>
                    <path d="M12 6V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                    <path d="M15 9.5C15 8.11929 13.6569 7 12 7C10.3431 7 9 8.11929 9 9.5C9 10.8807 10.3431 12 12 12C13.6569 12 15 13.1193 15 14.5C15 15.8807 13.6569 17 12 17C10.3431 17 9 15.8807 9 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                </svg>
                
                {/* Active indicator dot */}
                {isOpen && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-black animate-pulse z-20" />
                )}
            </button>
        </div>
    );
};

export default SmartShiftButton;
