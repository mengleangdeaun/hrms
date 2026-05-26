import { useState, useEffect, useCallback, memo } from 'react';
import { pwaToast } from '@/utils/pwaToast';
import { 
    IconCamera, IconMapPin, IconBellRinging, IconCheck, 
    IconLoader2, IconLockOpen, IconAlertCircle 
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import BottomSheet from '@/components/ui/bottom-sheet';
import GlassCard from './GlassCard';
import SectionHeader from './SectionHeader';
import { useAttendance } from '@/context/AttendanceContext';
import { subscribeUser, getSubscriptionStatus } from '@/lib/push-manager';
import { useTranslation } from 'react-i18next';
import { pwaFetch } from '@/lib/pwa-fetch';

interface SystemAccessBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    token?: string | null;
    prefs?: any;
    updatePref?: (key: any, value: any) => void | Promise<void>;
}

const SystemAccessBottomSheet = memo(({ isOpen, onClose, token: propToken, prefs, updatePref }: SystemAccessBottomSheetProps) => {
    const { t } = useTranslation('pwa');
    const { permissions, requestLocationPermission, checkPermissions } = useAttendance();
    
    const [requestingCam, setRequestingCam] = useState(false);
    const [requestingLoc, setRequestingLoc] = useState(false);
    const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(
        typeof Notification !== 'undefined' ? Notification.permission : 'default' as NotificationPermission
    );
    const [isPushSubscribed, setIsPushSubscribed] = useState(false);
    const [requestingNotifications, setRequestingNotifications] = useState(false);
    const [pwaInfo, setPwaInfo] = useState<any>(null);

    const token = propToken || localStorage.getItem('employee_auth_token');

    useEffect(() => {
        if (isOpen) {
            const fetchInfo = async () => {
                try {
                    const res = await pwaFetch('/api/pwa/info', { headers: { 'Accept': 'application/json' } });
                    if (res.ok) setPwaInfo(await res.json());
                } catch (e) {
                    console.error('Failed to fetch PWA info', e);
                }
            };
            fetchInfo();
            checkPermissions();
            
            const checkPush = async () => {
                const subscribed = await getSubscriptionStatus();
                setIsPushSubscribed(subscribed);
            };
            checkPush();
        }
    }, [isOpen, checkPermissions]);

    const handleRequestCamera = async () => {
        setRequestingCam(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            await checkPermissions(true);
            pwaToast.success(t('camera_access_granted', 'Camera access granted'));
            if (updatePref && prefs && !prefs.camera_enabled) {
                updatePref('camera_enabled', true);
            }
            return true;
        } catch (e) {
            pwaToast.error(t('camera_access_denied', 'Camera access denied'));
            return false;
        } finally {
            setRequestingCam(false);
        }
    };

    const handleRequestLocation = async () => {
        setRequestingLoc(true);
        try {
            const granted = await requestLocationPermission();
            if (granted) {
                pwaToast.success(t('location_access_granted', 'Location access granted'));
                await checkPermissions();
                if (updatePref && prefs && !prefs.location_enabled) {
                    updatePref('location_enabled', true);
                }
                return true;
            } else {
                throw new Error('Location access denied');
            }
        } catch (e) {
            pwaToast.error(t('location_access_denied', 'Location access denied or timed out'));
            return false;
        } finally {
            setRequestingLoc(false);
        }
    };

    const handleRequestNotifications = async () => {
        if (!('Notification' in window)) {
            pwaToast.error(t('notifications_not_supported', 'Notifications not supported in this browser'));
            return false;
        }

        if (Notification.permission === 'denied') {
            pwaToast.error(t('notifications_blocked_settings', 'Notifications are blocked by your browser. Please enable them in your browser settings and try again.'));
            setNotificationStatus('denied');
            return false;
        }

        setRequestingNotifications(true);
        try {
            const permission = await Notification.requestPermission();
            setNotificationStatus(permission);
            
            if (permission === 'granted') {
                if (pwaInfo?.vapid_public_key && token) {
                    try {
                        const subscribed = await subscribeUser(pwaInfo.vapid_public_key, token);
                        setIsPushSubscribed(subscribed);
                        pwaToast.success(t('notification_push_registered', 'Push alerts registered successfully'));
                    } catch (e) {
                        pwaToast.error(t('push_subscription_failed', 'Permissions granted, but failed to register for push alerts.'));
                    }
                }
                
                if (updatePref && prefs && !prefs.notifications_enabled) {
                    updatePref('notifications_enabled', true);
                }
                return true;
            }
            return false;
        } catch (error) {
            pwaToast.error(t('notification_request_error', 'Error requesting notifications'));
            return false;
        } finally {
            setRequestingNotifications(false);
        }
    };

    const isLocationGranted = permissions.location === 'granted';
    const isCameraGranted = permissions.camera === 'granted';

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title={t('system_access', 'System Access')}
        >
            <div className="space-y-4 pb-8 pt-2">
                <GlassCard className="divide-y bg-gray-50 dark:bg-gray-800 divide-gray-150 dark:divide-white/5 overflow-hidden">
                    {/* Location Row */}
                    <div 
                        onClick={isLocationGranted ? () => handleRequestLocation() : undefined}
                        className={cn(
                            "flex items-center justify-between p-4 px-5 transition-colors",
                            isLocationGranted && "hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-xl transition-colors", isLocationGranted ? "bg-emerald-500/10 text-emerald-500" : "bg-gray-100 dark:bg-gray-800 text-gray-400")}><IconMapPin size={18} /></div>
                            <div>
                                <p className="font-medium text-sm text-gray-900 dark:text-white">{t('location_service', 'Location Service')}</p>
                                <p className={cn("text-[10px] font-bold uppercase tracking-wider", isLocationGranted ? "text-emerald-500" : "text-gray-400")}>{isLocationGranted ? t('authorized', 'Authorized') : t('access_required', 'Access Required')}</p>
                            </div>
                        </div>
                        {!isLocationGranted ? (
                            <button onClick={(e) => { e.stopPropagation(); handleRequestLocation(); }} disabled={requestingLoc} className="text-[10px] font-black uppercase tracking-wider text-primary px-4 py-2 bg-primary/10 rounded-xl active:scale-95 disabled:opacity-50 transition-all">
                                {requestingLoc ? t('checking', 'Checking...') : t('enable', 'Enable')}
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                {requestingLoc && <IconLoader2 className="animate-spin text-primary/30" size={14} />}
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                    <IconCheck size={16} strokeWidth={3} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Camera Row */}
                    <div 
                        onClick={isCameraGranted ? () => handleRequestCamera() : undefined}
                        className={cn(
                            "flex items-center justify-between p-4 px-5 transition-colors",
                            isCameraGranted && "hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-xl transition-colors", isCameraGranted ? "bg-emerald-500/10 text-emerald-500" : "bg-gray-100 dark:bg-gray-800 text-gray-400")}><IconCamera size={18} /></div>
                            <div>
                                <p className="font-medium text-sm text-gray-900 dark:text-white">{t('camera_access', 'Scanner Camera')}</p>
                                <p className={cn("text-[10px] font-bold uppercase tracking-wider", isCameraGranted ? "text-emerald-500" : "text-gray-400")}>{isCameraGranted ? t('authorized', 'Authorized') : t('access_required', 'Access Required')}</p>
                            </div>
                        </div>
                        {!isCameraGranted ? (
                            <button onClick={(e) => { e.stopPropagation(); handleRequestCamera(); }} disabled={requestingCam} className="text-[10px] font-black uppercase tracking-wider text-primary px-4 py-2 bg-primary/10 rounded-xl active:scale-95 disabled:opacity-50 transition-all">
                                {requestingCam ? t('checking', 'Checking...') : t('enable', 'Enable')}
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                {requestingCam && <IconLoader2 className="animate-spin text-primary/30" size={14} />}
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                    <IconCheck size={16} strokeWidth={3} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notifications Row */}
                    <div 
                        onClick={notificationStatus === 'granted' ? () => handleRequestNotifications() : undefined}
                        className={cn(
                            "flex items-center justify-between p-4 px-5 transition-colors",
                            notificationStatus === 'granted' && "hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-xl transition-colors", notificationStatus === 'granted' ? "bg-emerald-500/10 text-emerald-500" : "bg-gray-100 dark:bg-gray-800 text-gray-400")}><IconBellRinging size={18} /></div>
                            <div>
                                <p className="font-medium text-sm text-gray-900 dark:text-white">{t('push_alerts', 'System Alerts')}</p>
                                <p className={cn("text-[10px] font-bold uppercase tracking-wider", notificationStatus === 'granted' ? "text-emerald-500" : "text-gray-400")}>{notificationStatus === 'granted' ? t('authorized', 'Authorized') : t('access_required', 'Access Required')}</p>
                            </div>
                        </div>
                        {notificationStatus !== 'granted' ? (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleRequestNotifications(); }} 
                                disabled={requestingNotifications}
                                className="text-[10px] font-black uppercase tracking-wider text-primary px-4 py-2 bg-primary/10 rounded-xl active:scale-95 disabled:opacity-50 transition-all"
                            >
                                {requestingNotifications ? t('authorizing', 'Authorizing...') : t('enable', 'Enable')}
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                {requestingNotifications && <IconLoader2 className="animate-spin text-primary/30" size={14} />}
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                    <IconCheck size={16} strokeWidth={3} />
                                </div>
                            </div>
                        )}
                    </div>
                </GlassCard>
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-[9px] leading-relaxed text-gray-500 dark:text-gray-400">
                        <span className="font-bold text-primary">{t('pro_tip', 'Pro Tip')}:</span> {t('permission_os_hint', 'Location and Camera are managed by your browser (Safari or Chrome). If "Enable" doesn\'t work, check your browser settings in your phone\'s Privacy menu.')}
                    </p>
                </div>
            </div>
        </BottomSheet>
    );
});

SystemAccessBottomSheet.displayName = 'SystemAccessBottomSheet';

export default SystemAccessBottomSheet;
