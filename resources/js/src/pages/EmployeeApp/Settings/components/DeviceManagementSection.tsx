import { memo } from 'react';
import { IconShieldCheck, IconCircleCheckFilled, IconLoader2, IconAlertCircle } from '@tabler/icons-react';
import SectionHeader from './SectionHeader';
import GlassCard from './GlassCard';

interface DeviceManagementSectionProps {
    t: any;
    deviceId: string;
    status: 'bound' | 'pending' | 'unbound';
    rebindDevice: (force?: boolean) => Promise<boolean>;
}

const DeviceManagementSection = memo(({ t, deviceId, status, rebindDevice }: DeviceManagementSectionProps) => (
    <section className="space-y-3">
        <SectionHeader title={t('device_management', 'Device Management')} icon={<IconShieldCheck size={14} />} />
        <GlassCard className="p-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <IconShieldCheck size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{t('hardware_binding', 'Hardware Binding')}</p>
                            <div className="flex items-center">
                                {status === 'bound' ? (
                                    <IconCircleCheckFilled size={14} className="text-emerald-500" />
                                ) : status === 'pending' ? (
                                    <IconLoader2 size={14} className="text-amber-500 animate-spin" />
                                ) : (
                                    <IconAlertCircle size={14} className="text-gray-400" />
                                )}
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono">{deviceId ? `${deviceId.substring(0, 14)}...` : 'Unknown'}</p>
                    </div>
                </div>
                <button 
                    onClick={() => rebindDevice(true)} 
                    className="text-[10px] font-black uppercase tracking-wider text-primary px-4 py-2 bg-primary/10 rounded-xl active:scale-95 transition-all"
                >
                    {t('re_bind', 'RE-BIND')}
                </button>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20">
                <p className="text-[9px] text-blue-600 dark:text-blue-400 leading-relaxed">
                    {t('device_binding_desc', 'This account is locked to this device for security. If you change phones or clear storage, use the button above to register the new device.')}
                </p>
            </div>
        </GlassCard>
    </section>
));

DeviceManagementSection.displayName = 'DeviceManagementSection';

export default DeviceManagementSection;
