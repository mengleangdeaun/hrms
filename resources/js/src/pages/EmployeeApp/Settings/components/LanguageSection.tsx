import { memo } from 'react';
import { IconLanguage } from '@tabler/icons-react';
import SectionHeader from './SectionHeader';
import GlassCard from './GlassCard';
import OptionButton from './OptionButton';

interface LanguageSectionProps {
    prefs: any;
    t: any;
    i18n: any;
    languageOptions: any[];
    updatePref: (key: any, value: any) => void | Promise<void>;
}

const LanguageSection = memo(({ prefs, t, i18n, languageOptions, updatePref }: LanguageSectionProps) => (
    <section className="space-y-3">
        <SectionHeader title={t('language', 'Language')} icon={<IconLanguage size={14} />} />
        <GlassCard className="p-4 overflow-hidden">
            <div className="grid grid-cols-3 gap-2">
                {languageOptions.map((lang: any) => (
                    <OptionButton 
                        key={lang.id} 
                        active={(prefs.locale || i18n.language) === lang.id} 
                        onClick={() => updatePref('locale', lang.id)} 
                        className="py-2.5"
                    >
                        {lang.label}
                    </OptionButton>
                ))}
            </div>
        </GlassCard>
    </section>
));

LanguageSection.displayName = 'LanguageSection';

export default LanguageSection;
