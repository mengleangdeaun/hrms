import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface PwaActionButtonProps extends HTMLMotionProps<'button'> {
    icon: React.ReactNode;
    variant?: 'solid' | 'outline' | 'soft' | 'ghost' | 'danger';
    isActive?: boolean;
    badge?: string | number;
}

export const PwaActionButton = forwardRef<HTMLButtonElement, PwaActionButtonProps>(
    ({ icon, variant = 'soft', isActive = false, className, badge, ...props }, ref) => {
        const variantStyles = {
            solid: 'bg-primary text-white shadow-lg shadow-primary/20',
            outline: cn(
                'border-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md transition-all',
                isActive ? 'border-primary text-primary' : 'border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400'
            ),
            soft: cn(
                'transition-all',
                isActive ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800/80 text-gray-600 dark:text-gray-300'
            ),
            ghost: 'bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300',
            danger: 'bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40'
        };

        return (
            <motion.button
                ref={ref}
                type="button"
                whileTap={{ scale: 0.9 }}
                className={cn(
                    'relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all',
                    variantStyles[variant as keyof typeof variantStyles],
                    className
                )}
                {...props}
            >
                <span className="[&>svg]:w-[18px] [&>svg]:h-[18px]">
                    {icon}
                </span>

                {badge !== undefined && badge !== null && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 border-2 border-white dark:border-gray-800 text-[8px] font-black text-white flex items-center justify-center rounded-full animate-in zoom-in duration-300">
                        {badge}
                    </span>
                )}
            </motion.button>
        );
    }
);

PwaActionButton.displayName = 'PwaActionButton';
