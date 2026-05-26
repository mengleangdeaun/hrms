import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { IconCheck, IconX, IconLoader2, IconQrcode, IconMail, IconLock, IconArrowLeft, IconBolt, IconBoltOff, IconArrowRight } from '@tabler/icons-react';
import { Html5Qrcode } from 'html5-qrcode';
import { IdentityScanner } from '@/components/ui/pwa/IdentityScanner';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import PwaToaster from '@/components/ui/pwa/PwaToaster';
import { useAttendance } from '@/context/AttendanceContext';
import { pwaFetch } from '@/lib/pwa-fetch';


export default function MobileEmployeeLogin() {
    const { t } = useTranslation('pwa');
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const payload = searchParams.get('payload');

    const [status, setStatus] = useState<'decision' | 'scan' | 'form' | 'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState(t('checking_session', 'Checking session...'));
    const [employeeName, setEmployeeName] = useState('');
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loggingIn, setLoggingIn] = useState(false);
    const isScanningRef = useRef(false);
    const { deviceId } = useAttendance();
    const [isDeviceMismatch, setIsDeviceMismatch] = useState(false);
    const [retryData, setRetryData] = useState<{type: 'qr' | 'form', payload?: string} | null>(null);

    const authenticate = async (decodedText: string) => {
        let authPayload = decodedText;

        // Robust extraction from various formats
        if (decodedText.startsWith('http')) {
            try {
                const url = new URL(decodedText);
                const p = url.searchParams.get('payload');
                if (p) authPayload = p;
            } catch (e) {
                // Fallback for malformed URLs
                const match = decodedText.match(/[?&]payload=([^&]+)/);
                if (match) authPayload = match[1];
            }
        } else if (decodedText.includes('payload=')) {
            const p = decodedText.split('payload=')[1]?.split('&')[0];
            if (p) authPayload = p;
        }

        setStatus('loading');
        setMessage(t('authenticating_device', 'Authenticating your device...'));
        try {
            const res = await pwaFetch('/api/attendance/employee-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    payload: authPayload,
                    device_id: deviceId 
                })
            });

            const data = await res.json();

            if (res.ok) {
                // Store the raw token requested from the server for future GPS clock-ins
                localStorage.setItem('employee_auth_token', data.auth_token);
                localStorage.setItem('employee_name', data.employee.name);
                localStorage.setItem('employee_code', data.employee.code);

                setEmployeeName(data.employee.name);
                setStatus('success');
                setMessage(t('device_authenticated', 'Device Authenticated successfully.'));
                toast.success(t('login_successful', 'Login Successful'));

                // Auto-redirect to the new PWA Dashboard
                setTimeout(() => {
                    navigate('/employee/dashboard', { replace: true });
                }, 2000);
            } else {
                setStatus('error');
                if (data.code === 'DEVICE_MISMATCH') {
                    setIsDeviceMismatch(true);
                    setRetryData({ type: 'qr', payload: authPayload });
                    setMessage(data.message || t('device_mismatch_desc', 'This account is linked to another device. Transfer to this device?'));
                } else {
                    setMessage(data.message || t('authentication_failed_desc', 'Authentication failed. Please request a new QR code.'));
                }
                toast.error(t('login_failed', 'Login Failed'));
            }
        } catch (err) {
            setStatus('error');
            setMessage(t('network_error_auth', 'Network error occurred while trying to authenticate.'));
        } finally {
            isScanningRef.current = false;
        }
    };

    const handleCredentialLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoggingIn(true);
        try {
            const res = await pwaFetch('/api/attendance/login-credentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    device_id: deviceId
                })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('employee_auth_token', data.auth_token);
                localStorage.setItem('employee_name', data.employee.name);
                localStorage.setItem('employee_code', data.employee.code);

                setEmployeeName(data.employee.name);
                setStatus('success');
                setMessage(t('logged_in_successfully', 'Logged in successfully.'));
                toast.success(t('login_successful', 'Login Successful'));

                setTimeout(() => {
                    navigate('/employee/dashboard', { replace: true });
                }, 1500);
            } else {
                if (data.code === 'DEVICE_MISMATCH') {
                    setStatus('error');
                    setIsDeviceMismatch(true);
                    setRetryData({ type: 'form' });
                    setMessage(data.message || t('device_mismatch_desc', 'This account is linked to another device. Transfer to this device?'));
                } else {
                    toast.error(data.message || t('invalid_credentials', 'Invalid credentials'));
                }
            }
        } catch (err) {
            toast.error(t('network_error', 'Network error occurred.'));
        } finally {
            setLoggingIn(false);
        }
    };

    const handleTransferAccount = async () => {
        if (!retryData) return;
        
        setLoggingIn(true);
        setStatus('loading');
        setMessage(t('transferring_account', 'Transferring account to this device...'));
        
        try {
            const endpoint = retryData.type === 'qr' ? '/api/attendance/employee-login' : '/api/attendance/login-credentials';
            const body = retryData.type === 'qr' 
                ? { payload: retryData.payload, device_id: deviceId, force: true }
                : { ...formData, device_id: deviceId, force: true };
                
            const res = await pwaFetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(body)
            });
            
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('employee_auth_token', data.auth_token);
                localStorage.setItem('employee_name', data.employee.name);
                localStorage.setItem('employee_code', data.employee.code);
                setEmployeeName(data.employee.name);
                setStatus('success');
                toast.success(t('transfer_success', 'Account transferred successfully'));
                setTimeout(() => navigate('/employee/dashboard', { replace: true }), 1500);
            } else {
                setStatus('error');
                setMessage(data.message || t('transfer_failed', 'Failed to transfer account.'));
                toast.error(t('login_failed', 'Login Failed'));
            }
        } catch (err) {
            toast.error(t('network_error', 'Network error occurred.'));
            setStatus('error');
        } finally {
            setLoggingIn(false);
        }
    };

    const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        try {
            const scanner = new Html5Qrcode("qr-reader-temp");
            toast.loading(t('analyzing_image', 'Analyzing image...'), { id: 'file-scan' });
            const decodedText = await scanner.scanFile(file, true);
            toast.success(t('qr_code_detected', 'QR Code detected'), { id: 'file-scan' });
            authenticate(decodedText);
        } catch (err) {
            toast.error(t('invalid_qr_file', 'Could not find a valid QR code in that image.'), { id: 'file-scan' });
        }
    };

    useEffect(() => {
        dispatch(setPageTitle(t('employee_login', 'Employee Login')));
    }, [dispatch, t]);

    useEffect(() => {
        // Initial Persistence Check: If token exists, go to dashboard
        const existingToken = localStorage.getItem('employee_auth_token');
        if (existingToken) {
            navigate('/employee/dashboard', { replace: true });
            return;
        }

        if (payload) {
            authenticate(payload);
        } else {
            setStatus('decision');
        }
    }, [payload]);



    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('good_morning', 'Good Morning');
        if (hour < 17) return t('good_afternoon', 'Good Afternoon');
        return t('good_evening', 'Good Evening');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:20px_20px]">
            <div className="w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/40 border border-slate-100 dark:border-slate-800 relative overflow-hidden flex flex-col min-h-[600px] justify-between p-10 py-12">
                
                {/* Logo Section */}
                <div className="flex items-center justify-center mb-8">
                    <div className="w-32 overflow-hidden flex items-center justify-center">
                        <img 
                            src="/assets/images/logo-side.svg" 
                            alt="Company Logo" 
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>

                <div className="flex flex-col flex-1 justify-center gap-8">
                    {status === 'decision' && (
                        <div className="flex flex-col gap-8 animate-in fade-in zoom-in duration-300">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                                    {getGreeting()}.
                                </h1>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    {t('select_access_method', 'Select your access method.')}
                                </p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <button 
                                    onClick={() => setStatus('scan')}
                                    className="flex items-center justify-between p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-primary/5 hover:border-primary/30 transition-all group active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" color="none" fill="none" viewBox="0 0 24 24"><path d="M2 16.9C2 15.5906 2 14.9359 2.29472 14.455C2.45963 14.1859 2.68589 13.9596 2.955 13.7947C3.43594 13.5 4.09063 13.5 5.4 13.5H6.5C8.38562 13.5 9.32843 13.5 9.91421 14.0858C10.5 14.6716 10.5 15.6144 10.5 17.5V18.6C10.5 19.9094 10.5 20.5641 10.2053 21.045C10.0404 21.3141 9.81411 21.5404 9.545 21.7053C9.06406 22 8.40937 22 7.1 22C5.13594 22 4.15391 22 3.4325 21.5579C3.02884 21.3106 2.68945 20.9712 2.44208 20.5675C2 19.8461 2 18.8641 2 16.9Z" stroke="currentColor" stroke-width="1.5"></path><path d="M13.5 5.4C13.5 4.09063 13.5 3.43594 13.7947 2.955C13.9596 2.68589 14.1859 2.45963 14.455 2.29472C14.9359 2 15.5906 2 16.9 2C18.8641 2 19.8461 2 20.5675 2.44208C20.9712 2.68945 21.3106 3.02884 21.5579 3.4325C22 4.15391 22 5.13594 22 7.1C22 8.40937 22 9.06406 21.7053 9.545C21.5404 9.81411 21.3141 10.0404 21.045 10.2053C20.5641 10.5 19.9094 10.5 18.6 10.5H17.5C15.6144 10.5 14.6716 10.5 14.0858 9.91421C13.5 9.32843 13.5 8.38562 13.5 6.5V5.4Z" stroke="currentColor" stroke-width="1.5"></path><path opacity="0.5" d="M16.5 6.25C16.5 5.73459 16.5 5.47689 16.6291 5.29493C16.6747 5.23072 16.7307 5.17466 16.7949 5.12911C16.9769 5 17.2346 5 17.75 5C18.2654 5 18.5231 5 18.7051 5.12911C18.7693 5.17466 18.8253 5.23072 18.8709 5.29493C19 5.47689 19 5.73459 19 6.25C19 6.76541 19 7.02311 18.8709 7.20507C18.8253 7.26928 18.7693 7.32534 18.7051 7.37089C18.5231 7.5 18.2654 7.5 17.75 7.5C17.2346 7.5 16.9769 7.5 16.7949 7.37089C16.7307 7.32534 16.6747 7.26928 16.6291 7.20507C16.5 7.02311 16.5 6.76541 16.5 6.25Z" fill="currentColor"></path><path d="M19 13.5H17C15.5955 13.5 14.8933 13.5 14.3889 13.8371C14.1705 13.983 13.983 14.1705 13.8371 14.3889C13.5 14.8933 13.5 15.5955 13.5 17" stroke="currentColor" stroke-width="1.5"></path><path opacity="0.5" d="M12.75 22C12.75 22.4142 13.0858 22.75 13.5 22.75C13.9142 22.75 14.25 22.4142 14.25 22H12.75ZM12.75 19V22H14.25V19H12.75Z" fill="currentColor"></path><path d="M17 22H19C19.9319 22 20.3978 22 20.7654 21.8478C21.2554 21.6448 21.6448 21.2554 21.8478 20.7654C22 20.3978 22 19.9319 22 19" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"></path><path opacity="0.5" d="M22.75 13.5C22.75 13.0858 22.4142 12.75 22 12.75C21.5858 12.75 21.25 13.0858 21.25 13.5H22.75ZM22.75 17V13.5H21.25V17H22.75Z" fill="currentColor"></path><path d="M2 7.1C2 5.13594 2 4.15391 2.44208 3.4325C2.68945 3.02884 3.02884 2.68945 3.4325 2.44208C4.15391 2 5.13594 2 7.1 2C8.40937 2 9.06406 2 9.545 2.29472C9.81411 2.45963 10.0404 2.68589 10.2053 2.955C10.5 3.43594 10.5 4.09063 10.5 5.4V6.5C10.5 8.38562 10.5 9.32843 9.91421 9.91421C9.32843 10.5 8.38562 10.5 6.5 10.5H5.4C4.09063 10.5 3.43594 10.5 2.955 10.2053C2.68589 10.0404 2.45963 9.81411 2.29472 9.545C2 9.06406 2 8.40937 2 7.1Z" stroke="currentColor" stroke-width="1.5"></path><path opacity="0.5" d="M5 6.25C5 5.73459 5 5.47689 5.12911 5.29493C5.17466 5.23072 5.23072 5.17466 5.29493 5.12911C5.47689 5 5.73459 5 6.25 5C6.76541 5 7.02311 5 7.20507 5.12911C7.26928 5.17466 7.32534 5.23072 7.37089 5.29493C7.5 5.47689 7.5 5.73459 7.5 6.25C7.5 6.76541 7.5 7.02311 7.37089 7.20507C7.32534 7.26928 7.26928 7.32534 7.20507 7.37089C7.02311 7.5 6.76541 7.5 6.25 7.5C5.73459 7.5 5.47689 7.5 5.29493 7.37089C5.23072 7.32534 5.17466 7.26928 5.12911 7.20507C5 7.02311 5 6.76541 5 6.25Z" fill="currentColor"></path><path opacity="0.5" d="M5 17.75C5 17.2346 5 16.9769 5.12911 16.7949C5.17466 16.7307 5.23072 16.6747 5.29493 16.6291C5.47689 16.5 5.73459 16.5 6.25 16.5C6.76541 16.5 7.02311 16.5 7.20507 16.6291C7.26928 16.6747 7.32534 16.7307 7.37089 16.7949C7.5 16.9769 7.5 17.2346 7.5 17.75C7.5 18.2654 7.5 18.5231 7.37089 18.7051C7.32534 18.7693 7.26928 18.8253 7.20507 18.8709C7.02311 19 6.76541 19 6.25 19C5.73459 19 5.47689 19 5.29493 18.8709C5.23072 18.8253 5.17466 18.7693 5.12911 18.7051C5 18.5231 5 18.2654 5 17.75Z" fill="currentColor"></path><path opacity="0.5" d="M16 17.75C16 17.0478 16 16.6967 16.1685 16.4444C16.2415 16.3352 16.3352 16.2415 16.4444 16.1685C16.6967 16 17.0478 16 17.75 16C18.4522 16 18.8033 16 19.0556 16.1685C19.1648 16.2415 19.2585 16.3352 19.3315 16.4444C19.5 16.6967 19.5 17.0478 19.5 17.75C19.5 18.4522 19.5 18.8033 19.3315 19.0556C19.2585 19.1648 19.1648 19.2585 19.0556 19.3315C18.8033 19.5 18.4522 19.5 17.75 19.5C17.0478 19.5 16.6967 19.5 16.4444 19.3315C16.3352 19.2585 16.2415 19.1648 16.1685 19.0556C16 18.8033 16 18.4522 16 17.75Z" fill="currentColor"></path></svg>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-slate-900 dark:text-white">{t('scan_personal_qr', 'Scan Personal QR')}</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">{t('fast_lens_access', 'Fast Lens Access')}</p>
                                        </div>
                                    </div>
                                    <IconArrowRight size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                                </button>

                                <button 
                                    onClick={() => setStatus('form')}
                                    className="flex items-center justify-between p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-primary/5 hover:border-primary/30 transition-all group active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" color="none" fill="none" viewBox="0 0 24 24"><path opacity="0.5" d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12C22 15.7712 22 17.6569 20.8284 18.8284C19.6569 20 17.7712 20 14 20H10C6.22876 20 4.34315 20 3.17157 18.8284C2 17.6569 2 15.7712 2 12Z" stroke="currentColor" stroke-width="1.5"></path><path d="M6 8L8.1589 9.79908C9.99553 11.3296 10.9139 12.0949 12 12.0949C13.0861 12.0949 14.0045 11.3296 15.8411 9.79908L18 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-slate-900 dark:text-white">{t('account_login', 'Account Login')}</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">{t('using_email_pass', 'Using Email/Pass')}</p>
                                        </div>
                                    </div>
                                    <IconArrowRight size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                                </button>
                            </div>
                        </div>
                    )}

                    {status === 'form' && (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                                        {t('access_account', 'Access Account.')}
                                    </h1>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {t('sign_in_workspace', 'Sign in to your workspace.')}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setStatus('decision')}
                                    className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                    <IconArrowLeft size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCredentialLogin} className="flex flex-col gap-5">
                                <div className="flex flex-col gap-1.5 text-left">
                                    <label className="text-[11px] font-bold tracking-wide uppercase text-slate-500 dark:text-slate-400 ml-1">
                                        {t('email_address', 'Email Address')}
                                    </label>
                                    <div className="relative">
                                        <IconMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                                        <input
                                            type="email"
                                            placeholder={t('email_placeholder', 'name@company.com')}
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            required
                                            className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5 text-left">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-[11px] font-bold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                                            {t('secure_password', 'Secure Password')}
                                        </label>
                                    </div>
                                    <div className="relative">
                                        <IconLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                                        <input
                                            type="password"
                                            placeholder={t('password_placeholder', '••••••••••')}
                                            value={formData.password}
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            required
                                            className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loggingIn}
                                    className="flex items-center justify-center gap-2 w-full h-12 mt-2 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 text-white text-sm font-bold tracking-wide shadow-lg shadow-primary/30 transition-all duration-150"
                                >
                                    {loggingIn ? (
                                        <IconLoader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            {t('sign_in', 'Sign In')}
                                            <IconArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {status === 'scan' && (
                        <div className="animate-in fade-in duration-500">
                            <div id="qr-reader-temp" className="hidden"></div>
                            <IdentityScanner 
                                onScanSuccess={authenticate}
                                onClose={() => setStatus('decision')}
                                onFileScan={handleFileScan}
                                title={t('personal_authenticator', 'Personal Authenticator')}
                                description={t('align_qr_frame', 'Align your unique QR code within the frame')}
                            />
                        </div>
                    )}

                    {status === 'loading' && (
                        <div className="flex flex-col items-center gap-4 py-10 animate-in fade-in duration-300">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
                                <IconLoader2 size={48} className="animate-spin text-primary relative z-10" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('verifying_lens', 'Verifying Lens')}</h2>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">{message}</p>
                            </div>
                        </div>
                    )}



{status === 'success' && (
    <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="flex items-center justify-center p-6"
    >
        <div className="max-w-md w-full text-center space-y-6">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                className="w-24 h-24 bg-emerald-500 text-white ring-1 ring-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30"
            >
                <IconCheck size={56} strokeWidth={2.5} />
            </motion.div>

            <div className="space-y-3">
                <h2 className="text-3xl font-black tracking-tight text-slate-900">
                    {t('access_granted', 'Access Granted')}
                </h2>
                <p className="text-slate-600 font-medium leading-relaxed">
                    {t('welcome_back', { name: employeeName })}
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-emerald-50 border border-emerald-200"
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                    <IconLoader2 size={16} className="text-emerald-600" />
                </motion.div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                    {t('launching_workspace', 'Launching Workspace')}
                </span>
            </motion.div>
        </div>
    </motion.div>
)}

{status === 'error' && (
    <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="flex items-center justify-center p-6"
    >
        <div className="max-w-md w-full text-center space-y-6">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                className="w-24 h-24 bg-red-500 text-white ring-1 ring-red-200 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-500/30"
            >
                <IconX size={56} strokeWidth={2.5} />
            </motion.div>

            <div className="space-y-3">
                <h2 className="text-3xl font-black tracking-tight text-slate-900">
                    {t('access_warning', 'Access Warning')}
                </h2>
                <p className="text-slate-600 font-medium leading-relaxed">
                    {message}
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col gap-3 w-full"
            >
                {isDeviceMismatch && (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleTransferAccount}
                        disabled={loggingIn}
                        className="w-full h-12 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-500/20 uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                        {loggingIn ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            >
                                <IconLoader2 size={16} />
                            </motion.div>
                        ) : (
                            t('transfer_account', 'Transfer Account')
                        )}
                    </motion.button>
                )}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        setStatus('decision');
                        setIsDeviceMismatch(false);
                        setRetryData(null);
                    }}
                    className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all shadow-lg uppercase tracking-wider"
                >
                    {t('try_again', 'Try Again')}
                </motion.button>
            </motion.div>
        </div>
    </motion.div>
)}
                </div>

                {/* Secured Footer Divider */}
                <div className="mt-8">
                    <p className="text-[11px] text-slate-400 dark:text-slate-600 font-medium text-center">
                        © {new Date().getFullYear()} SCC Group. All rights reserved.
                    </p>
                </div>
            </div>
            <PwaToaster />
        </div>
    );
}

// Helper icons

const styles = `
.animate-laser {
    animation: laser 2.5s ease-in-out infinite;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}
