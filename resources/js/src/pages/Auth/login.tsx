import { useState, useEffect, useCallback } from "react"
import { useNavigate, Link } from "react-router-dom"
import { IconLoader2, IconArrowRight, IconBrandTelegram, IconShieldLock, IconLock } from "@tabler/icons-react"
import { useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { setPageTitle, setUser } from '@/store/themeConfigSlice';
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import TelegramLoginButton from "@/components/Shared/TelegramLoginButton"

export default function Login() {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    // --- Auth State ---
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [remember, setRemember] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    
    // --- 2FA State ---
    const [requires2FA, setRequires2FA] = useState(false)
    const [otp, setOtp] = useState("")
    const [userId, setUserId] = useState<number | null>(null)
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
    const [timeLeft, setTimeLeft] = useState(300);
    const [botName, setBotName] = useState('sccg_bot')

    useEffect(() => {
        if (!requires2FA) {
            setTimeLeft(300);
            return;
        }

        if (timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [requires2FA, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        fetch('/api/telegram-bot-name').then(r => r.json()).then(data => {
            if (data.bot_username) setBotName(data.bot_username);
        });
    }, []);

    const handleTelegramAuth = useCallback(async (user: any) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/login-telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user),
            });
            const data = await response.json();
            if (response.ok) {
                handleLoginSuccess(data);
            } else {
                setError(data.message || 'Telegram login failed');
            }
        } catch (err) {
            setError('An error occurred during Telegram login');
        } finally {
            setLoading(false);
        }
    }, []);

    const navigate = useNavigate()

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Good morning"
        if (hour < 18) return "Good afternoon"
        return "Good evening"
    }

    useEffect(() => {
        dispatch(setPageTitle('Login'));
        
        // Load remembered email
        const savedEmail = localStorage.getItem("remember_email")
        if (savedEmail) {
            setEmail(savedEmail)
            setRemember(true)
        }
    }, [dispatch]);

    // --- Mouse Tracking Effect ---
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Calculate percentage based on the viewport to move the gradient
            const x = (e.clientX / window.innerWidth) * 100
            const y = (e.clientY / window.innerHeight) * 100
            setMousePos({ x, y })
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [])

    const handleLoginSuccess = (data: any) => {
        if (data.token) localStorage.setItem('auth_token', data.token)
        if (data.user) localStorage.setItem('user_info', JSON.stringify(data.user))
        
        // Handle "Remember Email" persistence
        if (remember) {
            localStorage.setItem("remember_email", email)
        } else {
            localStorage.removeItem("remember_email")
        }

        // Clear any stale employee PWA session to prevent rogue redirects to /employee/dashboard
        localStorage.removeItem('employee_auth_token')
        localStorage.removeItem('employee_name')
        localStorage.removeItem('employee_code')
        
        // Set the user data immediately in React Query cache to avoid redirect race conditions
        if (data.user) {
            queryClient.setQueryData(['user'], data.user);
            dispatch(setUser(data.user));
        }
        
        // Also invalidate to be safe and ensure everything is fresh
        queryClient.invalidateQueries({ queryKey: ['user'] });
        
        navigate('/')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            await fetch('/sanctum/csrf-cookie')
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`
                const parts = value.split(`; ${name}=`)
                if (parts.length === 2) return parts.pop()?.split(';').shift()
            }
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(getCookie('XSRF-TOKEN') || ''),
                },
                credentials: 'include',
                body: JSON.stringify({ email, password, remember }),
            })
            const data = await response.json()
            if (response.ok) {
                if (data.requires_2fa) {
                    setRequires2FA(true)
                    setUserId(data.user_id)
                } else {
                    handleLoginSuccess(data)
                }
            } else {
                setError(data.message || 'Login failed')
            }
        } catch (err) {
            console.error(err)
            setError('An error occurred during login')
        } finally {
            setLoading(false)
        }
    }

    const handleVerify2FA = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            const response = await fetch('/api/login/verify-2fa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ 
                    user_id: userId, 
                    otp,
                    remember // Pass remember choice to verification step too
                }),
            })
            const data = await response.json()
            if (response.ok) {
                handleLoginSuccess(data)
            } else {
                setError(data.message || 'Verification failed')
            }
        } catch (err) {
            console.error(err)
            setError('An error occurred during verification')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen bg-slate-950 ">
            
            {/* ── Left: Login Form ── */}
            <div className="relative flex flex-col justify-between w-full lg:max-w-[480px] px-10 py-12 bg-white dark:bg-slate-900 z-10 shadow-2xl shadow-black/40 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:20px_20px]">

                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-32 overflow-hidden">
                        <img 
                            src="/assets/images/logo-side.svg" 
                            alt="Logo" 
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>

                {/* Form */}
                <div className="flex flex-col gap-6">
                    {/* Heading */}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                            {getGreeting()}.
                        </h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            {requires2FA ? "Check your Telegram for the 6-digit code." : "Sign in to access your workspace."}
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                            <svg className="w-4 h-4 mt-0.5 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M12 17V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <circle cx="1" cy="1" r="1" transform="matrix(1 0 0 -1 11 9)" fill="currentColor" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {requires2FA ? (
                        <form onSubmit={handleVerify2FA} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-semibold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                                        Verification Code
                                    </label>
                                    <div className={`text-[11px] font-bold px-2 py-0.5  ${timeLeft < 60 ? 'bg-transparent text-red-600 animate-pulse' : 'bg-transparent text-primary'}`}>
                                        {formatTime(timeLeft)}
                                    </div>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 group-focus-within:text-primary transition-colors">
                                        <IconShieldLock size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="000000"
                                        className="w-full h-11 pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                        required
                                        maxLength={6}
                                        autoFocus
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 px-1 flex items-center gap-1.5 font-medium">
                                    <IconBrandTelegram size={14} className="text-sky-500" />
                                    SENT VIA TELEGRAM BOT
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-primary hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold tracking-wide shadow-lg shadow-primary/30 transition-all duration-150 group"
                                >
                                    {loading ? (
                                        <IconLoader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            Verify & Continue
                                            <IconArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => setRequires2FA(false)}
                                    className="text-xs mt-4 font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 transition-colors flex items-center justify-center gap-2 uppercase tracking-wide"
                                >
                                    <IconLock size={14} />
                                    Back to Login
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-4">
                                {/* Email */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 group-focus-within:text-primary transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                                            </svg>
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@sccg.com"
                                            className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-slate-900 dark:text-white placeholder:text-slate-400 text-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-semibold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                                            Password
                                        </label>
                                        <Link to="/auth/forgot-password" className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 group-focus-within:text-primary transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                                            </svg>
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••••"
                                            className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-slate-900 dark:text-white placeholder:text-slate-400 text-sm"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center gap-2 px-1">
                                <Checkbox 
                                    id="remember" 
                                    checked={remember}
                                    onCheckedChange={(checked) => setRemember(checked as boolean)}
                                    className="border-slate-200 dark:border-slate-700 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <Label 
                                    htmlFor="remember" 
                                    className="text-xs font-medium text-slate-500 dark:text-slate-400 cursor-pointer select-none mb-0"
                                >
                                    Remember my email
                                </Label>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-primary hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold tracking-wide shadow-lg shadow-primary/30 transition-all duration-150 group"
                            >
                                {loading ? (
                                    <IconLoader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Sign in
                                        <IconArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <div className="flex items-center gap-3 py-1">
                                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Social login</span>
                                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                            </div>

                            <div className="flex justify-center -mt-1">
                                <TelegramLoginButton 
                                    botName={botName} 
                                    onAuth={handleTelegramAuth} 
                                    cornerRadius={12}
                                    buttonSize="large"
                                />
                            </div>
                        </form>
                    )}

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                        <span className="text-[11px] text-slate-400 tracking-widest uppercase">Secured</span>
                        <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                    </div>

                    {/* Trust badges */}
                    <div className="flex items-center justify-center gap-6">
                        {[
                            { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", label: "256-bit SSL" },
                            { icon: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z", label: "Private" },
                            { icon: "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3", label: "Verified" },
                        ].map((b) => (
                            <div key={b.label} className="flex items-center gap-1.5 text-slate-400">
                                <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d={b.icon} />
                                </svg>
                                <span className="text-[10px] font-medium tracking-wide">{b.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-[11px] text-slate-400 dark:text-slate-600 text-center">
                    © {new Date().getFullYear()} SCC Group. All rights reserved.
                </p>
            </div>

            {/* ── Right: Decorative Panel (Neural Data Matrix) ── */}
            <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center bg-slate-950">
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="xMidYMid slice"
                >
                    <defs>
                        {/* Dense Dot Matrix with pulse */}
                        <pattern id="dense-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                            <circle cx="12" cy="12" r="1.5" fill="hsl(var(--primary))" fillOpacity="0.15">
                                <animate attributeName="fill-opacity" values="0.05;0.35;0.05" dur="3s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="24" cy="24" r="1" fill="hsl(var(--primary))" fillOpacity="0.1">
                                <animate attributeName="fill-opacity" values="0.1;0.4;0.1" dur="4s" repeatCount="indefinite" />
                            </circle>
                        </pattern>

                        
                        <radialGradient id="vignette-heavy" cx="50%" cy="50%" r="70%">
                            <stop offset="0%" stopColor="transparent" />
                            <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
                        </radialGradient>
                    </defs>

                    <rect width="100%" height="100%" fill="#020617" />
                    
                    {/* The Matrix Base */}
                    <rect width="100%" height="100%" fill="url(#dense-dots)" />

                    {/* Sweeping Beam */}
                    <rect x="-50%" y="-50%" width="200%" height="200%" fill="url(#beam)">
                        <animateTransform attributeName="transform" type="translate" values="-1000 -1000; 1000 1000" dur="8s" repeatCount="indefinite" />
                    </rect>

                    {/* Deep Vignette */}
                    <rect width="100%" height="100%" fill="url(#vignette-heavy)" />
                </svg>



      {/* Bottom horizontal glow */}
      <div
        className="absolute bottom-0 left-0 w-full h-64
        bg-gradient-to-t from-primary/25 via-primary/10 to-transparent
        pointer-events-none z-0 animate-[floatLineBottom_8s_ease-in-out_infinite]"
        style={{
          transform: `translateX(${(mousePos.x - 50) * 0.5}px) translateY(${10 - mousePos.y * 0.05}px)`,
        }}
      ></div>

      {/* Top horizontal glow */}
      <div
        className="absolute top-0 left-0 w-full h-64
        bg-gradient-to-b from-primary/25 via-primary/10 to-transparent
        pointer-events-none z-0 animate-[floatLineTop_10s_ease-in-out_infinite]"
        style={{
          transform: `translateX(${-(mousePos.x - 50) * 0.5}px) translateY(${-10 + mousePos.y * 0.05}px)`,
        }}
      ></div>



{/* <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-primary/20 via-primary/10 to-transparent pointer-events-none z-0 "></div> */}

                {/* Enhanced sunrise glow with animation */}
                {/* <div 
                    className="absolute bottom-[-60%] left-1/2 -translate-x-1/2 
                        w-full h-full max-w-[1800px] max-h-[1800px]
                        bg-[radial-gradient(circle,_hsl(var(--primary)/0.45)_0%,_hsl(var(--primary)/0.25)_35%,_hsl(var(--primary)/0.12)_55%,_transparent_70%)]
                        rounded-full blur-3xl pointer-events-none z-0 animate-glow-pulse"
                /> */}

                {/* Floating content */}
                <div className="relative z-10 flex flex-col gap-10 max-w-lg px-12 pointer-events-none">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-px bg-primary opacity-60" />
                        <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-primary">
                            Enterprise Platform
                        </span>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h2 className="text-5xl xl:text-6xl font-bold tracking-tight text-white leading-[1.05]">
                            Manage your<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                                enterprise,
                            </span><br />
                            effortlessly.
                        </h2>
                        <p className="text-base text-slate-400 leading-relaxed max-w-sm">
                            A unified workspace for operations, analytics, and team management — built for clarity at every scale.
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-700/50">
                        {[
                            { value: "99.9%", label: "Uptime SLA" },
                            { value: "256-bit", label: "Encryption" },
                            { value: "24 / 7", label: "Support" },
                        ].map((s) => (
                            <div key={s.label}>
                                <p className="text-2xl font-bold text-white tracking-tight">{s.value}</p>
                                <p className="text-[11px] font-medium tracking-widest uppercase text-slate-500 mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}