import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { IconUserShield, IconUsers, IconArrowRight, IconLoader2, IconCircleCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

/**
 * Smart Redirect & Landing Page
 * Handles automatic routing for logged-in users and provides a clear
 * entry point for Administration vs Employee access.
 */
const Index = () => {
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();
    const { t } = useTranslation();
    const [isResolving, setIsResolving] = useState(true);


    useEffect(() => {
        // 1. Wait for auth to finish loading if we have a token
        if (isLoading) return;

        // 2. Priority: Employee Session (PWA)
        const employeeToken = localStorage.getItem('employee_auth_token');
        if (employeeToken && employeeToken !== 'null' && employeeToken !== 'undefined') {
            navigate('/employee/dashboard', { replace: true });
            return;
        }

        // 3. Admin Session
        if (user) {
            const isSuperAdmin = user.roles?.some((r: any) => r.slug === 'super-admin' || r.name === 'Super Admin');
            const p = user.permissions || [];

            if (isSuperAdmin || p.includes('view_hr') || p.includes('view_attendance')) {
                navigate('/hr/employees', { replace: true });
            } else {
                if (window.location.pathname === '/') {
                    navigate('/users/profile', { replace: true });
                }
            }
            return;
        }

        // 4. No sessions found - Smart Redirect based on device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const searchParams = new URLSearchParams(window.location.search);
        const source = searchParams.get('source');

        // If coming from PWA or standard root access, auto-route to best fit
        if (isMobile) {
            navigate('/employee/login' + (source ? `?source=${source}` : ''), { replace: true });
        } else {
            navigate('/auth/login' + (source ? `?source=${source}` : ''), { replace: true });
        }
    }, [user, isLoading, navigate, isResolving]);

    if (isResolving || isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                        <IconLoader2 size={48} className="animate-spin text-primary relative z-10" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:20px_20px]">
            {/* Background Orbs */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
            </div>

            <div className="w-full max-w-5xl z-10">
                {/* Header Section */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="flex justify-center mb-8">
                        <img 
                            src="/assets/images/logo-side.svg" 
                            alt="Logo" 
                            className="h-16 w-auto"
                        />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
                        HRMS <span className="text-primary">Portal</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                        Welcome to SCCG HRMS. Please select your workspace to continue to your dashboard.
                    </p>
                </motion.div>

                {/* Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Admin Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        whileHover={{ y: -8 }}
                        onClick={() => navigate('/auth/login')}
                        className="group cursor-pointer relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 shadow-inner shadow-black/5 dark:shadow-black/20 hover:border-primary/50 transition-colors"
                    >
             

                        <div className="relative z-10">
                            <div className="w-16 ring-1 ring-primary/20 shadow-inner  h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                                <IconUserShield size={32} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                                Administration
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                                Access the core HRMS system, manage employees, attendance, leave, settings, and other modules.
                            </p>
                            
                            <div className="flex items-center gap-2 text-primary font-bold group-hover:gap-4 transition-all">
                                <span>Enter System</span>
                                <IconArrowRight size={20} />
                            </div>
                        </div>

                        {/* Subtle Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </motion.div>

                    {/* Employee Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ y: -8 }}
                        onClick={() => navigate('/employee/login')}
                        className="group cursor-pointer relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10  shadow-inner shadow-black/5 dark:shadow-black/20 hover:border-blue-500/50 transition-colors"
                    >


                        <div className="relative z-10">
                            <div className="w-16 h-16 ring-1 ring-primary/20 shadow-inner  rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-8 group-hover:scale-110 transition-transform">
                                <IconUsers size={32} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                                Employee App
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                                Access your personalized dashboard, check-in, request leave, and view announcements.
                            </p>
                            
                            <div className="flex items-center gap-2 text-blue-500 font-bold group-hover:gap-4 transition-all">
                                <span>Employee Login</span>
                                <IconArrowRight size={20} />
                            </div>
                        </div>

                        {/* Subtle Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </motion.div>
                </div>

                {/* Footer Section */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-16 text-center"
                >
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                        &copy; {new Date().getFullYear()} SCC Group
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Index;
