import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { IconMapPin, IconLoader2 } from '@tabler/icons-react';

interface LocationGateScreenProps {
    /** Calls AttendanceContext.requestLocationPermission() — resolves true/false */
    onRequest: () => Promise<boolean>;
}

/**
 * Full-screen gate shown on the Scan page when the user arrives without
 * location permission ('prompt'). Instead of silently hanging, this screen
 * explains what is needed and lets the user consciously trigger the browser
 * dialog by tapping "Enable Location".
 *
 * After onRequest() resolves:
 *  - Granted  → AttendanceContext.startWatching() fires, globalLocation.lat
 *               becomes available, useAttendanceScanner's main effect proceeds.
 *  - Denied   → geoError is set to LOCATION_PERMISSION_DENIED, the parent
 *               unmounts this gate and shows the error card + PermissionGuideModal.
 */
export default function LocationGateScreen({ onRequest }: LocationGateScreenProps) {
    const { t } = useTranslation('pwa');
    const [isRequesting, setIsRequesting] = useState(false);

    const handleRequest = async () => {
        setIsRequesting(true);
        await onRequest();
        // After this resolves, AttendanceContext sets permissions.location.
        // The parent Index.tsx re-evaluates needsPermission via useAttendanceScanner
        // and either unmounts this screen (granted) or falls to the error state (denied).
        setIsRequesting(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:20px_20px]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                className="max-w-sm w-full text-center space-y-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-10 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-500/5"
            >
                {/* Animated GPS icon with expanding pulse rings */}
                <div className="relative flex items-center justify-center mx-auto w-32 h-32">
                    {[1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute inset-0 rounded-full border-2 border-primary/20"
                            animate={{ scale: [1, 1.4 + i * 0.25], opacity: [0.6, 0] }}
                            transition={{
                                duration: 2.2,
                                repeat: Infinity,
                                delay: i * 0.45,
                                ease: 'easeOut',
                            }}
                        />
                    ))}
                    <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10">
                        <IconMapPin size={40} className="text-primary" strokeWidth={1.5} />
                    </div>
                </div>

                {/* Headline & description */}
                <div className="space-y-3">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        {t('location_required_title', 'Location Access Required')}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed text-sm">
                        {t(
                            'location_required_desc',
                            'To verify you are at your workplace, we need access to your location. Your position is only used during clock-in and is never stored continuously.',
                        )}
                    </p>
                </div>

                {/* CTA */}
                <div className="space-y-3 pt-2">
                    <button
                        onClick={handleRequest}
                        disabled={isRequesting}
                        className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-70"
                    >
                        {isRequesting ? (
                            <>
                                <IconLoader2 size={18} className="animate-spin" />
                                {t('requesting_location', 'Requesting...')}
                            </>
                        ) : (
                            <>
                                <IconMapPin size={18} />
                                {t('enable_location', 'Enable Location')}
                            </>
                        )}
                    </button>
                    <p className="text-[10px] text-slate-400 font-medium leading-snug">
                        {t(
                            'location_privacy_note',
                            'Your location is only used to verify your check-in. We never track you in the background.',
                        )}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
