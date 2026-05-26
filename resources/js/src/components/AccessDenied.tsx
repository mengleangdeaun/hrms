import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconShieldLock, IconArrowLeft, IconHome, IconLock } from '@tabler/icons-react';

const AccessDenied = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [mounted, setMounted] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        dispatch(setPageTitle(t('accessDenied.pageTitle')));
        const timer = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(timer);
    }, [dispatch, t]);

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950">
            {/* ── Background Patterns (Matching Error.tsx) ── */}
            <div className="absolute inset-0 pointer-events-none animate-pulse hidden lg:flex" aria-hidden="true">
                <div className="flex-1 border-r border-rose-500/[0.15]" />
                <div className="w-10 border-r border-rose-500/[0.1]" />
                <div className="w-10 border-r border-rose-500/[0.05]" />
                <div className="flex-1" />
                <div className="w-10 border-l border-rose-500/[0.05]" />
                <div className="w-10 border-l border-rose-500/[0.1]" />
                <div className="flex-1 border-l border-rose-500/[0.15]" />
            </div>

            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <pattern id="dot-grid-denied" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                        <circle cx="16" cy="16" r="1" fill="hsl(var(--primary))" fillOpacity="0.1">
                            <animate attributeName="fill-opacity" values="0.05;0.2;0.05" dur="4s" repeatCount="indefinite" />
                        </circle>
                    </pattern>
                    <radialGradient id="vignette-denied" cx="50%" cy="50%" r="70%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
                    </radialGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#dot-grid-denied)" />
                <rect width="100%" height="100%" fill="url(#vignette-denied)" />
            </svg>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center px-8 py-20 max-w-xl w-full">
                
                {/* Restricted Badge */}
                <div
                    className={`
                        mb-10 flex items-center gap-2 rounded-full border border-rose-500/30
                        bg-rose-500/10 px-4 py-1.5 transition-all duration-1000
                        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                    `}
                >
                    <IconLock size={14} className="text-rose-500 animate-pulse" />
                    <span className="text-[11px] font-bold tracking-[0.2em] text-rose-500 uppercase">
                        {t('accessDenied.badge')}
                    </span>
                </div>

                {/* Hero Icon Section */}
                <div
                    className={`
                        relative mb-8 transition-all duration-1000 delay-100
                        ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
                    `}
                >
                    <div className="absolute inset-0 bg-rose-500/20 blur-[100px] rounded-full animate-pulse" />
                    <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl shadow-black/50">
                        
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" className="text-rose-500" color="none" fill="none" viewBox="0 0 24 24"><path opacity="0.5" d="M3 10.4167C3 7.21907 3 5.62028 3.37752 5.08241C3.75503 4.54454 5.25832 4.02996 8.26491 3.00079L8.83772 2.80472C10.405 2.26824 11.1886 2 12 2C12.8114 2 13.595 2.26824 15.1623 2.80472L15.7351 3.00079C18.7417 4.02996 20.245 4.54454 20.6225 5.08241C21 5.62028 21 7.21907 21 10.4167C21 10.8996 21 11.4234 21 11.9914C21 17.6294 16.761 20.3655 14.1014 21.5273C13.38 21.8424 13.0193 22 12 22C10.9807 22 10.62 21.8424 9.89856 21.5273C7.23896 20.3655 3 17.6294 3 11.9914C3 11.4234 3 10.8996 3 10.4167Z" stroke="currentColor" stroke-width="1.5"></path><path d="M12 8V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><circle cx="12" cy="15" r="1" fill="currentColor"></circle></svg>

                    </div>
                    
                    {/* Floating accents */}
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-slate-950 border border-white/10 rounded-2xl flex items-center justify-center shadow-xl rotate-12">
                         <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    </div>
                </div>

                {/* Status Code */}
                <div
                    className={`
                        mb-2 transition-all duration-1000 delay-200
                        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                    `}
                >
                    <span className="text-6xl font-black tracking-tighter text-white/5 select-none">
                        403
                    </span>
                </div>

                {/* Heading */}
                <h1
                    className={`
                        text-3xl font-bold tracking-tight text-white mb-4
                        transition-all duration-1000 delay-300
                        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                    `}
                >
                    {t('accessDenied.heading')}
                </h1>

                {/* Description */}
                <p
                    className={`
                        text-slate-400 text-sm leading-relaxed max-w-sm mb-12
                        transition-all duration-1000 delay-500
                        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                    `}
                >
                    {t('accessDenied.description')}
                </p>

                {/* Actions */}
                <div
                    className={`
                        flex flex-col sm:flex-row items-center gap-4 w-full justify-center
                        transition-all duration-1000 delay-700
                        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                    `}
                >
                    <button
                        onClick={() => navigate('/')}
                        className="
                            group flex items-center justify-center gap-2.5
                            w-full sm:w-auto min-w-[160px]
                            rounded-xl bg-white px-6 py-3
                            text-sm font-bold text-slate-950
                            transition-all duration-300
                            hover:bg-slate-200 hover:-translate-y-1
                            active:translate-y-0 shadow-xl shadow-white/5
                        "
                    >
                        <IconHome size={18} strokeWidth={2} />
                        {t('accessDenied.goHome')}
                    </button>

                    <button
                        onClick={() => navigate(-1)}
                        className="
                            group flex items-center justify-center gap-2.5
                            w-full sm:w-auto min-w-[160px]
                            rounded-xl border border-white/10 bg-white/5 px-6 py-3
                            text-sm font-bold text-white backdrop-blur-md
                            transition-all duration-300
                            hover:bg-white/10 hover:border-white/20 hover:-translate-y-1
                            active:translate-y-0
                        "
                    >
                        <IconArrowLeft size={18} strokeWidth={2} />
                        {t('accessDenied.goBack')}
                    </button>
                </div>

                {/* Trace ID / Footer info */}
                <div
                    className={`
                        mt-16 pt-8 border-t border-white/5 w-full max-w-xs
                        transition-all duration-1000 delay-[900ms]
                        ${mounted ? 'opacity-40' : 'opacity-0'}
                    `}
                >
                    <p className="text-[10px] font-medium tracking-[0.3em] text-white uppercase">
                        {t('accessDenied.footerNote')}
                    </p>
                </div>
            </div>

            {/* Ambient effects */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-rose-500/5 blur-[120px] rounded-full pointer-events-none" />
        </div>
    );
};

export default AccessDenied;
