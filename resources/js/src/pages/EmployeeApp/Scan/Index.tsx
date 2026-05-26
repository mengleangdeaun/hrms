import { useTranslation } from 'react-i18next';
import { IconArrowLeft, IconAlertTriangle } from '@tabler/icons-react';
import PwaToaster from '@/components/ui/pwa/PwaToaster';

// ── Sub-components ────────────────────────────────────────────────────────────
import AccuracyIndicator     from './components/AccuracyIndicator';
import LocationGateScreen    from './components/LocationGateScreen';
import PermissionGuideModal  from './components/PermissionGuideModal';
import RadarVerificationCard from './components/RadarVerificationCard';
import ReasonSubmissionSheet from './components/ReasonSubmissionSheet';
import SuccessCard           from './components/SuccessCard';

// ── Hook ──────────────────────────────────────────────────────────────────────
import { useAttendanceScanner } from './hooks/useAttendanceScanner';

// ─────────────────────────────────────────────────────────────────────────────

export default function MobileEmployeeScan() {
    const { t } = useTranslation('pwa');

    const {
        status,
        message,
        distance,
        reasonRequired,
        reasonType,
        lateMinutes,
        reason,
        showPermissionGuide,
        needsPermission,
        requestLocationPermission,
        globalLocation,
        contextWarming,
        setReason,
        setReasonRequired,
        setShowPermissionGuide,
        submitWithReason,
        verifyAndClockIn,
        navigateToDashboard,
        refreshLocation,
    } = useAttendanceScanner();

    // ── Permission gate — shown before anything else ──────────────────────────
    // If the browser hasn't been asked yet, show an explicit request screen
    // rather than silently hanging in the GPS warmup state.
    if (needsPermission) {
        return <LocationGateScreen onRequest={requestLocationPermission} />;
    }

    // ── Full-screen success state ─────────────────────────────────────────────
    if (status === 'success') {
        return <SuccessCard />;
    }

    // ── Main scanning shell ───────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:20px_20px]">
            <div className="w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/40 border border-slate-100 dark:border-slate-800 relative overflow-hidden flex flex-col min-h-[500px] justify-between p-4">

                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={navigateToDashboard}
                        className="p-2 -ml-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <IconArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-4">
                        <AccuracyIndicator
                            isPrecise={globalLocation.isPrecise}
                            accuracy={globalLocation.accuracy}
                            onRefresh={refreshLocation}
                        />
                    </div>
                    {/* Spacer to keep header centred */}
                    <div className="w-8" />
                </div>

                {/* ── Low-accuracy banner ────────────────────────────────── */}
                {!globalLocation.isPrecise && status === 'idle' && !contextWarming && (
                    <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 animate-in slide-in-from-top-2">
                        <div className="flex items-start gap-3">
                            <IconAlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider">
                                    {t('low_accuracy', 'Low Location Accuracy')}
                                </h4>
                                <p className="text-[11px] text-amber-800/70 dark:text-amber-400/60 mt-1 leading-snug">
                                    {t(
                                        'precise_location_desc',
                                        'Your location is approximate. Please enable "Precise Location" in your phone settings or try moving to an open area.',
                                    )}
                                </p>
                                <button
                                    onClick={() => setShowPermissionGuide(true)}
                                    className="mt-2 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 hover:underline"
                                >
                                    {t('how_to_fix', 'How to fix this?')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Central card: idle / verifying / error ─────────────── */}
                <div className="flex-1 flex flex-col items-center justify-center gap-10">
                    <RadarVerificationCard
                        status={status}
                        message={message}
                        distance={distance}
                        reasonRequired={reasonRequired}
                        isPrecise={globalLocation.isPrecise}
                        isWarmingUp={contextWarming}
                        onCancel={navigateToDashboard}
                        onRetry={() => verifyAndClockIn()}
                    />
                </div>

                {/* ── Footer watermark ───────────────────────────────────── */}
                <div className="mt-10 opacity-40 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {t('endpoint_verification_active', 'Endpoint Verification Active')}
                    </p>
                </div>
            </div>

            {/* ── Reason sheet ───────────────────────────────────────────── */}
            <ReasonSubmissionSheet
                isOpen={reasonRequired}
                reasonType={reasonType}
                lateMinutes={lateMinutes}
                reason={reason}
                isVerifying={status === 'verifying'}
                onReasonChange={setReason}
                onSubmit={submitWithReason}
                onClose={() => setReasonRequired(false)}
            />

            {/* ── Permission guide ───────────────────────────────────────── */}
            <PermissionGuideModal
                isOpen={showPermissionGuide}
                onClose={() => setShowPermissionGuide(false)}
            />

            <PwaToaster />
        </div>
    );
}
