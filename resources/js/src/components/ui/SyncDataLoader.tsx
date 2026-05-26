import React from 'react';
import { useTranslation } from 'react-i18next';

interface SyncDataLoaderProps {
    show: boolean;
    message?: string;
    hint?: string;
}

const SyncDataLoader: React.FC<SyncDataLoaderProps> = ({ 
    show, 
    message, 
    hint 
}) => {
    const { t } = useTranslation();

    if (!show) return null;

    return (
        <div className="absolute inset-0 z-[100] bg-white/70 dark:bg-black/70 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
            {/* Animated loader */}
            <div className="relative flex items-center justify-center">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                {/* subtle glow ring */}
                <div className="absolute h-20 w-20 rounded-full bg-primary/10 blur-xl animate-pulse"></div>
            </div>

            {/* Text content */}
            <div className="mt-6 flex flex-col items-center gap-1 text-center">
                <span className="text-sm font-semibold text-foreground uppercase tracking-widest">
                    {message || t('please_wait', 'Synchronizing data')}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                    {hint || t('loading_hint', 'This may take a few seconds')}
                </span>
            </div>

            {/* Optional progress bar illusion */}
            <div className="mt-6 w-40 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-primary animate-[loadingBar_1.2s_infinite]"></div>
            </div>
        </div>
    );
};

export default SyncDataLoader;
