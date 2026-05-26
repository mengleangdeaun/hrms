import { memo } from 'react';
import { IconMoon, IconSun, IconPalette } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import SectionHeader from './SectionHeader';
import GlassCard from './GlassCard';

interface DarkModeSectionProps {
    prefs: any;
    t: any;
    savingPrefs: boolean;
    updatePref: (key: any, value: any) => void | Promise<void>;
}

const DarkModeSection = memo(({ prefs, t, savingPrefs, updatePref }: DarkModeSectionProps) => (
    <section className="space-y-3">
        <SectionHeader title={t('appearance', 'Appearance')} icon={<IconPalette size={14} />} />
        <GlassCard className="p-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2 rounded-xl transition-colors",
                        prefs.dark_mode ? "bg-indigo-500/10 text-indigo-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                        {prefs.dark_mode ? <IconMoon size={18} /> : <IconSun size={18} />}
                    </div>
                    <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{t('dark_mode', 'Dark Mode')}</p>
                        <p className="text-[10px] text-gray-400">{savingPrefs ? t('syncing', 'Syncing...') : t('system_preference', 'System preference')}</p>
                    </div>
                </div>
                <Switch 
                    checked={prefs.dark_mode} 
                    onCheckedChange={(checked) => updatePref('dark_mode', checked)} 
                    disabled={savingPrefs} 
                />
            </div>
        </GlassCard>
    </section>
));

DarkModeSection.displayName = 'DarkModeSection';

export default DarkModeSection;
