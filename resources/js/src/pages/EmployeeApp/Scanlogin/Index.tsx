import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AttendanceScanner } from './components/AttendanceScanner';
import { pwaToast } from '@/utils/pwaToast';
import { useAttendanceStatus } from '@/hooks/useAttendanceStatus';
import BottomSheet from '@/components/ui/bottom-sheet';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { AttendanceReasonEnforcer } from '@/components/ui/pwa/AttendanceReasonEnforcer';

export default function EmployeePwaScan() {
    const { t } = useTranslation('pwa');
    const navigate = useNavigate();
    const location = useLocation();
    const { proactiveStatus, state } = useAttendanceStatus();
    
    const [localReason, setLocalReason] = useState(location.state?.reason || '');
    const [showReasonSheet, setShowReasonSheet] = useState(false);

    useEffect(() => {
        if (proactiveStatus && (proactiveStatus.type === 'late' || proactiveStatus.type === 'early_departure') && !localReason) {
            setShowReasonSheet(true);
        } else {
            setShowReasonSheet(false);
        }
    }, [proactiveStatus, localReason]);

    const onScanSuccess = (decodedText: string) => {
        try {
            // Support raw parameter string or full URL
            const urlString = decodedText.includes('://') ? decodedText : `https://dummy.com?${decodedText}`;
            const url = new URL(urlString);
            const params = new URLSearchParams(url.search);

            const p = params.get('p');
            const s = params.get('s') || params.get('signature');
            const b = params.get('b') || params.get('branch_code'); 
            const payload = params.get('payload'); // legacy personal login
            
            // 1. Check for Branch Scan (Attendance)
            if ((p || b) && s) {
                const reasonQuery = localReason ? `&reason=${encodeURIComponent(localReason)}` : '';
                const branchParam = p ? `p=${p}` : `branch_code=${b}`;
                const target = `/attendance/scan?${branchParam}&s=${s}${reasonQuery}`;
                console.log('🎯 Redirecting to attendance scan:', target);
                navigate(target, { replace: true });
                return;
            }

            // 2. Check for Personal Login QR (Identity)
            if (p || payload || decodedText.length > 50) {
                const finalPayload = p || payload || decodedText;
                console.log('👤 Redirecting to login:', finalPayload);
                navigate(`/employee/login?payload=${finalPayload}`, { replace: true });
                return;
            }

            // 3. Check for Ultra-Short Branch Code (Raw String)
            if (decodedText.length < 15 && /^[A-Z0-9_-]+$/i.test(decodedText)) {
                const reasonQuery = localReason ? `&reason=${encodeURIComponent(localReason)}` : '';
                const target = `/attendance/scan?branch_code=${decodedText}${reasonQuery}&signature=STATIC`;
                console.log('🏁 Ultra-short branch scan detected:', target);
                navigate(target, { replace: true });
                return;
            }

            console.warn("⚠️ Unrecognized QR format:", decodedText);
            pwaToast.error("Unrecognized QR format");
        } catch (err) {
            console.error("Scan processing error:", err);
            pwaToast.error("Failed to process QR code");
        }
    };

    if (state === 'done') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-white">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                     <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" color="none" fill="none" viewBox="0 0 24 24"><path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" className="text-emerald-500"></path></svg>
                </div>
                <h3 className="text-xl font-black mb-2 uppercase tracking-tight">{t('shift_completed', 'Shift Completed')}</h3>
                <p className="text-gray-400 text-sm mb-6">{t('you_have_completed_today_shift', 'You have completed your shift for today.')}</p>
                <button 
                    onClick={() => navigate('/employee/dashboard')}
                    className="px-8 py-3 bg-white text-black font-black rounded-2xl uppercase text-xs tracking-widest"
                >
                    {t('back_to_dashboard', 'Back to Dashboard')}
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            {!showReasonSheet ? (
                <AttendanceScanner 
                    onScanSuccess={onScanSuccess}
                    onClose={() => navigate('/employee/dashboard')}
                    title={t('attendance_scan', 'Scan Attendance')}
                    description={t('align_qr_within_frame', 'Align the branch QR code within the frame')}
                />
            ) : (
                <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center text-white">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                         <IconAlertTriangle className="text-orange-500" size={32} />
                    </div>
                    <h3 className="text-xl font-black mb-2">Reason Required</h3>
                    <p className="text-gray-400 text-sm mb-6">Please provide a reason for this {proactiveStatus?.type === 'late' ? 'late arrival' : 'early departure'}.</p>
                </div>
            )}

            <BottomSheet 
                isOpen={showReasonSheet} 
                onClose={() => navigate('/employee/dashboard')}
                title={proactiveStatus?.type === 'late' ? t('late_arrival', 'Late Arrival') : t('early_departure', 'Early Departure')}
            >
                <AttendanceReasonEnforcer 
                    onProceed={(reason) => {
                        setLocalReason(reason);
                        setShowReasonSheet(false);
                    }}
                />
            </BottomSheet>
        </div>
    );
}
