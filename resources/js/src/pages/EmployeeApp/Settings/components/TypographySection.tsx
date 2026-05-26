import { memo } from 'react';
import { IconTypography, IconTextSize } from '@tabler/icons-react';
import { THEME_FONTS } from '@/constants/themeFonts';
import SectionHeader from './SectionHeader';
import GlassCard from './GlassCard';
import OptionButton from './OptionButton';

interface TypographySectionProps {
    prefs: any;
    t: any;
    fontSizeOptions: any[];
    updatePref: (key: any, value: any) => void | Promise<void>;
}

const TypographySection = memo(({ prefs, t, fontSizeOptions, updatePref }: TypographySectionProps) => (
    <section className="space-y-3">
        <SectionHeader title={t('typography', 'Typography')} icon={<IconTypography size={14} />} />
        <GlassCard className="p-4 space-y-4 overflow-hidden">
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-3">{t('font_family', 'Font Family')}</p>
                <div className="grid grid-cols-2 gap-2">
                    {THEME_FONTS.map((font) => (
                        <OptionButton 
                            key={font.value} 
                            active={prefs.font_family === font.value} 
                            onClick={() => updatePref('font_family', font.value)} 
                            className="py-3"
                        >
                            <span style={{ fontFamily: font.value }} className="text-xs">{font.label}</span>
                        </OptionButton>
                    ))}
                </div>
            </div>
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1">
                    <IconTextSize size={12} />{t('font_size', 'Font Size')}
                </p>
                <div className="grid grid-cols-3 gap-2">
                    {fontSizeOptions.map((size: any) => (
                        <OptionButton 
                            key={size.id} 
                            active={prefs.font_size === size.id} 
                            onClick={() => updatePref('font_size', size.id)} 
                            className="py-2.5"
                        >
                            {size.label}
                        </OptionButton>
                    ))}
                </div>
            </div>
        </GlassCard>
    </section>
));

TypographySection.displayName = 'TypographySection';

export default TypographySection;
