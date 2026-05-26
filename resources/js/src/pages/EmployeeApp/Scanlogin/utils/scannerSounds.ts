/**
 * Web Audio API sound effects for the QR attendance scanner.
 * Pure functions — no React hooks, safe to call from anywhere.
 *
 * Note: playDeniedSound was removed — it was defined but never called.
 */

/** Short high-pitched beep confirming a successful QR scan. */
export function playSuccessSound(): void {
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
    } catch (e) {
        // Silently ignore — AudioContext not available (e.g. silent mode, old WebView)
    }
}
