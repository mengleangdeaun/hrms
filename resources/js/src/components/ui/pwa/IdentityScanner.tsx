import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { 
    IconBolt, 
    IconBoltOff, 
    IconX, 
    IconRefresh, 
    IconPhoto, 
    IconSwitchHorizontal,
    IconCameraOff,
    IconLoader2
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface IdentityScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onClose?: () => void;
    onFileScan?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    title?: string;
    description?: string;
}

/**
 * IdentityScanner: Optimized for speed and single-purpose identity verification.
 * Stripped of GPS/Context logic for immediate initialization.
 * UI aligned with AttendanceScanner for system-wide consistency.
 */
export function IdentityScanner({ 
    onScanSuccess, 
    onClose, 
    onFileScan,
    title = "Identity Lens",
    description = ""
}: IdentityScannerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [hasFlash, setHasFlash] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const isScanningRef = useRef(false);
    const onScanSuccessRef = useRef(onScanSuccess);
    
    const [cameras, setCameras] = useState<Array<{ id: string, label: string }>>([]);
    const [currentCameraId, setCurrentCameraId] = useState<string | null>(null);
    const [scannerId] = useState(() => `identity-scanner-${Math.random().toString(36).slice(2, 11)}`);
    const [frameSize, setFrameSize] = useState(260);

    useEffect(() => {
        onScanSuccessRef.current = onScanSuccess;
    }, [onScanSuccess]);

    const playSuccessSound = useCallback(() => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.1);
        } catch (e) {}
    }, []);

    const handleScanSuccess = useCallback((decodedText: string) => {
        if (isScanningRef.current) return;
        isScanningRef.current = true;
        playSuccessSound();
        if (navigator.vibrate) navigator.vibrate(50);
        onScanSuccessRef.current(decodedText);
    }, [playSuccessSound]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !html5QrCodeRef.current) return;

        const scanner = html5QrCodeRef.current;
        const wasScanning = scanner.getState() === Html5QrcodeScannerState.SCANNING;
        const toastId = toast.loading("Processing image...");

        try {
            // Must stop camera scanning before scanning a file in html5-qrcode
            if (wasScanning) {
                await scanner.stop();
            }

            const decodedText = await scanner.scanFileV2(file, false);
            toast.success("QR Code detected", { id: toastId });
            handleScanSuccess(decodedText.decodedText);
        } catch (err) {
            toast.error("No valid QR code found in this image", { id: toastId });
            // Restart camera if it was previously running
            if (wasScanning) {
                startScanner({ facingMode: "environment" });
            }
        } finally {
            // Clear input so same file can be picked again
            e.target.value = '';
        }
    };

    const checkCapabilities = useCallback(async () => {
        if (!html5QrCodeRef.current) return;
        try {
            if (html5QrCodeRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
                const capabilities = html5QrCodeRef.current.getRunningTrackCapabilities();
                setHasFlash(!!(capabilities as any).torch);
            }
        } catch (e) {
            setHasFlash(false);
        }
    }, []);

    const startScanner = useCallback(async (cameraIdOrFacingMode: string | { facingMode: string }) => {
        if (!html5QrCodeRef.current) return;
        
        setIsCameraReady(false);
        setError(null);

        const width = window.innerWidth;
        const height = window.innerHeight;
        const size = Math.min(width, height) * 0.7;
        const qrboxSize = Math.floor(Math.min(size, 280));
        setFrameSize(qrboxSize);

        const config = {
            fps: 60,
            aspectRatio: 1.0, 
            disableFlip: true,
            useBarCodeDetectorIfSupported: true,
            videoConstraints: {
                facingMode: "environment",
                focusMode: "continuous",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        try {
            if (html5QrCodeRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
                await html5QrCodeRef.current.stop();
            }

            await html5QrCodeRef.current.start(
                cameraIdOrFacingMode,
                config,
                handleScanSuccess,
                () => {}
            );
            
            setIsCameraReady(true);
            checkCapabilities();
        } catch (err: any) {
            setError(err?.message || "Scanner Failure");
        }
    }, [handleScanSuccess, checkCapabilities]);

    useEffect(() => {
        const scanner = new Html5Qrcode(scannerId, { verbose: false });
        html5QrCodeRef.current = scanner;

        const init = async () => {
            startScanner({ facingMode: "environment" });
        };

        const timer = setTimeout(init, 50);
        return () => {
            clearTimeout(timer);
            const scanner = html5QrCodeRef.current;
            if (scanner) {
                const stopAndClear = async () => {
                    try {
                        if (scanner.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
                            await scanner.stop();
                        }
                    } catch (e) {
                        // Ignore stop errors on unmount
                    } finally {
                        scanner.clear();
                        // Final hardware kill for mobile browsers
                        document.querySelectorAll('video').forEach(v => {
                            const s = v.srcObject as MediaStream;
                            if (s) s.getTracks().forEach(t => t.stop());
                        });
                    }
                };
                stopAndClear();
            }
        };
    }, [scannerId, startScanner]);

    const toggleFlash = async () => {
        if (!html5QrCodeRef.current || !hasFlash) return;
        try {
            const newState = !isFlashOn;
            await html5QrCodeRef.current.applyVideoConstraints({
                advanced: [{ torch: newState } as any]
            });
            setIsFlashOn(newState);
        } catch (e) {
            console.error("Flash failed", e);
        }
    };

    const handleClose = useCallback(async () => {
        const scanner = html5QrCodeRef.current;
        
        const releaseHardware = () => {
            // Aggressively kill all tracks in the document to satisfy mobile browsers
            document.querySelectorAll('video').forEach(video => {
                const stream = (video as HTMLVideoElement).srcObject as MediaStream;
                if (stream) {
                    stream.getTracks().forEach(track => {
                        track.stop();
                        track.enabled = false;
                    });
                    (video as HTMLVideoElement).srcObject = null;
                    video.pause();
                }
            });
        };

        try {
            if (scanner && scanner.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
                await scanner.stop();
                scanner.clear();
            }
        } catch (e) {
            console.warn("Scanner stop failed, forcing hardware release:", e);
        } finally {
            releaseHardware();
            if (onClose) onClose();
        }
    }, [onClose]);

    const halfFrame = frameSize / 2;

    return (
<div className="fixed inset-0 z-[9999] bg-black overflow-hidden select-none touch-none">
  {/* The Lens */}
  <div id={scannerId} className="absolute inset-0 z-0 flex items-center justify-center [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />

  {/* Vignette – cinematic depth */}
  <div className="absolute inset-0 z-[3] pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]" />

  {/* Custom Shaded Overlay */}
  <div
    className="absolute inset-0 z-[5] bg-black/50 pointer-events-none backdrop-blur-[1px]"
    style={{
      clipPath: `polygon(0% 0%, 0% 100%, calc(50% - ${halfFrame}px) 100%, calc(50% - ${halfFrame}px) calc(50% - ${halfFrame}px), calc(50% + ${halfFrame}px) calc(50% - ${halfFrame}px), calc(50% + ${halfFrame}px) calc(50% + ${halfFrame}px), calc(50% - ${halfFrame}px) calc(50% + ${halfFrame}px), calc(50% - ${halfFrame}px) 100%, 100% 100%, 100% 0%)`,
    }}
  />

  {/* View Finder UI */}
  <div className="absolute inset-0 z-10 pointer-events-none">
    {/* Title & Description – top aligned */}
    <div className="absolute left-0 right-0 text-center space-y-2 px-12" style={{ top: '5rem' }}>
      <h3 className="text-white text-2xl font-black tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
        {title}
      </h3>
      {description ? (
        <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
          {description}
        </p>
      ) : (
        <div className="flex items-center justify-center gap-2 opacity-50">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70">
            Native Lens Processing
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        </div>
      )}
    </div>

    {/* Centered scanning frame */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative" style={{ width: `${frameSize}px`, height: `${frameSize}px` }}>
        {/* Subtle frame outline */}
        <div className="absolute inset-0 border border-white/10 shadow-[inset_0_0_30px_rgba(255,255,255,0.02)]" />

        {/* Corner brackets – shadows removed for a sharper, cleaner frame */}
        <div className="absolute -top-0.5 -left-0.5 w-12 h-12 border-t-[3px] border-l-[3px] border-blue-400 rounded-tl-sm" />
        <div className="absolute -top-0.5 -right-0.5 w-12 h-12 border-t-[3px] border-r-[3px] border-blue-400 rounded-tr-sm" />
        <div className="absolute -bottom-0.5 -left-0.5 w-12 h-12 border-b-[3px] border-l-[3px] border-blue-400 rounded-bl-sm" />
        <div className="absolute -bottom-0.5 -right-0.5 w-12 h-12 border-b-[3px] border-r-[3px] border-blue-400 rounded-br-sm" />

        {/* Laser scan line – visible when camera is ready */}
        {isCameraReady && (
          <div className="absolute left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_25px_rgba(96,165,250,0.8)] z-30 animate-[scan_4s_linear_infinite] opacity-70" />
        )}
      </div>
    </div>

    {/* Footer Controls – modern glass */}
    <div className="absolute bottom-0 left-0 right-0 h-44 flex flex-col items-center justify-center gap-8 pointer-events-auto pb-12">
      <div className="flex items-center gap-6">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id="identity-file-input"
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
              document.getElementById('identity-file-input-prop')?.click();
            } else {
              document.getElementById('identity-file-input')?.click();
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
              id="identity-file-input-prop"
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

      {/* Status pill – refined glass */}
      <div className="px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
        <span className="text-[10px] font-black uppercase tracking-wider text-white/40">
          Fast Identity Check
        </span>
      </div>
    </div>
  </div>

  {/* Error Overlay – modern card style */}
  {error && (
    <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center space-y-8">
      <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center text-red-500 backdrop-blur-sm border border-red-500/20">
        <IconCameraOff size={40} />
      </div>
      <p className="text-white/80 text-sm font-medium max-w-xs leading-relaxed">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-10 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-gray-100 active:scale-95 transition-all"
      >
        Retry Connection
      </button>
    </div>
  )}

  <style>{`
    @keyframes scan { 
      0% { top: -2%; opacity: 0; } 
      20% { opacity: 1; }
      80% { opacity: 1; }
      100% { top: 102%; opacity: 0; } 
    }
    
    #${scannerId} video {
      object-fit: cover !important;
      width: 100vw !important;
      height: 100vh !important;
    }
    
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

