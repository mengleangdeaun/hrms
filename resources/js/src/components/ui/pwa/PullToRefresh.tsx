import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IconLoader2, IconArrowUp, IconChevronUp } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PullToRefreshProps {
    children: React.ReactNode;
    onRefresh: () => Promise<void>;
    disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ children, onRefresh, disabled = false }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const lastY = useRef(0);
    
    const THRESHOLD = 80;
    const MAX_PULL = 150;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (disabled || isRefreshing) return;
        
        const scrollTop = containerRef.current?.scrollTop || 0;
        if (scrollTop > 0) return;

        startY.current = e.touches[0].pageY;
        lastY.current = startY.current;
        setIsDragging(true);
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        setShowScrollTop(scrollTop > 400);
    };

    const scrollToTop = () => {
        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Use native event listener for touchmove to ensure it's not passive
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onTouchMoveNative = (e: TouchEvent) => {
            if (!isDragging || disabled || isRefreshing) return;

            const currentY = e.touches[0].pageY;
            const diff = currentY - startY.current;

            if (diff > 0) {
                // Apply resistance
                const resistance = 1 - (Math.min(diff, MAX_PULL) / MAX_PULL) * 0.5;
                const distance = Math.min(diff * resistance, MAX_PULL);
                
                setPullDistance(distance);
                
                // Prevent default only if we are actually pulling down at the top
                if (e.cancelable) {
                    e.preventDefault();
                }
            } else {
                // If they pull up, we stop the pull-to-refresh logic
                if (pullDistance > 0) {
                    setPullDistance(0);
                    setIsDragging(false);
                }
            }
        };

        container.addEventListener('touchmove', onTouchMoveNative, { passive: false });
        return () => container.removeEventListener('touchmove', onTouchMoveNative);
    }, [isDragging, disabled, isRefreshing, pullDistance]);

    const handleTouchEnd = useCallback(async () => {
        if (!isDragging) return;
        setIsDragging(false);

        if (pullDistance >= THRESHOLD) {
            setIsRefreshing(true);
            setPullDistance(THRESHOLD);
            
            if (navigator.vibrate) navigator.vibrate(10);
            
            try {
                await onRefresh();
            } catch (error) {
                console.error("Refresh failed:", error);
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
    }, [isDragging, pullDistance, onRefresh]);

    // Global touch end listener to handle cases where touch ends outside the container
    useEffect(() => {
        const handleGlobalTouchEnd = () => {
            if (isDragging) {
                handleTouchEnd();
            }
        };
        window.addEventListener('touchend', handleGlobalTouchEnd);
        return () => window.removeEventListener('touchend', handleGlobalTouchEnd);
    }, [isDragging, handleTouchEnd]);

    return (
        <div className="relative h-full w-full overflow-hidden flex flex-col">
            {/* Refresh Indicator Layer */}
            <div 
                className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-50"
                style={{ 
                    top: -40, 
                    height: 40, 
                    transform: `translateY(${Math.min(pullDistance, THRESHOLD + 20)}px)`,
                    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)'
                }}
            >
                <div className="bg-white dark:bg-gray-800 rounded-full w-10 h-10 border border-white/10 flex items-center justify-center">
                    {isRefreshing ? (
                        <IconLoader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                        <div
                            style={{ 
                                transform: `rotate(${pullDistance >= THRESHOLD ? 180 : 0}deg)`,
                                transition: 'transform 0.2s ease'
                            }}
                            className={pullDistance >= THRESHOLD ? "text-primary" : "text-gray-400"}
                        >
                            <IconChevronUp className="w-5 h-5 rotate-180" />
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollable Content */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="flex-1 w-full overflow-y-auto overflow-x-hidden no-scrollbar"
                style={{ 
                    transform: `translateY(${pullDistance}px)`,
                    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)',
                    touchAction: pullDistance > 0 ? 'none' : 'auto',
                    WebkitOverflowScrolling: 'touch'
                }}
            >
                {children}
            </div>

            {/* Scroll to Top Button */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 20 }}
                        onClick={scrollToTop}
                        className="absolute ring-1 ring-primary/10 bottom-6 right-6 z-60 bg-primary/10 backdrop-blur-sm text-primary p-3 rounded-full shadow-2xl shadow-primary/40 active:scale-90 transition-all border border-white/20"
                    >
                        <IconArrowUp size={20} strokeWidth={2} />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};
