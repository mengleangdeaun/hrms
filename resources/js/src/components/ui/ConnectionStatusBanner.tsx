import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconWifiOff } from '@tabler/icons-react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useConnection } from '../../context/ConnectionContext';
import { useTranslation } from 'react-i18next';

export const ConnectionStatusBanner: React.FC = () => {
    const { isOnline } = useConnection();
    const location = useLocation();
    const { t } = useTranslation('pwa');

    // Pages that are allowed to work offline (PWA context)
    // We use .includes to handle cases where the app is hosted in a subdirectory
    const isOfflineFriendly = location.pathname.includes('/employee') || 
                              location.pathname.includes('/attendance');

    return (
        <AnimatePresence>
            {!isOnline && (
                <>
                    {/* Background Lock Overlay - Only for non-offline friendly pages */}
                    {!isOfflineFriendly && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-99 bg-gray-900/60 backdrop-blur-sm pointer-events-auto cursor-not-allowed"
                        />
                    )}

                    {/* Content Banner & Warning */}
                    <motion.div
                        initial={{ y: isOfflineFriendly ? 100 : -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: isOfflineFriendly ? 100 : -100, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={cn(
                            "left-0 right-0 z-100 max-w-lg mx-auto",
                            isOfflineFriendly ? "fixed bottom-[84px] px-4" : "fixed top-0"
                        )}
                    >
                        <div className={cn(
                            "px-4 py-3 flex items-center justify-center gap-4 shadow-2xl border transition-colors duration-500",
                            isOfflineFriendly 
                                ? "bg-linear-to-r from-red-600 via-red-700 to-red-600 border-red-400/20 rounded-2xl mb-4"
                                : "bg-linear-to-r from-amber-500 via-amber-600 to-amber-500 border-amber-400/20 border-b"
                        )}>
                            <div className="relative">
                                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                    <IconWifiOff size={18} className="text-white" />
                                </div>
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black uppercase tracking-wide text-white leading-tight">
                                    {isOfflineFriendly ? t('offline_mode_active', 'Offline Mode Active') : t('connection_lost', 'Connection Lost')}
                                </span>
                                <span className="text-[9px] font-bold text-white/70 uppercase tracking-wide opacity-80">
                                    {isOfflineFriendly ? t('work_saved_locally', 'Work will be saved locally') : t('ui_locked_desc', 'UI Locked to prevent data loss')}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Bottom Floating Hint - Only for non-offline friendly pages */}
                    {!isOfflineFriendly && (
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="fixed bottom-10 left-0 right-0 z-100 flex justify-center px-6 pointer-events-none"
                        >
                            <div className="bg-white/10 backdrop-blur-2xl border border-white/10 px-6 py-4 rounded-3xl shadow-2xl text-center max-w-xs">
                                <p className="text-[14px] font-black text-white uppercase tracking-wide mb-1">{t('waiting_for_network', 'Waiting for Network')}</p>
                                <p className="text-[12px] font-medium text-gray-300">{t('check_connection_desc', 'Please check your internet connection to resume work.')}</p>
                            </div>
                        </motion.div>   
                    )}
                </>
            )}
        </AnimatePresence>
    );
};
