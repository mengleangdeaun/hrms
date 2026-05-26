import { useState, useCallback, useRef, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { toast } from 'sonner';
import { playSuccessSound } from '../utils/scannerSounds';

interface UseQrScannerOptions {
    onScanSuccess: (decodedText: string) => void;
    onClose?: () => void;
    onFileScan?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface UseQrScannerReturn {
    scannerId: string;
    isCameraReady: boolean;
    frameSize: number;
    isFlashOn: boolean;
    hasFlash: boolean;
    isAutoZooming: boolean;
    isQrDetected: boolean;
    toggleFlash: () => Promise<void>;
    handleClose: () => Promise<void>;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

/**
 * Encapsulates the entire QR scanner lifecycle:
 * camera init/teardown, flash, auto-zoom, file scanning, and hardware release.
 *
 * Dead code removed vs. original:
 * - error state (was set but never rendered)
 * - cameras / currentCameraId states (setter never called, value never read)
 * - zoom state (setZoom was called but the value was never read — only currentZoomRef drives applyVideoConstraints)
 * - playDeniedSound (defined but never called — moved to scannerSounds.ts is intentionally omitted)
 * - accuracyProgress useMemo (computed but never rendered)
 */
export function useQrScanner({ onScanSuccess, onClose, onFileScan }: UseQrScannerOptions): UseQrScannerReturn {
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [hasFlash, setHasFlash] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [scannerId] = useState(() => `attendance-scanner-${Math.random().toString(36).slice(2, 11)}`);
    const [frameSize, setFrameSize] = useState(260);
    const [zoomRange, setZoomRange] = useState({ min: 1, max: 1, step: 0.1 });
    const [isAutoZooming, setIsAutoZooming] = useState(false);
    const [isQrDetected, setIsQrDetected] = useState(false);

    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const isScanningRef = useRef(false);
    const onScanSuccessRef = useRef(onScanSuccess);
    const detectionLoopRef = useRef<number | null>(null);
    const lastDetectionTimeRef = useRef<number>(Date.now());
    const currentZoomRef = useRef(1);
    const lastScanTimeRef = useRef<number>(0);

    // Keep the callback ref in sync without adding it to deps of handleScanSuccess
    useEffect(() => {
        onScanSuccessRef.current = onScanSuccess;
    }, [onScanSuccess]);

    const handleScanSuccess = useCallback((decodedText: string) => {
        const now = Date.now();
        // 3-second absolute cooldown to prevent any hardware/library jitter
        if (isScanningRef.current || (now - lastScanTimeRef.current < 3000)) return;

        isScanningRef.current = true;
        lastScanTimeRef.current = now;

        playSuccessSound();
        if (navigator.vibrate) navigator.vibrate(50);

        console.log('📸 Scan captured, notifying parent...');
        onScanSuccessRef.current(decodedText);
    }, []);

    const checkCapabilities = useCallback(async () => {
        if (!html5QrCodeRef.current) return;
        try {
            if (html5QrCodeRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
                const capabilities = html5QrCodeRef.current.getRunningTrackCapabilities();
                setHasFlash(!!(capabilities as any).torch);

                if ((capabilities as any).zoom) {
                    setZoomRange({
                        min: (capabilities as any).zoom.min || 1,
                        max: (capabilities as any).zoom.max || 1,
                        step: (capabilities as any).zoom.step || 0.1,
                    });
                }
            }
        } catch (e) {
            setHasFlash(false);
        }
    }, []);

    const startScanner = useCallback(async (cameraIdOrFacingMode: string | { facingMode: string }) => {
        if (!html5QrCodeRef.current) return;

        setIsCameraReady(false);

        const width = window.innerWidth;
        const height = window.innerHeight;
        // Optimal size for speed: not too large to process, not too small to aim
        const size = Math.min(width, height) * 0.7;
        const qrboxSize = Math.floor(Math.min(size, 280));
        setFrameSize(qrboxSize);

        const config = {
            fps: 60, // Maximum speed for smooth catch
            aspectRatio: 1.0,
            disableFlip: true, // Speeds up processing by avoiding mirror transforms
            useBarCodeDetectorIfSupported: true, // Essential for "super fast" native scanning
            videoConstraints: {
                facingMode: 'environment',
                focusMode: 'continuous',
                // Higher resolution isn't always better for speed, 720p is the sweet spot
                width: { ideal: 1280 },
                height: { ideal: 720 },
            },
        };

        try {
            if (html5QrCodeRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
                await html5QrCodeRef.current.stop();
            }

            await html5QrCodeRef.current.start(
                cameraIdOrFacingMode,
                config,
                handleScanSuccess,
                () => {},
            );

            setIsCameraReady(true);
            checkCapabilities();
        } catch (err: any) {
            console.warn('Scanner start failed:', err?.message || err);
        }
    }, [handleScanSuccess, checkCapabilities]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !html5QrCodeRef.current) return;

        const scanner = html5QrCodeRef.current;
        const wasScanning = scanner.getState() === Html5QrcodeScannerState.SCANNING;
        const toastId = toast.loading('Processing image...');

        try {
            // Must stop camera scanning before scanning a file in html5-qrcode
            if (wasScanning) {
                await scanner.stop();
            }

            const decodedText = await scanner.scanFileV2(file, false);
            toast.success('QR Code detected', { id: toastId });
            handleScanSuccess(decodedText.decodedText);
        } catch (err) {
            toast.error('No valid QR code found in this image', { id: toastId });
            // Restart camera if it was previously running
            if (wasScanning) {
                startScanner({ facingMode: 'environment' });
            }
        } finally {
            // Clear input so same file can be picked again
            e.target.value = '';
        }
    };

    const toggleFlash = async () => {
        if (!html5QrCodeRef.current || !hasFlash) return;
        try {
            const newState = !isFlashOn;
            await html5QrCodeRef.current.applyVideoConstraints({
                advanced: [{ torch: newState } as any],
            });
            setIsFlashOn(newState);
        } catch (e) {
            console.error('Flash failed', e);
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
            console.warn('Scanner stop failed, forcing hardware release:', e);
        } finally {
            releaseHardware();
            if (onClose) onClose();
        }
    }, [onClose]);

    // ── Scanner lifecycle ────────────────────────────────────────────────────
    useEffect(() => {
        const scanner = new Html5Qrcode(scannerId, { verbose: false });
        html5QrCodeRef.current = scanner;

        const timer = setTimeout(() => {
            startScanner({ facingMode: 'environment' });
        }, 50); // Faster init

        return () => {
            clearTimeout(timer);
            const s = html5QrCodeRef.current;
            if (s) {
                const stopAndClear = async () => {
                    try {
                        if (s.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
                            await s.stop();
                        }
                    } catch (e) {
                        // Ignore stop errors on unmount
                    } finally {
                        s.clear();
                        // Final hardware kill
                        document.querySelectorAll('video').forEach(v => {
                            const stream = v.srcObject as MediaStream;
                            if (stream) stream.getTracks().forEach(t => t.stop());
                        });
                    }
                };
                stopAndClear();
            }
        };
    }, [scannerId, startScanner]);

    // ── Auto-zoom detection loop ─────────────────────────────────────────────
    useEffect(() => {
        if (!isCameraReady || typeof (window as any).BarcodeDetector === 'undefined') return;

        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });

        const runDetection = async () => {
            const video = document.querySelector(`#${scannerId} video`) as HTMLVideoElement;
            if (!video || video.readyState < 2) {
                detectionLoopRef.current = requestAnimationFrame(runDetection);
                return;
            }

            try {
                const barcodes = await detector.detect(video);
                if (barcodes.length > 0) {
                    const qr = barcodes[0];
                    const { width: qrWidth } = qr.boundingBox;
                    const videoWidth = video.videoWidth;

                    setIsQrDetected(true);
                    lastDetectionTimeRef.current = Date.now();

                    // Auto-zoom: if QR is smaller than 30% of the frame, zoom in
                    const ratio = qrWidth / videoWidth;
                    if (ratio < 0.3 && zoomRange.max > 1) {
                        setIsAutoZooming(true);
                        const nextZoom = Math.min(zoomRange.max, currentZoomRef.current + (zoomRange.step * 2));
                        if (nextZoom !== currentZoomRef.current) {
                            currentZoomRef.current = nextZoom;
                            // Note: only currentZoomRef drives applyVideoConstraints — no zoom state needed
                            html5QrCodeRef.current?.applyVideoConstraints({
                                advanced: [{ zoom: nextZoom } as any],
                            });
                        }
                    } else {
                        setIsAutoZooming(false);
                    }
                } else {
                    setIsAutoZooming(false);
                    // After 2 seconds of no detection, gradually reset zoom to 1
                    if (Date.now() - lastDetectionTimeRef.current > 2000 && currentZoomRef.current > 1) {
                        setIsQrDetected(false);
                        const nextZoom = Math.max(1, currentZoomRef.current - (zoomRange.step * 4));
                        if (nextZoom !== currentZoomRef.current) {
                            currentZoomRef.current = nextZoom;
                            html5QrCodeRef.current?.applyVideoConstraints({
                                advanced: [{ zoom: nextZoom } as any],
                            });
                        }
                    }
                }
            } catch (err) {
                // Silently handle detection errors
            }
            detectionLoopRef.current = requestAnimationFrame(runDetection);
        };

        detectionLoopRef.current = requestAnimationFrame(runDetection);

        return () => {
            if (detectionLoopRef.current) {
                cancelAnimationFrame(detectionLoopRef.current);
            }
        };
    }, [isCameraReady, scannerId, zoomRange]);

    return {
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
    };
}
