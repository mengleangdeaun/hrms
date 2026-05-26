import { memo } from 'react';
import { IconInfoCircle, IconArchive, IconShieldCheck, IconFileText, IconChevronRight } from '@tabler/icons-react';
import SectionHeader from './SectionHeader';
import GlassCard from './GlassCard';

interface AboutSectionProps {
    pwaInfo: any;
    t: any;
    setDrawerOpen: (state: any) => void;
}

const AboutSection = memo(({ pwaInfo, t, setDrawerOpen }: AboutSectionProps) => (
    <section className="space-y-3">
        <SectionHeader title={t('about_app', 'About App')} icon={<IconInfoCircle size={14} />} />
        <GlassCard className="divide-y divide-gray-100 dark:divide-white/5 overflow-hidden">
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500"><IconArchive size={18} /></div>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{t('version', 'Version')}</p>
                </div>
                <p className="text-xs font-medium text-primary px-3 py-1.5 ">{pwaInfo?.version || '1.0.0'}</p>
            </div>
            <button 
                onClick={() => setDrawerOpen({ 
                    open: true, 
                    title: t('privacy_policy', 'Privacy Policy'), 
                    content: pwaInfo?.privacy_policy || t('no_policy', 'No privacy policy available.') 
                })} 
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:text-primary transition-colors"><IconShieldCheck size={18} /></div>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{t('privacy_policy', 'Privacy Policy')}</p>
                </div>
                <IconChevronRight size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
            </button>
            <button 
                onClick={() => setDrawerOpen({ 
                    open: true, 
                    title: t('terms_of_service', 'Terms of Service'), 
                    content: pwaInfo?.terms_of_service || t('no_terms', 'No terms of service available.') 
                })} 
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:text-primary transition-colors"><IconFileText size={18} /></div>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{t('terms_of_service', 'Terms of Service')}</p>
                </div>
                <IconChevronRight size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
            </button>
        </GlassCard>
    </section>
));

AboutSection.displayName = 'AboutSection';

export default AboutSection;
