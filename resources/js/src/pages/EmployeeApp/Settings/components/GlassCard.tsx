import { memo } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const GlassCard = memo(({ children, className, ...props }: GlassCardProps) => (
    <div
        className={cn(
            "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-white/30 dark:border-white/5 shadow-sm",
            className
        )}
        {...props}
    >
        {children}
    </div>
));

GlassCard.displayName = 'GlassCard';

export default GlassCard;
