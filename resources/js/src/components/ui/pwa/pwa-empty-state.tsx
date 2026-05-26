import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PwaEmptyData } from '../../illustrations/pwa/PwaEmptyData';
import { PwaEmptySearch } from '../../illustrations/pwa/PwaEmptySearch';
import { PwaEmptyBell } from '../../illustrations/pwa/PwaEmptyBell';

interface PwaEmptyStateProps {
    illustration?: 'data' | 'search' | 'notification' | 'calendar';
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
    };
    className?: string;
}

export const PwaEmptyState: React.FC<PwaEmptyStateProps> = ({
    illustration = 'data',
    title,
    description,
    action,
    className
}) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex flex-col items-center justify-center text-center px-8 min-h-[50vh]",
                className
            )}
        >
            {/* Illustration Slot */}
            <div className="mb-6">
                {illustration === 'data' && <PwaEmptyData />}
                {illustration === 'search' && <PwaEmptySearch />}
                {illustration === 'notification' && <PwaEmptyBell />}
                {illustration === 'calendar' && <PwaEmptyData />}
            </div>

            {/* Text Content */}
            <div className="space-y-2 max-w-[280px]">
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                    {title}
                </h3>
                <p className="text-sm font-medium text-gray-400 leading-relaxed">
                    {description}
                </p>
            </div>

            {/* Action CTA */}
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-10 px-4 py-2.5 bg-primary text-white rounded-full font-black text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center gap-3 shadow-sm shadow-primary/20 border border-primary/20 hover:bg-primary/90"
                >
                    {action.icon}
                    {action.label}
                </button>
            )}
        </motion.div>
    );
};
