import React from 'react';
import { IconX, IconChevronRight } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TopBannerProps {
    id: number;
    title: string;
    pwa_title?: string;
    pwa_show_title?: boolean;
    has_pwa_action?: boolean;
    type: 'info' | 'success' | 'warning' | 'danger';
    actionLabel?: string;
    onAction?: () => void;
    onDismiss: () => void;
}

export const TopBanner: React.FC<TopBannerProps> = ({
    title,
    pwa_title,
    pwa_show_title,
    has_pwa_action,
    type,
    actionLabel,
    onAction,
    onDismiss,
}) => {
    const bgColors = {
        info: 'bg-blue-600',
        success: 'bg-green-600',
        warning: 'bg-amber-500',
        danger: 'bg-red-600',
    };

    const displayTitle = pwa_title || title;

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={cn("relative overflow-hidden text-white shadow-md z-50", bgColors[type])}
        >
            <div className="flex items-center justify-between px-4 py-2.5">
                <div 
                    className={cn("flex-1 text-xs font-bold truncate flex items-center gap-2", (onAction && has_pwa_action !== false) && "cursor-pointer")}
                    onClick={() => has_pwa_action !== false && onAction?.()}
                >
                    {pwa_show_title !== false && <span className="truncate">{displayTitle}</span>}
                    {has_pwa_action !== false && actionLabel && (
                        <span className="flex items-center shrink-0 bg-white/20 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
                            {actionLabel}
                            <IconChevronRight className="w-3 h-3 ml-0.5" />
                        </span>
                    )}
                </div>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDismiss();
                    }}
                    className="p-1 hover:bg-white/10 rounded ml-2 shrink-0 transition-colors"
                >
                    <IconX className="w-4 h-4" />
                </button>
            </div>
            
            {/* Subtle progress/attention line */}
            <div className="h-0.5 w-full bg-black/10">
                <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="h-full bg-white/30 origin-left"
                />
            </div>
        </motion.div>
    );
};
