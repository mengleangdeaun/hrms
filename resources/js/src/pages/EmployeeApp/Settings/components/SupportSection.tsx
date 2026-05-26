import { memo } from 'react';
import { 
    IconHeadset, IconPhone, IconBrandTelegram, IconShieldCheck, 
    IconMessage2, IconChevronRight 
} from '@tabler/icons-react';
import SectionHeader from './SectionHeader';
import GlassCard from './GlassCard';
import { toast } from 'sonner';

interface SupportSectionProps {
    t: any;
    setFeedbackOpen: (open: boolean) => void;
    onOpenPermissions?: () => void;
}

const SupportSection = memo(({ t, setFeedbackOpen, onOpenPermissions }: SupportSectionProps) => (
    <section className="space-y-3">
        <SectionHeader title={t('support_community', 'Support & Community')} icon={<IconHeadset size={14} />} />
        <GlassCard className="divide-y divide-gray-100 dark:divide-white/5 overflow-hidden">
            <a href="tel:0975450540" className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><IconPhone size={18} /></div>
                    <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{t('call_support', 'Call Support')}</p>
                        <p className="text-[10px] text-gray-400">097 545 0540</p>
                    </div>
                </div>
                <IconChevronRight size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
            </a>
            <a href="https://t.me/mengleang_deaun" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#229ED9]/10 text-[#229ED9]"><IconBrandTelegram size={18} /></div>
                    <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{t('telegram_support', 'Telegram Support')}</p>
                        <p className="text-[10px] text-gray-400">@mengleang_deaun</p>
                    </div>
                </div>
                <IconChevronRight size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
            </a>
            
            {onOpenPermissions && (
                <button 
                    onClick={onOpenPermissions}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><IconShieldCheck size={18} /></div>
                        <div>
                            <p className="font-medium text-left text-sm text-gray-900 dark:text-white">{t('sync_permissions', 'Fix System Permissions')}</p>
                            <p className="text-[10px] text-gray-400">{t('fix_permissions_desc', 'Force OS to show Camera & Location in settings')}</p>
                        </div>
                    </div>
                    <IconChevronRight size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
                </button>
            )}

            <button onClick={() => setFeedbackOpen(true)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500"><IconMessage2 size={18} /></div>
                    <div>
                        <p className="font-medium text-left text-sm text-gray-900 dark:text-white">{t('app_feedback', 'App Feedback')}</p>
                        <p className="text-[10px] text-gray-400">{t('help_us_description', 'Tell us about bugs or suggestions')}</p>
                    </div>
                </div>
                <IconChevronRight size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
            </button>
        </GlassCard>
    </section>
));

SupportSection.displayName = 'SupportSection';

export default SupportSection;
