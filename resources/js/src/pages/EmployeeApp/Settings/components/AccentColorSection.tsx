import { memo } from 'react';
import { IconPalette, IconCheck, IconPlus } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { THEME_COLORS } from '@/constants/themeColors';
import GlassCard from './GlassCard';

interface AccentColorSectionProps {
    prefs: any;
    t: any;
    updatePref: (key: any, value: any) => void | Promise<void>;
}

const AccentColorSection = memo(({ prefs, t, updatePref }: AccentColorSectionProps) => {
    const activeColor = THEME_COLORS.find(c => c.value === prefs.color_theme)?.hex || (prefs.color_theme?.startsWith('#') ? prefs.color_theme : '#3b82f6');
    const isCustomSelected = prefs.color_theme?.startsWith('#');
    const customHex = isCustomSelected ? prefs.color_theme : '#6b7280';

    return (
        <section className="space-y-3">
            <GlassCard className="p-5 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <IconPalette className="w-4 h-4 text-primary opacity-70" />
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{t('accent_colors', 'Accent Colors')}</p>
                    </div>
                    <div 
                        className="px-2 py-1 rounded-full text-[10px] font-bold text-white shadow-sm transition-all duration-200" 
                        style={{ backgroundColor: activeColor }}
                    >
                        Preview
                    </div>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                {THEME_COLORS.map((color) => {
                    const isSelected = prefs.color_theme === color.value;
                    return (
                        <button 
                            key={color.value} 
                            onClick={() => updatePref('color_theme', color.value)} 
                            className="group relative flex flex-col items-center gap-2 rounded-xl"
                        >
                            <div className={cn(
                                "w-14 h-14 rounded-2xl transition-all duration-200 ease-out hover:scale-105 active:scale-95 shadow-sm", 
                                isSelected && "ring-2 ring-white dark:ring-gray-900 ring-offset-2 ring-offset-primary/20 shadow-md"
                            )}>
                                <div className="w-full h-full rounded-2xl relative overflow-hidden" style={{ backgroundColor: color.hex }}>
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50 rounded-2xl" />
                                    {isSelected && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-2xl">
                                            <IconCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className={cn(
                                "text-[9px] font-medium uppercase tracking-wide", 
                                isSelected ? "text-primary font-bold" : "text-gray-400"
                            )}>
                                {color.label}
                            </span>
                        </button>
                    );
                })}

                {/* Custom Color Selector */}
                <div className="group relative flex flex-col items-center gap-2 rounded-xl">
                    <label className={cn(
                        "w-14 h-14 rounded-2xl transition-all duration-200 ease-out hover:scale-105 active:scale-95 shadow-sm relative overflow-hidden cursor-pointer", 
                        isCustomSelected && "ring-2 ring-white dark:ring-gray-900 ring-offset-2 ring-offset-primary/20 shadow-md"
                    )}>
                        <input 
                            type="color"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            value={customHex}
                            onChange={(e) => updatePref('color_theme', e.target.value)}
                        />
                        <div className="w-full h-full rounded-2xl relative" style={{ backgroundColor: customHex }}>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50 rounded-2xl" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] rounded-2xl">
                                {isCustomSelected ? (
                                    <IconCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
                                ) : (
                                    <IconPlus className="w-5 h-5 text-white/80" strokeWidth={2.5} />
                                )}
                            </div>
                        </div>
                    </label>
                    <span className={cn(
                        "text-[9px] font-medium uppercase tracking-wide", 
                        isCustomSelected ? "text-primary font-bold" : "text-gray-400"
                    )}>
                        {t('custom', 'Custom')}
                    </span>
                </div>
            </div>
            <p className="text-[9px] text-gray-400 text-center mt-5">
                {t('accent_hint', 'Accent color appears on buttons, links, and highlights')}
            </p>
        </GlassCard>
    </section>
);
});

AccentColorSection.displayName = 'AccentColorSection';

export default AccentColorSection;
