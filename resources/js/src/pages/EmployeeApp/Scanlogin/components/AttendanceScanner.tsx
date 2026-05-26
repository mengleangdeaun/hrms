import { useTranslation, Trans } from 'react-i18next';
import {
    IconBolt,
    IconX,
    IconPhoto,
    IconCurrentLocation,
} from '@tabler/icons-react';
import { useAttendance } from '@/context/AttendanceContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useQrScanner } from '../hooks/useQrScanner';
import type { AttendanceScannerProps } from '../scanner.types';

/**
 * AttendanceScanner: Specialized for daily clock-ins.
 * Enforces GPS accuracy threshold (50m) and provides real-time feedback.
 *
 * All camera/QR/flash/zoom logic lives in useQrScanner.
 * GPS state comes from AttendanceContext via useAttendance.
 */

const ACCURACY_THRESHOLD = 100; // Matches backend allowed_radius default (100m)

export function AttendanceScanner({
    onScanSuccess,
    onClose,
    onFileScan,
    title = 'Attendance Scan',
    description = '',
}: AttendanceScannerProps) {
    const { t } = useTranslation('pwa');
    const { location, refreshLocation, isWarmingUp: isLocationWarming } = useAttendance();

    const {
        scannerId,
        isCameraReady,
        frameSize,
        isFlashOn,
        hasFlash,
        isAutoZooming,
        isQrDetected,
        toggleFlash,
        handleClose,
        handleFileChange,
    } = useQrScanner({ onScanSuccess, onClose, onFileScan });

    // GPS accuracy — inline because it's 2 lines, not worth a separate hook
    const currentAccuracy = location.accuracy ?? 999;
    const isAccurateEnough = currentAccuracy <= ACCURACY_THRESHOLD;

    const halfFrame = frameSize / 2;

    return (
<div className="fixed inset-0 z-[9999] bg-black overflow-hidden select-none touch-none">
  {/* The Scanner Lens - Full screen but centered */}
  <div id={scannerId} className="absolute inset-0 z-0 flex items-center justify-center [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />

  {/* Vignette effect for cinematic focus */}
  <div className="absolute inset-0 z-[3] pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]" />

  {/* Custom High-Precision Shaded Overlay for Perfect Alignment */}
  <div
    className="absolute inset-0 z-[5] bg-black/50 pointer-events-none backdrop-blur-[1px]"
    style={{
      clipPath: `polygon(0% 0%, 0% 100%, calc(50% - ${halfFrame}px) 100%, calc(50% - ${halfFrame}px) calc(50% - ${halfFrame}px), calc(50% + ${halfFrame}px) calc(50% - ${halfFrame}px), calc(50% + ${halfFrame}px) calc(50% + ${halfFrame}px), calc(50% - ${halfFrame}px) calc(50% + ${halfFrame}px), calc(50% - ${halfFrame}px) 100%, 100% 100%, 100% 0%)`,
    }}
  />

  {/* View Finder UI layer */}
  <div className="absolute inset-0 z-10 pointer-events-none">
    {/* Title & Description – at the top */}
    <div className="absolute left-0 right-0 text-center space-y-2 px-12" style={{ top: '5rem' }}>
      <h3 className="text-white text-3xl font-black tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
        {title}
      </h3>
      {description && (
        <p className="text-white/50 text-[14px] font-bold uppercase tracking-wider drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
          {description}
        </p>
      )}
      {!isAccurateEnough && (
          <p className="text-amber-400 text-[14px] font-bold mt-1 drop-shadow-md animate-pulse flex items-center justify-center gap-1">
              <Trans
                  i18nKey="gps_refresh_hint"
                  ns="pwa"
                  components={{ icon: <IconCurrentLocation size={14} className="inline-block" strokeWidth={2.5} /> }}
              />
          </p>
      )}
    </div>

    {/* Center the scanning frame and brackets */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative" style={{ width: `${frameSize}px`, height: `${frameSize}px` }}>
        {/* Scanning frame border – subtle definition */}
        <div className="absolute inset-0 border border-white/10 shadow-[inset_0_0_30px_rgba(255,255,255,0.02)] transition-all duration-500" />

        {/* Corner brackets – refined and responsive */}
        <div className={cn("absolute -top-0.5 -left-0.5 w-12 h-12 border-t-[3px] border-l-[3px] rounded-tl-sm transition-all duration-500", isAccurateEnough ? 'border-blue-400' : 'border-white/20')} />
        <div className={cn("absolute -top-0.5 -right-0.5 w-12 h-12 border-t-[3px] border-r-[3px] rounded-tr-sm transition-all duration-500", isAccurateEnough ? 'border-blue-400' : 'border-white/20')} />
        <div className={cn("absolute -bottom-0.5 -left-0.5 w-12 h-12 border-b-[3px] border-l-[3px] rounded-bl-sm transition-all duration-500", isAccurateEnough ? 'border-blue-400' : 'border-white/20')} />
        <div className={cn("absolute -bottom-0.5 -right-0.5 w-12 h-12 border-b-[3px] border-r-[3px] rounded-br-sm transition-all duration-500", isAccurateEnough ? 'border-blue-400' : 'border-white/20')} />

        {/* Laser Scan Line – dynamic color based on lock status */}
        {isCameraReady && (
          <div className={cn(
            "absolute left-2 right-2 h-[2px] z-30 animate-[scan_4s_linear_infinite] opacity-70 transition-all duration-500",
            isQrDetected
              ? "bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_25px_rgba(96,165,250,0.8)]"
              : isAccurateEnough
                ? "bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_25px_rgba(52,211,153,0.8)]"
                : "bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_20px_rgba(251,191,36,0.5)]"
          )} />
        )}

        {/* Auto-Zoom Indicator */}
        <AnimatePresence>
            {isAutoZooming && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -bottom-12 left-0 right-0 flex justify-center"
                >
                    <div className="bg-blue-500/20 border border-blue-400/30 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{t('auto_focusing', 'Auto-Focusing')}</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>

    {/* Footer Controls */}
    <div className="absolute bottom-0 left-0 right-0 h-44 flex flex-col items-center justify-center gap-8 pointer-events-auto pb-12">
      <div className="flex items-center gap-6">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id="qr-file-input"
          onChange={handleFileChange}
        />

        {hasFlash && (
          <button
            onClick={toggleFlash}
            aria-label="Toggle flash"
            className={cn(
              "w-14 h-14 rounded-full border backdrop-blur-md flex items-center justify-center transition-all duration-300 active:scale-95",
              isFlashOn
                ? 'bg-amber-400/90 border-amber-300 text-black shadow-[0_0_25px_rgba(251,191,36,0.4)]'
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            )}
          >
            <IconBolt size={24} strokeWidth={2.5} />
          </button>
        )}

        <button
          onClick={() => {
            if (onFileScan) {
              document.getElementById('qr-file-input-prop')?.click();
            } else {
              document.getElementById('qr-file-input')?.click();
            }
          }}
          aria-label="Upload image"
          className="w-14 h-14 bg-white/5 border border-white/10 text-white rounded-full backdrop-blur-md flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
        >
          <IconPhoto size={24} strokeWidth={2} />
          {onFileScan && (
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="qr-file-input-prop"
              onChange={onFileScan}
            />
          )}
        </button>

        {onClose && (
          <button
            onClick={handleClose}
            aria-label="Close scanner"
            className="w-14 h-14 bg-white/90 text-black rounded-full backdrop-blur-md flex items-center justify-center shadow-xl hover:bg-white active:scale-90 transition-all"
          >
            <IconX size={28} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* Accuracy Status & Refresh Split */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "px-5 py-2 rounded-full flex items-center gap-2.5 border backdrop-blur-md transition-all duration-500",
            isAccurateEnough
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.15)]'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          )}
        >
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isAccurateEnough ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            )}
          />
          <span className="text-[10px] font-black uppercase tracking-wider">
            {t('gps_accuracy', 'GPS Accuracy')}: {Math.round(currentAccuracy)}m {isAccurateEnough ? t('gps_locked', 'LOCKED') : t('gps_optimizing', 'OPTIMIZING')}
          </span>
        </div>

        <button
            onClick={() => refreshLocation()}
            disabled={isLocationWarming}
            className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90",
                "bg-white/10 border border-white/20 text-white backdrop-blur-md hover:bg-white/20",
                isLocationWarming && "animate-spin cursor-not-allowed opacity-50",
                !isAccurateEnough && !isLocationWarming && "animate-scale-pulse bg-amber-500/20 border-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
            )}
            title="Refresh GPS"
        >
            <IconCurrentLocation size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  </div>

  <style>{`
    @keyframes scan {
      0% { top: -2%; opacity: 0; }
      20% { opacity: 1; }
      80% { opacity: 1; }
      100% { top: 102%; opacity: 0; }
    }

    @keyframes scalePulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.30); }
    }
    .animate-scale-pulse {
      animation: scalePulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    /* FIX: Important for Library Overlays */
    #${scannerId} video {
      object-fit: cover !important;
      width: 100vw !important;
      height: 100vh !important;
    }

    /* Style the library's internal shaded region to match our theme */
    #${scannerId}__region {
      background: rgba(0, 0, 0, 0.6) !important;
      border: none !important;
    }

    /* Hide default library UI */
    #${scannerId} img[alt="Camera menu"],
    #${scannerId} button,
    #${scannerId} span {
      display: none !important;
    }
  `}</style>
</div>
    );
}
