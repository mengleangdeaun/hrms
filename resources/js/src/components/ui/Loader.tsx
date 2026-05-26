import React from 'react';
import { cn } from '@/lib/utils';

interface LoaderProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    fullPage?: boolean;
    text?: string;
}

export const Loader: React.FC<LoaderProps> = ({
    className,
    size = 'md',
    fullPage = false,
    text = "KEEP DOING, KEEP CREATING..."
}) => {
    const sizeClasses = {
        sm: 'w-12 h-12',
        md: 'w-16 h-16',
        lg: 'w-24 h-24',
        xl: 'w-32 h-32',
    };

    const iconSizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
    };

    const chars = text.split('');
    const totalDuration = 1.8;

    const loaderContent = (
        <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
            <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
                {/* Single Rotating Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-primary/10 border-t-primary animate-spin" />

                {/* Center Favicon with Pulse */}
                <div className={cn("relative z-10 animate-pulse", iconSizeClasses[size])}>
                    <img
                        src="/icon-24.svg"
                        alt="Loading..."
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>

            {text && (
                <p className="text-[11px] font-black uppercase text-primary mt-2 flex items-center gap-[1px]">
                    {chars.map((char, i) => (
                        <span
                            key={i}
                            className="inline-block animate-[loader-char_2.4s_ease-in-out_infinite]"
                            style={{
                                animationDelay: `${(i / chars.length) * totalDuration}s`,
                                opacity: 0,
                            }}
                        >
                            {char === ' ' ? '\u00A0' : char}
                        </span>
                    ))}
                </p>
            )}
        </div>
    );

    if (fullPage) {
        return (
            <div className="screen_loader fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
                {loaderContent}
            </div>
        );
    }

    return loaderContent;
};

export default Loader;