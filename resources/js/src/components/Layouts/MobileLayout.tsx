import { useState, useEffect, Suspense } from 'react';
import BottomNav from '../ui/pwa/BottomNav';
import { ConnectionStatusBanner } from '../ui/ConnectionStatusBanner';
import { PullToRefresh } from '../ui/pwa/PullToRefresh';
import { applyEmployeePreferences, loadStoredPreferences } from '../../utils/employeePreferences';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Loader from '../ui/Loader';
import PwaToaster from '../ui/pwa/PwaToaster';

const MobileLayout = ({ children }: { children?: React.ReactNode }) => {
    const location = useLocation();

    // Apply saved preferences on every mount
    useEffect(() => {
        applyEmployeePreferences(loadStoredPreferences());
    }, []);

    const handleGlobalRefresh = async () => {
        // Dispatch a custom event that any page can listen to
        const event = new CustomEvent('pwa-refresh');
        window.dispatchEvent(event);
        
        // Add a small artificial delay for visual feedback if the event completes too fast
        await new Promise(resolve => setTimeout(resolve, 800));
    };

    return (
        <div className="text-black dark:text-white-dark h-[100dvh] flex flex-col bg-gray-50 dark:bg-[#060818] relative w-full max-w-lg mx-auto shadow-2xl overflow-hidden pwa-native no-scrollbar">
            {/* Limit max width to simulate phone layout on desktop */}
            <ConnectionStatusBanner />

            {/* Content Area */}
            <main className="flex-1 w-full overflow-hidden relative">
                <PullToRefresh onRefresh={handleGlobalRefresh}>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="h-full w-full"
                        >
                            <Suspense fallback={
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/20 dark:bg-[#060818]/20 backdrop-blur-[2px] z-50">
                                    <Loader />
                                </div>
                            }>
                                {children}
                            </Suspense>
                        </motion.div>
                    </AnimatePresence>
                </PullToRefresh>
            </main>

            {/* Fixed Bottom Navigation */}
            <BottomNav />

            {/* PWA Specific Toaster - Native look & feel */}
            <PwaToaster />
        </div>
    );
};

export default MobileLayout;
