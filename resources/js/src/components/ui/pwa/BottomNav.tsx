import React, { useState, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '@/context/NotificationContext';
import { useAttendanceStatus } from '@/hooks/useAttendanceStatus';
import { cn } from '@/lib/utils';
import { AttendanceReasonEnforcer } from './AttendanceReasonEnforcer';
import BottomSheet from '../bottom-sheet';

const BottomNav = () => {
    const { t } = useTranslation('pwa');
    const location = useLocation();
    const navigate = useNavigate();
    const { unreadCount } = useNotifications();
    const { proactiveStatus, state } = useAttendanceStatus();

    const [showReasonSheet, setShowReasonSheet] = useState(false);

    // Haptic feedback utility
    const triggerHaptic = useCallback(() => {
        if (typeof window !== 'undefined' && window.navigator?.vibrate) {
            window.navigator.vibrate(10); // Short vibration for tactile feedback
        }
    }, []);

    const handleScanClick = (e: React.MouseEvent) => {
        if (state === 'done') {
            e.preventDefault();
            return;
        }
        if (proactiveStatus?.type === 'late' || proactiveStatus?.type === 'early_departure') {
            e.preventDefault();
            setShowReasonSheet(true);
        }
    };

    // Wrapper for tab clicks to add haptic feedback
    const handleTabClick = (tab: any) => (e: React.MouseEvent) => {
        triggerHaptic();
        if (tab.onClick) {
            tab.onClick(e);
        }
    };

    const tabs = [
        { name: t('home', 'Home'), path: '/employee/dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" color="none" fill="none" viewBox="0 0 24 24"><path opacity="0.5" d="M2 12.2039C2 9.91549 2 8.77128 2.5192 7.82274C3.0384 6.87421 3.98695 6.28551 5.88403 5.10813L7.88403 3.86687C9.88939 2.62229 10.8921 2 12 2C13.1079 2 14.1106 2.62229 16.116 3.86687L18.116 5.10812C20.0131 6.28551 20.9616 6.87421 21.4808 7.82274C22 8.77128 22 9.91549 22 12.2039V13.725C22 17.6258 22 19.5763 20.8284 20.7881C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.7881C2 19.5763 2 17.6258 2 13.725V12.2039Z" stroke="currentColor" strokeWidth="1.5"></path><path d="M15 18H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path></svg> },
        { name: t('calendar', 'Calendar'), path: '/employee/calendar', icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" color="none" fill="none" viewBox="0 0 24 24"><path d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12V14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14V12Z" stroke="currentColor" strokeWidth="1.5"></path><path opacity="0.5" d="M7 4V2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path><path opacity="0.5" d="M17 4V2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path><path opacity="0.5" d="M2.5 9H21.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path><path d="M18 17C18 17.5523 17.5523 18 17 18C16.4477 18 16 17.5523 16 17C16 16.4477 16.4477 16 17 16C17.5523 16 18 16.4477 18 17Z" fill="currentColor"></path><path d="M18 13C18 13.5523 17.5523 14 17 14C16.4477 14 16 13.5523 16 13C16 12.4477 16.4477 12 17 12C17.5523 12 18 12.4477 18 13Z" fill="currentColor"></path><path d="M13 17C13 17.5523 12.5523 18 12 18C11.4477 18 11 17.5523 11 17C11 16.4477 11.4477 16 12 16C12.5523 16 13 16.4477 13 17Z" fill="currentColor"></path><path d="M13 13C13 13.5523 12.5523 14 12 14C11.4477 14 11 13.5523 11 13C11 12.4477 11.4477 12 12 12C12.5523 12 13 12.4477 13 13Z" fill="currentColor"></path><path d="M8 17C8 17.5523 7.55228 18 7 18C6.44772 18 6 17.5523 6 17C6 16.4477 6.44772 16 7 16C7.55228 16 8 16.4477 8 17Z" fill="currentColor"></path><path d="M8 13C8 13.5523 7.55228 14 7 14C6.44772 14 6 13.5523 6 13C6 12.4477 6.44772 12 7 12C7.55228 12 8 12.4477 8 13Z" fill="currentColor"></path></svg> },
        { 
            name: t('scan', 'Scan'), 
            path: '/employee/scan', 
            onClick: handleScanClick,
            disabled: state === 'done',
            icon: (
                <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" color="none" fill="none" viewBox="0 0 24 24"><path d="M5.5 15.5C5.5 14.5572 5.5 14.0858 5.79289 13.7929C6.08579 13.5 6.55719 13.5 7.5 13.5H8.5C9.44281 13.5 9.91421 13.5 10.2071 13.7929C10.5 14.0858 10.5 14.5572 10.5 15.5V16.5C10.5 17.4428 10.5 17.9142 10.2071 18.2071C9.91421 18.5 9.44281 18.5 8.5 18.5C7.08579 18.5 6.37868 18.5 5.93934 18.0607C5.5 17.6213 5.5 16.9142 5.5 15.5Z" stroke="currentColor" strokeWidth="1.5"></path><path d="M5.5 8.5C5.5 7.08579 5.5 6.37868 5.93934 5.93934C6.37868 5.5 7.08579 5.5 8.5 5.5C9.44281 5.5 9.91421 5.5 10.2071 5.79289C10.5 6.08579 10.5 6.55719 10.5 7.5V8.5C10.5 9.44281 10.5 9.91421 10.2071 10.2071C9.91421 10.5 9.44281 10.5 8.5 10.5H7.5C6.55719 10.5 6.08579 10.5 5.79289 10.2071C5.5 9.91421 5.5 9.44281 5.5 8.5Z" stroke="currentColor" strokeWidth="1.5"></path><path d="M13.5 15.5C13.5 14.5572 13.5 14.0858 13.7929 13.7929C14.0858 13.5 14.5572 13.5 15.5 13.5H16.5C17.4428 13.5 17.9142 13.5 18.2071 13.7929C18.5 14.0858 18.5 14.5572 18.5 15.5C18.5 16.9142 18.5 17.6213 18.0607 18.0607C17.6213 18.5 16.9142 18.5 15.5 18.5C14.5572 18.5 14.0858 18.5 13.7929 18.2071C13.5 17.9142 13.5 17.4428 13.5 16.5V15.5Z" stroke="currentColor" strokeWidth="1.5"></path><path d="M13.5 7.5C13.5 6.55719 13.5 6.08579 13.7929 5.79289C14.0858 5.5 14.5572 5.5 15.5 5.5C16.9142 5.5 17.6213 5.5 18.0607 5.93934C18.5 6.37868 18.5 7.08579 18.5 8.5C18.5 9.44281 18.5 9.91421 18.2071 10.2071C17.9142 10.5 17.4428 10.5 16.5 10.5H15.5C14.5572 10.5 14.0858 10.5 13.7929 10.2071C13.5 9.91421 13.5 9.44281 13.5 8.5V7.5Z" stroke="currentColor" strokeWidth="1.5"></path><path opacity="0.5" d="M22 14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path><path opacity="0.5" d="M10 22C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path><path opacity="0.5" d="M10 2C6.22876 2 4.34315 2 3.17157 3.17157C2 4.34315 2 6.22876 2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path><path opacity="0.5" d="M14 2C17.7712 2 19.6569 2 20.8284 3.17157C22 4.34315 22 6.22876 22 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path></svg>
                    {proactiveStatus && (
                        <span className={cn(
                            "absolute -top-1 -right-1 w-2.5 h-2.5 border-2 border-white dark:border-[#0e1726] rounded-full animate-pulse shadow-sm",
                            proactiveStatus.type === 'late' ? 'bg-amber-500' : 
                            proactiveStatus.type === 'early_departure' ? 'bg-blue-500' : 
                            proactiveStatus.type === 'off' ? 'bg-gray-400' : 'bg-red-500'
                        )} />
                    )}
                    {!proactiveStatus && state === 'ready' && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-2 border-white dark:border-[#0e1726] rounded-full bg-emerald-500 shadow-sm" />
                    )}
                </div>
            )
        },
        { 
            name: t('noti', 'Noti'), 
            path: '/employee/notifications', 
            icon: (
                <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" color="none" fill="none" viewBox="0 0 24 24"><path d="M18.7491 9.70957V9.00497C18.7491 5.13623 15.7274 2 12 2C8.27256 2 5.25087 5.13623 5.25087 9.00497V9.70957C5.25087 10.5552 5.00972 11.3818 4.5578 12.0854L3.45036 13.8095C2.43882 15.3843 3.21105 17.5249 4.97036 18.0229C9.57274 19.3257 14.4273 19.3257 19.0296 18.0229C20.789 17.5249 21.5612 15.3843 20.5496 13.8095L19.4422 12.0854C18.9903 11.3818 18.7491 10.5552 18.7491 9.70957Z" stroke="currentColor" strokeWidth="1.5"></path><path opacity="0.5" d="M7.5 19C8.15503 20.7478 9.92246 22 12 22C14.0775 22 15.845 20.7478 16.5 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path><path opacity="0.5" d="M12 6V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path></svg>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 border-2 border-white dark:border-[#0e1726] text-[9px] font-black flex items-center justify-center rounded-full text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            )
        },
        { name: t('profile', 'Profile'), path: '/employee/profile', icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" color="none" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"></circle><path opacity="0.5" d="M20 17.5C20 19.9853 20 22 12 22C4 22 4 19.9853 4 17.5C4 15.0147 7.58172 13 12 13C16.4183 13 20 15.0147 20 17.5Z" stroke="currentColor" strokeWidth="1.5"></path></svg> },
    ];

    return (
        <>
            <div className="w-full bg-white dark:bg-[#0e1726] border-t border-gray-100 dark:border-gray-800 z-50 p-3 pt-0 shrink-0 pb-6 pb-safe">
                <div className="flex justify-around items-end h-16 px-2">
                    {tabs.map((tab: any) => {
                        const isActive = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/');
                        return (
                            <Link
                                key={tab.name}
                                to={tab.path}
                                onClick={handleTabClick(tab)}
                                className={cn(
                                    "flex flex-col items-center justify-center flex-1 h-full gap-1 relative",
                                    tab.disabled && "opacity-40 grayscale pointer-events-none"
                                )}
                            >
                                {/* Top highlight */}
                                {isActive && (
                                    <div className="absolute top-0 left-0 w-full h-[3px] bg-primary transition-all duration-300" />
                                )}

                                <div
                                    className={`mt-3 transition-all duration-200 ${
                                        isActive ? 'text-primary scale-110' : 'text-gray-400 dark:text-gray-500'
                                    }`}
                                >
                                    {tab.icon}
                                </div>

                                <span
                                    className={`text-[10px] font-bold tracking-wide transition-colors ${
                                        isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
                                    }`}
                                >
                                    {tab.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <BottomSheet 
                isOpen={showReasonSheet} 
                onClose={() => setShowReasonSheet(false)}
                title={proactiveStatus?.type === 'late' ? t('late_arrival', 'Late Arrival') : t('early_departure', 'Early Departure')}
            >
                <AttendanceReasonEnforcer 
                    onProceed={(reason) => {
                        triggerHaptic(); // Haptic feedback when proceeding to scan
                        setShowReasonSheet(false);
                        navigate('/employee/scan', { state: { reason } });
                    }}
                    onCancel={() => setShowReasonSheet(false)}
                />
            </BottomSheet>
        </>
    );
};

export default BottomNav;