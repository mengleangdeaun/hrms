let audioCtx: AudioContext | null = null;

export const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

const initAudioContext = initAudio;

export const playSwipeSound = () => {
    try {
        const ctx = initAudioContext();
        const duration = 0.15; // Snappy
        const now = ctx.currentTime;

        // Create white noise
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Filter sweep for that "whoosh" feel
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(4000, now + duration);
        filter.Q.value = 1;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.15, now + 0.03); // Fast attack
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Fast release

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        noise.start();
        noise.stop(now + duration);
    } catch (e) {
        console.error('Failed to play swipe sound:', e);
    }
};

export const playHoldTickSound = (progress: number) => {
    try {
        const ctx = initAudioContext();
        const now = ctx.currentTime;
        
        // Messenger style "bubble" plop
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        const baseFreq = 260 + (progress * 1.5);
        osc.frequency.setValueAtTime(baseFreq, now);
        // Quick pitch drop creates the "plop" sensation
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.06);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start();
        osc.stop(now + 0.06);
    } catch (e) {}
};

export const playHoldCompletedSound = () => {
    try {
        const ctx = initAudioContext();
        const duration = 0.5;
        const now = ctx.currentTime;

        // Create a series of tones for completion feedback
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (major chord)
        
        frequencies.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            const gainNode = ctx.createGain();
            const startTime = now + index * 0.08;
            const toneDuration = 0.2;

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02); // Attack
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + toneDuration); // Release

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + toneDuration);
        });
    } catch (e) {
        console.error('Failed to play hold completed sound:', e);
    }
};

export const playSubmitSound = () => {
    try {
        const ctx = initAudioContext();
        const duration = 0.4;
        const now = ctx.currentTime;

        // Base tone - deep and satisfying
        const baseOsc = ctx.createOscillator();
        baseOsc.type = 'sine';
        baseOsc.frequency.setValueAtTime(220, now); // A3
        baseOsc.frequency.exponentialRampToValueAtTime(440, now + duration); // A4

        const baseGain = ctx.createGain();
        baseGain.gain.setValueAtTime(0, now);
        baseGain.gain.linearRampToValueAtTime(0.25, now + 0.05);
        baseGain.gain.exponentialRampToValueAtTime(0.05, now + duration);

        baseOsc.connect(baseGain);
        baseGain.connect(ctx.destination);

        baseOsc.start();
        baseOsc.stop(now + duration);

        // High frequency accent for clarity
        const accentOsc = ctx.createOscillator();
        accentOsc.type = 'sine';
        accentOsc.frequency.setValueAtTime(880, now); // A5

        const accentGain = ctx.createGain();
        accentGain.gain.setValueAtTime(0, now);
        accentGain.gain.linearRampToValueAtTime(0.15, now + 0.02);
        accentGain.gain.exponentialRampToValueAtTime(0, now + 0.25);

        accentOsc.connect(accentGain);
        accentGain.connect(ctx.destination);

        accentOsc.start();
        accentOsc.stop(now + 0.25);
    } catch (e) {
        console.error('Failed to play submit sound:', e);
    }
};

export const playErrorSound = () => {
    try {
        const ctx = initAudioContext();
        const now = ctx.currentTime;

        // Low descending tone - signals error/warning
        const frequencies = [349.23, 329.63, 293.66]; // F4, E4, D4 (descending)
        
        frequencies.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            const gainNode = ctx.createGain();
            const startTime = now + index * 0.1;
            const toneDuration = 0.12;

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.02); // Attack
            gainNode.gain.exponentialRampToValueAtTime(0.02, startTime + toneDuration); // Release

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + toneDuration);
        });

        // Add a noise burst for extra error emphasis
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(2000, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.1, now + 0.03);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        noise.start();
        noise.stop(now + 0.15);
    } catch (e) {
        console.error('Failed to play error sound:', e);
    }
};

export const playSuccessSound = () => {
    try {
        const ctx = initAudioContext();
        const now = ctx.currentTime;

        // Ascending major arpeggio - signals success/completion
        const frequencies = [392.0, 523.25, 659.25, 783.99]; // G4, C5, E5, G5

        frequencies.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            const gainNode = ctx.createGain();
            const startTime = now + index * 0.08;
            const toneDuration = 0.25;

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.22, startTime + 0.03); // Attack
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + toneDuration); // Release

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + toneDuration);
        });
    } catch (e) {
        console.error('Failed to play success sound:', e);
    }
};