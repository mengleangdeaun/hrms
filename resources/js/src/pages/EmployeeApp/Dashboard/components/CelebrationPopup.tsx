import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import Lottie from 'lottie-react';
import confettiAnimation from '@/assets/animations/Confetti2.json';
import { IconCake, IconConfetti, IconX, IconChevronRight, IconSparkles } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn, getLocalizedMilestone } from '@/lib/utils';
import { Illustration } from '@/components/illustrations/PremiumIcon';
import { t } from 'i18next';

interface CelebrationPopupProps {
    isOpen: boolean;
    onClose: () => void;
    employee: any;
    celebration: {
        type: 'birthday' | 'anniversary';
        milestone: string;
    };
}

// ── Particle system for the blown-out smoke ──────────────────────────────────
const SmokeParticle = ({ delay }: { delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
        animate={{
            opacity: [0, 0.6, 0],
            y: [-10, -80 - Math.random() * 40],
            x: [0, (Math.random() - 0.5) * 40],
            scale: [0.5, 2, 3],
        }}
        transition={{ duration: 2.5, delay, ease: 'easeOut' }}
        className="absolute bottom-[88px] left-1/2 -translate-x-1/2 w-6 h-6 bg-white/20 rounded-full blur-md pointer-events-none"
    />
);

// ── Floating ember sparks ─────────────────────────────────────────────────────
const EmberSpark = ({ index }: { index: number }) => {
    const angle = (index / 8) * Math.PI * 2;
    const dist = 20 + Math.random() * 30;
    return (
        <motion.div
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
                opacity: [1, 0.8, 0],
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist - 20,
                scale: [1, 0.5, 0],
            }}
            transition={{ duration: 0.8 + Math.random() * 0.4, ease: 'easeOut' }}
            className="absolute bottom-[90px] left-1/2 w-1.5 h-1.5 rounded-full bg-orange-400 pointer-events-none"
            style={{ marginLeft: -3 }}
        />
    );
};

// ── The Candle ────────────────────────────────────────────────────────────────
const InteractiveCandle = ({ isBlown, onTap, countdown }: {
    isBlown: boolean;
    onTap: () => void;
    countdown: number;
}) => {
    const [showEmbers, setShowEmbers] = useState(false);
    const urgency = countdown <= 3;

    const handleTap = () => {
        if (!isBlown) {
            setShowEmbers(true);
            setTimeout(() => setShowEmbers(false), 900);
            onTap();
        }
    };

    return (
        <div
            className="flex flex-col items-center cursor-pointer select-none"
            onClick={handleTap}
        >
            <div className="relative h-52 w-28 flex items-end justify-center">
                {/* Ambient glow on ground */}
                {!isBlown && (
                    <motion.div
                        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-orange-400/40 blur-xl rounded-full"
                    />
                )}

                {/* Flame */}
                <AnimatePresence>
                    {!isBlown && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0, x: "-50%" }}
                            animate={{ opacity: 1, scale: 1, x: "-50%" }}
                            exit={{ opacity: 0, scale: 0, x: "-50%", y: -20 }}
                            transition={{ exit: { duration: 0.3 } }}
                            className="absolute top-0 left-1/2 z-10"
                        >
                            {/* Wide glow */}
                            <motion.div
                                animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.4, 1] }}
                                transition={{ repeat: Infinity, duration: urgency ? 0.4 : 1.2 }}
                                className="absolute  bg-orange-400/25 rounded-full blur-2xl"
                            />
                            {/* Outer flame */}
                            <motion.div
                                animate={{
                                    scaleX: [1, 1.15, 0.9, 1.1, 1],
                                    scaleY: [1, 0.95, 1.1, 0.9, 1],
                                    rotate: [0, 3, -3, 2, 0],
                                }}
                                transition={{ repeat: Infinity, duration: urgency ? 0.35 : 0.7, ease: 'easeInOut' }}
                                className="relative w-9 h-14 flex items-center justify-center"
                            >
                                <div className="w-9 h-14 bg-gradient-to-t from-red-600 via-orange-400 to-yellow-200 rounded-[50%_50%_30%_30%/60%_60%_40%_40%] shadow-[0_0_24px_6px_rgba(251,146,60,0.6)]" />
                                {/* Inner core */}
                                <div className="absolute bottom-2 w-4 h-7 bg-gradient-to-t from-white/60 to-yellow-100/20 rounded-full blur-[2px]" />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Smoke after blown */}
                <AnimatePresence>
                    {isBlown && [0, 0.1, 0.25, 0.4, 0.6].map((d, i) => (
                        <SmokeParticle key={i} delay={d} />
                    ))}
                </AnimatePresence>

                {/* Ember sparks on tap */}
                <AnimatePresence>
                    {showEmbers && Array.from({ length: 8 }).map((_, i) => (
                        <EmberSpark key={i} index={i} />
                    ))}
                </AnimatePresence>


                {/* Candle body */}
                <div className="relative w-16 h-36 rounded-2xl overflow-hidden shadow-2xl z-10">
                    {/* Base gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-pink-300 via-pink-400 to-pink-600" />
                    {/* Shine */}
                    <div className="absolute top-0 left-2 w-3 h-full bg-white/20 blur-sm rounded-full" />
                    {/* Stripe pattern */}
                    {[0, 1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            className="absolute w-full h-[3px] bg-white/15"
                            style={{ top: `${20 + i * 22}%`, transform: 'rotate(-8deg) scaleX(1.3)' }}
                        />
                    ))}
                    {/* Bottom shadow */}
                    <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-pink-800/40 to-transparent" />
                </div>

                {/* Candle base plate */}
                <div className="absolute bottom-0 w-20 h-3 bg-gradient-to-b from-pink-200 to-pink-300 rounded-full shadow-lg" />
            </div>

            {/* Hint */}
            <AnimatePresence>
                {!isBlown && (
                    <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50"
                    >
                        {t('tap_to_blow', 'tap to blow 🌬️')}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
};

// ── Stars backdrop ────────────────────────────────────────────────────────────
const StarField = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 28 }).map((_, i) => (
            <motion.div
                key={i}
                className="absolute w-0.5 h-0.5 bg-white rounded-full"
                style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                }}
                animate={{ opacity: [0.1, 0.8, 0.1] }}
                transition={{
                    repeat: Infinity,
                    duration: 1.5 + Math.random() * 3,
                    delay: Math.random() * 3,
                }}
            />
        ))}
    </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export const CelebrationPopup: React.FC<CelebrationPopupProps> = ({
    isOpen, onClose, employee, celebration
}) => {
    const { t } = useTranslation('pwa');
    const navigate = useNavigate();
    const [phase, setPhase] = useState<'intro' | 'active' | 'revealed'>('intro');
    const [countdown, setCountdown] = useState(10);
    const [isBlown, setIsBlown] = useState(false);

    const isBirthday = celebration.type === 'birthday';
    const firstName = employee?.name?.split(' ')[0] ?? t('you', 'You');

    useEffect(() => {
        if (!isOpen) {
            // Reset on close
            setTimeout(() => {
                setPhase('intro');
                setCountdown(10);
                setIsBlown(false);
            }, 400);
        }
    }, [isOpen]);

    useEffect(() => {
        if (phase !== 'active') return;
        if (countdown <= 0) { handleBlow(); return; }
        const t = setInterval(() => setCountdown(p => Math.max(0, p - 1)), 1000);
        return () => clearInterval(t);
    }, [phase, countdown]);

    const handleBlow = useCallback(() => {
        setIsBlown(true);
        setTimeout(() => setPhase('revealed'), 1800);
    }, []);

    const handleTap = () => setCountdown(p => Math.max(0, p - 2));

    const handleViewWishes = () => {
        onClose();
        navigate(`/employee/celebrations/${employee.id}?type=${celebration.type}`);
    };

    // Progress ring for countdown
    const circumference = 2 * Math.PI * 28;
    const progress = ((10 - countdown) / 10) * circumference;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-5">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[#0a0612]/95 backdrop-blur-2xl"
                    />
                    <StarField />

                    {/* Confetti (Only in reveal phase) */}
                    <AnimatePresence>
                        {phase === 'revealed' && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                <Lottie animationData={confettiAnimation} loop className="w-full h-full scale-125" />
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Main Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 16 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                        className="relative w-full max-w-[340px] z-10"
                    >
                        <AnimatePresence mode="wait">
                            {/* ── Phase 1: Greeting ── */}
                            {phase === 'intro' && (
                                <motion.div
                                    key="greeting"
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                                    className="bg-white dark:bg-gray-950 rounded-[32px] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)] border border-white/10"
                                >
                                    <div className={cn(
                                        "relative h-44 flex items-center justify-center overflow-hidden",
                                        isBirthday ? "bg-gradient-to-br from-pink-400 to-orange-400" : "bg-gradient-to-br from-amber-400 to-orange-400"
                                    )}>
<motion.div
  animate={{
    y: [0, -12, 0],
    scale: [1, 1.05, 1],
    rotate: [0, 2, -2, 0],
  }}
  transition={{
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  }}
  className="text-7xl"
>
  {isBirthday ? <Illustration name="cake" /> : <Illustration name="congrate" />}
</motion.div>
                                    </div>
                                    <div className="px-8 py-8 flex flex-col items-center text-center gap-4">
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                                            {isBirthday ? t('happy_birthday_greeting', "Happy Birthday,") : t('congratulations', "Congratulations,")}
                                            <br />
                                            <span className={isBirthday ? "text-pink-500" : "text-amber-500"}>{firstName}! 🎉</span>
                                        </h2>
                                        <p className="text-[13.5px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                            {isBirthday 
                                                ? t('celebration_birthday_desc', "We've prepared something special for you. Let's start with a wish!") 
                                                : t('celebration_anniversary_desc', { milestone: getLocalizedMilestone(celebration.milestone, t), defaultValue: `Celebrating ${celebration.milestone} of excellence.` })}
                                        </p>
                                        <button
                                            onClick={() => setPhase('active')}
                                            className={cn("w-full h-14 rounded-2xl text-white font-black text-[13px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg", isBirthday ? "bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/30" : "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30")}
                                        >
                                            {isBirthday ? t('make_a_wish', "Make a Wish") : t('unlock_my_message', "Unlock My Message")}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── Phase 2: Candle ── */}
                            {phase === 'active' && (
                                <motion.div
                                    key="active"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.2, filter: 'blur(15px)' }}
                                    className="flex flex-col items-center justify-center py-4 min-h-[400px]"
                                >
                                    <div className="relative w-20 h-20 mb-4">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                                            <circle cx="32" cy="32" r="28" fill="none" stroke="white" strokeOpacity="0.08" strokeWidth="3" />
                                            <motion.circle
                                                cx="32" cy="32" r="28" fill="none" stroke="#fb923c" strokeWidth="4" strokeLinecap="round"
                                                strokeDasharray={circumference} strokeDashoffset={circumference - progress}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-white tabular-nums">{countdown}</div>
                                    </div>
                                    <InteractiveCandle isBlown={isBlown} onTap={handleTap} countdown={countdown} />
                                </motion.div>
                            )}

                            {/* ── Phase 3: Final ── */}
                            {phase === 'revealed' && (
                                <motion.div
                                    key="revealed"
                                    initial={{ opacity: 0, scale: 0.85, y: 15 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="bg-white dark:bg-gray-950 rounded-[32px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.7)]"
                                >
                                    <div className={cn("relative h-48 flex items-center justify-center", isBirthday ? "bg-gradient-to-br from-pink-400 to-orange-400" : "bg-gradient-to-br from-amber-400 to-orange-400")}>
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl drop-shadow-2xl">{isBirthday ? <Illustration name="kado" /> : <Illustration name="spark" />}</motion.div>
                                        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-white"><IconX size={18} /></button>
                                    </div>
                                    <div className="px-8 py-8 flex flex-col items-center text-center gap-4">
                                        <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                                            {isBirthday ? t('its_your_day', "It's Your Day!") : t('happy_anniversary_title', "Happy Anniversary!")}
                                        </h2>
                                        <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                            {isBirthday 
                                                ? t('birthday_wishes_desc', "Wishing you a year as bright as your candle. Your team has left messages for you!") 
                                                : t('anniversary_wishes_desc', "Thank you for being part of our journey. Here's to many more!")}
                                        </p>
                                        <button
                                            onClick={handleViewWishes}
                                            className={cn("w-full h-14 rounded-2xl text-white font-black text-[13px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl", isBirthday ? "bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/30" : "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30")}
                                        >
                                            {t('open_my_wishes', 'Open My Wishes')} <IconChevronRight size={18} />
                                        </button>
                                        <button onClick={onClose} className="text-[11px] text-gray-400 font-bold uppercase tracking-widest py-2">{t('maybe_later', 'Maybe later')}</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};