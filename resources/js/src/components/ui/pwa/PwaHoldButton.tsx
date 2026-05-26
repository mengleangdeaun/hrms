import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { playHoldCompletedSound, playHoldTickSound, initAudio } from '@/lib/audio';

interface PwaHoldButtonProps {
    onComplete: () => void;
    holdDuration?: number;
    className?: string;
    activeClassName?: string;
    fillColor?: string;
    children: React.ReactNode;
    disabled?: boolean;
    activeLabel?: string;
    idleLabel?: string;
}

export const PwaHoldButton: React.FC<PwaHoldButtonProps> = ({
    onComplete,
    holdDuration = 1200,
    className,
    activeClassName,
    fillColor = "bg-primary/20",
    children,
    disabled,
    activeLabel,
    idleLabel
}) => {
    const { t } = useTranslation('pwa');
    const [holdProgress, setHoldProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);
    const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastTickRef = useRef(0);
    const progressStep = 20; // interval in ms

    useEffect(() => {
        if (isHolding && !disabled) {
            holdIntervalRef.current = setInterval(() => {
                setHoldProgress(prev => {
                    const next = prev + (progressStep / holdDuration) * 100;
                    
                    // Play subtle tick every ~80ms
                    const now = Date.now();
                    if (now - lastTickRef.current > 80) {
                        playHoldTickSound(next);
                        lastTickRef.current = now;
                    }

                    if (next >= 100) {
                        setIsHolding(false);
                        playHoldCompletedSound();
                        onComplete();
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
    }, [isHolding, disabled, onComplete, holdDuration]);

    const startHolding = () => {
        if (disabled) return;
        initAudio(); // Warm up context on user gesture
        playHoldTickSound(0); // Instant feedback
        lastTickRef.current = Date.now();
        setIsHolding(true);
    };

    const stopHolding = () => {
        setIsHolding(false);
    };

    return (
        <div className="space-y-2 w-full">
            <button
                className={cn(
                    "w-full h-14 rounded-full font-black overflow-hidden relative z-10 transition-all",
                    isHolding ? cn("scale-[1.02]", activeClassName) : "scale-100",
                    className
                )}
                onMouseDown={startHolding}
                onMouseUp={stopHolding}
                onMouseLeave={stopHolding}
                onTouchStart={startHolding}
                onTouchEnd={stopHolding}
            >
                <div className="relative z-20 pointer-events-none w-full h-full flex items-center justify-center">
                    {children}
                </div>

                {/* Progress Background */}
                <div
                    className={cn(
                        "absolute inset-0 pointer-events-none z-10 transition-colors duration-300",
                        isHolding ? fillColor : "bg-transparent"
                    )}
                    style={{
                        width: `${holdProgress}%`,
                        transition: holdProgress === 0 ? 'width 0.3s, background-color 0.3s' : 'none'
                    }}
                />
            </button>
            {(activeLabel || idleLabel) && (
                <div className="text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider animate-pulse">
                        {isHolding ? (activeLabel || t('hold_to_complete', 'Keep holding...')) : (idleLabel || t('hold_to_proceed', 'Hold to proceed'))}
                    </p>
                </div>
            )}
        </div>
    );
};
