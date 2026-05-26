import { Toaster as SonnerToaster } from 'sonner';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';

export default function PwaToaster() {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    
    return (
        <SonnerToaster
            position="top-center"
            offset="16px" 
            toastOptions={{
                unstyled: true,
                classNames: {
                    toast: 'group w-[calc(100%-32px)] max-w-[400px] flex items-center gap-3 p-3 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] pointer-events-auto [&_[data-icon]]:p-2 [&_[data-icon]]:rounded-full [&_[data-icon]]:flex [&_[data-icon]]:items-center [&_[data-icon]]:justify-center',
                    title: 'text-sm font-semibold text-gray-900 dark:text-white leading-tight font-google_sans',
                    description: 'text-xs text-gray-500 dark:text-gray-400 font-google_sans',
                    actionButton: 'bg-primary text-white',
                    cancelButton: 'bg-gray-100 dark:bg-gray-800',
                    success: '[&_[data-icon]]:!text-emerald-500 [&_[data-icon]]:!bg-emerald-500/15',
                    error: '[&_[data-icon]]:!text-rose-500 [&_[data-icon]]:!bg-rose-500/15',
                    info: '[&_[data-icon]]:!text-blue-500 [&_[data-icon]]:!bg-blue-500/15',
                    warning: '[&_[data-icon]]:!text-amber-500 [&_[data-icon]]:!bg-amber-500/15',
                },
            }}
        />
    );
}
