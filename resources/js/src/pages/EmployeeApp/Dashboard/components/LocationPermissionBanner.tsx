import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { IconMapPin, IconAlertTriangle, IconX } from '@tabler/icons-react';
import { useAttendance } from '@/context/AttendanceContext';
import { useState } from 'react';

/**
 * Shown on the Dashboard when location permission has not yet been granted.
 * Educates the employee about WHY we need location BEFORE they scan, so the
 * browser dialog appears in a trusted context rather than mid-scan.
 *
 * Renders nothing when permission is already granted.
 * Dismissible per-session via sessionStorage.
 */
export function LocationPermissionBanner() {
    const { t } = useTranslation('pwa');
    const { permissions, requestLocationPermission } = useAttendance();

    const DISMISS_KEY = 'location_banner_dismissed';
    const [dismissed, setDismissed] = useState(
        () => localStorage.getItem(DISMISS_KEY) === '1'
    );
    const [requesting, setRequesting] = useState(false);

    // Nothing to show when already granted
    if (permissions.location === 'granted') return null;
    if (dismissed && permissions.location !== 'denied') return null;

    const isDenied = permissions.location === 'denied';

    const handleEnable = async () => {
        setRequesting(true);
        await requestLocationPermission();
        setRequesting(false);
        // If still denied after request, keep banner; if granted, context updates and banner unmounts
    };

    const handleDismiss = () => {
        localStorage.setItem(DISMISS_KEY, '1');
        setDismissed(true);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                className={`
                    relative rounded-2xl p-4 border flex items-start gap-4 overflow-hidden
                    ${isDenied
                        ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20'
                        : 'bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/20'
                    }
                `}
            >
                {/* Icon */}
                <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                    ${isDenied
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        : 'bg-primary/10 text-primary'
                    }
                `}>
                    {isDenied
                        ? <IconAlertTriangle size={22} />
                        : <motion.div
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            <IconMapPin size={22} />
                          </motion.div>
                    }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className={`text-xs font-black uppercase tracking-wider ${
                        isDenied ? 'text-amber-800 dark:text-amber-300' : 'text-primary'
                    }`}>
                        {isDenied
                            ? t('location_blocked', 'Location Blocked')
                            : t('enable_gps_title', 'Enable GPS for Clock-In')
                        }
                    </p>
                    <p className={`text-[11px] font-medium mt-0.5 leading-snug ${
                        isDenied
                            ? 'text-amber-700/80 dark:text-amber-400/70'
                            : 'text-slate-500 dark:text-slate-400'
                    }`}>
                        {isDenied
                            ? t('location_blocked_desc', 'Location access is blocked. Please enable it in your browser or device settings to record attendance.')
                            : t('enable_gps_desc', 'Tap below to allow location access. This is required to verify your workplace when scanning attendance.')
                        }
                    </p>

                    {!isDenied && (
                        <button
                            onClick={handleEnable}
                            disabled={requesting}
                            className="mt-3 px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full active:scale-95 transition-all disabled:opacity-60"
                        >
                            {requesting
                                ? t('requesting', 'Requesting...')
                                : t('enable_location', 'Enable Location')
                            }
                        </button>
                    )}
                </div>

                {/* Dismiss (only for prompt state, not denied) */}
                {!isDenied && (
                    <button
                        onClick={handleDismiss}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0 -mt-0.5"
                    >
                        <IconX size={16} />
                    </button>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
