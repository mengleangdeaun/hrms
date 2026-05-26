import { useTranslation } from 'react-i18next';
import { IconCurrentLocation, IconLoader2 } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import type { AccuracyIndicatorProps } from '../types';

/**
 * Renders a small pill badge showing whether the GPS is precise or approximate,
 * displays the error margin in metres, and offers a manual refresh button
 * when precision is low.
 */
export default function AccuracyIndicator({ isPrecise, accuracy, onRefresh }: AccuracyIndicatorProps) {
    const { t } = useTranslation('pwa');

    return (
        <div className="flex items-center gap-2">
            <div
                className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors',
                    isPrecise
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                        : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
                )}
            >
                <IconCurrentLocation size={12} className={cn(!isPrecise && 'animate-pulse')} />
                {isPrecise ? t('precise', 'Precise') : t('approximate', 'Approximate')}
            </div>

            {accuracy && (
                <span className="text-[10px] font-bold text-slate-400">±{Math.round(accuracy)}m</span>
            )}

            {!isPrecise && (
                <button
                    onClick={onRefresh}
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                    title={t('refresh_location', 'Refresh Location')}
                >
                    <IconLoader2 size={14} className="hover:animate-spin" />
                </button>
            )}
        </div>
    );
}
