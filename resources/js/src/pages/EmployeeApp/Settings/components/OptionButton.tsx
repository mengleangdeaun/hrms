import { memo } from 'react';
import { cn } from '@/lib/utils';
import { IconCheck } from '@tabler/icons-react';

interface OptionButtonProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
}

const OptionButton = memo(({ active, onClick, children, className }: OptionButtonProps) => (
    <button
        onClick={onClick}
        className={cn(
            "relative flex items-center justify-center rounded-xl text-xs font-medium transition-all duration-200",
            "border focus:outline-none focus:ring-1 focus:ring-primary/40 focus:ring-offset-1 dark:focus:ring-offset-gray-900",
            active
                ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700",
            className
        )}
    >
        {children}
        {active && (
            <IconCheck className="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full text-primary p-0.5 shadow-md" />
        )}
    </button>
));

OptionButton.displayName = 'OptionButton';

export default OptionButton;
