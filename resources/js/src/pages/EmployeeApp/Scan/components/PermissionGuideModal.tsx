import { useTranslation } from 'react-i18next';
import { IconInfoCircle, IconSettings } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import BottomSheet from '@/components/ui/bottom-sheet';
import type { PermissionGuideModalProps } from '../types';

/**
 * A BottomSheet that renders step-by-step instructions for enabling
 * high-accuracy (Precise) location on iOS Safari and Android Chrome.
 */
export default function PermissionGuideModal({ isOpen, onClose }: PermissionGuideModalProps) {
    const { t } = useTranslation('pwa');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title={t('location_guide_title', 'Enable Precise Location')}>
            <div className="flex flex-col gap-6 py-2 text-left">
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t(
                        'location_guide_desc',
                        'For security and verification, we need precise location access. Please follow these steps to enable it on your device:',
                    )}
                </p>

                <div className="space-y-4">
                    {isIOS ? (
                        <div className="space-y-4">
                            {/* Step 1 */}
                            <div className="flex items-start gap-4">
                                <StepBadge n={1} />
                                <p className="text-sm font-medium">
                                    {t('ios_step_1', 'Open your iPhone')} <strong>{t('settings', 'Settings')}</strong>.
                                </p>
                            </div>
                            {/* Step 2 */}
                            <div className="flex items-start gap-4">
                                <StepBadge n={2} />
                                <p className="text-sm font-medium">
                                    {t('ios_step_2', 'Scroll down to')}{' '}
                                    <strong>{t('privacy_security', 'Privacy & Security')}</strong>{' '}
                                    {t('and_tap', 'and tap')}{' '}
                                    <strong>{t('location_services', 'Location Services')}</strong>.
                                </p>
                            </div>
                            {/* Step 3 */}
                            <div className="flex items-start gap-4">
                                <StepBadge n={3} />
                                <p className="text-sm font-medium">
                                    {t('ios_step_3', 'Find')} <strong>Safari</strong> {t('or', 'or')}{' '}
                                    <strong>SCCG ERP</strong> {t('in_the_list', 'in the list')}.
                                </p>
                            </div>
                            {/* Step 4 */}
                            <div className="flex items-start gap-4">
                                <StepBadge n={4} />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">
                                        {t(
                                            'ios_step_4',
                                            'Ensure "While Using the App" is selected and',
                                        )}{' '}
                                        <strong>{t('precise_location_toggle', 'Precise Location')}</strong>{' '}
                                        {t('is_switched_on', 'is switched ON')}.
                                    </p>
                                    {/* Visual toggle mockup */}
                                    <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                                        <div className="w-10 h-6 rounded-full bg-primary relative flex items-center justify-end px-1">
                                            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                                            {t('precise_location_toggle', 'Precise Location')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Step 1 */}
                            <div className="flex items-start gap-4">
                                <StepBadge n={1} />
                                <p className="text-sm font-medium">
                                    {t('android_step_1', 'Long press the App icon and tap')}{' '}
                                    <strong>{t('app_info', 'App Info')}</strong> ({' '}
                                    <IconInfoCircle className="inline w-4 h-4" /> ).
                                </p>
                            </div>
                            {/* Step 2 */}
                            <div className="flex items-start gap-4">
                                <StepBadge n={2} />
                                <p className="text-sm font-medium">
                                    {t('android_step_2', 'Tap on')} <strong>{t('permissions', 'Permissions')}</strong>{' '}
                                    {t('then', 'then')} <strong>{t('location', 'Location')}</strong>.
                                </p>
                            </div>
                            {/* Step 3 */}
                            <div className="flex items-start gap-4">
                                <StepBadge n={3} />
                                <p className="text-sm font-medium">
                                    {t('android_step_3', 'Switch on')}{' '}
                                    <strong>{t('use_precise_location', 'Use precise location')}</strong>.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Settings tip */}
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3">
                    <IconSettings className="w-5 h-5 text-slate-400" />
                    <p className="text-[11px] text-slate-500 font-medium">
                        {t(
                            'settings_tip',
                            'Tip: If you are using the browser, tap the (AA) or (i) icon in the address bar to check site settings.',
                        )}
                    </p>
                </div>

                <Button onClick={onClose} className="h-14 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest text-xs mt-4">
                    {t('got_it', 'Got it')}
                </Button>
            </div>
        </BottomSheet>
    );
}

// ─── Internal helper ──────────────────────────────────────────────────────────

function StepBadge({ n }: { n: number }) {
    return (
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm shrink-0">
            {n}
        </div>
    );
}
