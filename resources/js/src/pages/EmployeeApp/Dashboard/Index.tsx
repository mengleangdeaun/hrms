import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate, NavLink } from 'react-router-dom';
import { IconChevronRight, IconX, IconLoader2, IconUser, IconBell } from '@tabler/icons-react';
import { pwaCache } from '@/lib/pwa-cache';
import { cn, getLocalizedMilestone } from '@/lib/utils';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import { TopBanner } from './components/TopBanner';
import { HomeCarousel } from './components/HomeCarousel';
import { AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/context/NotificationContext';
import { SmartClockCard } from './components/SmartClockCard';
import { CelebrationPopup } from './components/CelebrationPopup';
import { useAttendance } from '@/context/AttendanceContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { pwaFetch } from '@/lib/pwa-fetch';

const getQuotes = (t: any) => [
    t('quote_1', 'Do it well in what we do.'),
    t('quote_2', 'Focus on progress, not perfection.'),
    t('quote_3', 'Be the reason someone smiles today.'),
    t('quote_4', 'Work hard, stay focused, and never give up.'),
    t('quote_5', 'Your hard work will pay off!'),
    t('quote_6', "Let's build something great together."),
    t('quote_7', 'Every challenge is an opportunity.'),
    t('quote_8', 'Small wins lead to big victories.'),
    t('quote_9', 'Commited in what we do.'),
    t('quote_10', 'Together we will achieve great things.'),
    t('quote_11', 'Keep Doing, Keep Creating.'),
    t('quote_12', 'Your effort will be rewarded.'),
];

const getTimeGreeting = (t: any) => {
    const hour = new Date().getHours();
    if (hour < 12) return t('good_morning', 'Good Morning');
    if (hour < 18) return t('good_afternoon', 'Good Afternoon');
    return t('good_evening', 'Good Evening');
};

export default function EmployeePwaDashboard() {
    const { t } = useTranslation('pwa');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const cachedData = pwaCache.get('dashboard_data');
    const [loading, setLoading] = useState(!cachedData);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [dashboardData, setDashboardData] = useState<any>(cachedData);
    const [featured, setFeatured] = useState<any>(null);
    const [showFeatured, setShowFeatured] = useState(false);
    const { unreadCount } = useNotifications();

    // PWA Announcement States
    const [allAnnouncements, setAllAnnouncements] = useState<any[]>([]);
    const [topBanners, setTopBanners] = useState<any[]>([]);
    const [carouselBanners, setCarouselBanners] = useState<any[]>([]);
    const [popupBanner, setPopupBanner] = useState<any | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [randomQuote, setRandomQuote] = useState('');
    const { setTodayShift, todayShift } = useAttendance();

    useEffect(() => {
        const quotes = getQuotes(t);
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        setRandomQuote(quote);
    }, [t]);

    useEffect(() => {
        if (dashboardData?.celebration) {
            const key = `celebration_shown_${dashboardData.celebration.type}_${new Date().toDateString()}`;
            if (!localStorage.getItem(key)) {
                setShowCelebration(true);
                localStorage.setItem(key, 'true');
            }
        }
    }, [dashboardData]);

    useEffect(() => {
        dispatch(setPageTitle('Dashboard'));
    }, [dispatch]);

    // Live clock ticker
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('employee_auth_token');
        if (!token) {
            navigate('/employee/login');
            return;
        }

        const headers = {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        };

        // OFFLINE GUARD: Use cached data silently if offline
        if (!navigator.onLine) {
            setLoading(false);
            return;
        }

        try {
            // Fetch Dashboard Data
            const dashRes = await pwaFetch('/api/employee-app/dashboard', { headers });
            if (dashRes.status === 401) {
                localStorage.removeItem('employee_auth_token');
                navigate('/employee/login');
                return;
            }
            if (dashRes.ok) {
                const data = await dashRes.json();
                setDashboardData(data);
                pwaCache.set('dashboard_data', data);

                // Update Attendance Context with the merged shift data
                if (data.today_shift) {
                    setTodayShift(data.today_shift);
                }
            }

            // Fetch Announcements
            const annRes = await pwaFetch('/api/employee-app/announcements', { headers });
            if (annRes.ok) {
                const announcements = await annRes.json();
                setAllAnnouncements(announcements);

                // Local storage for tracking dismissed announcements
                const seenIdsStr = localStorage.getItem('seen_announcement_ids') || '[]';
                const seenIds: number[] = JSON.parse(seenIdsStr);

                // Session storage for tracking dismissed announcements in current session
                const sessionSeenStr = sessionStorage.getItem('session_dismissed_announcements') || '[]';
                const sessionSeenIds: number[] = JSON.parse(sessionSeenStr);

                // Filter into categories
                const filteredTop = announcements.filter((a: any) => a.pwa_display_type === 'top_banner' && (!a.pwa_show_once || !seenIds.includes(a.id)) && !sessionSeenIds.includes(a.id));
                const filteredCarousel = announcements.filter(
                    (a: any) => a.pwa_display_type === 'home_image_section' && (!a.pwa_show_once || !seenIds.includes(a.id)) && !sessionSeenIds.includes(a.id),
                );
                const filteredPopups = announcements.filter((a: any) => a.pwa_display_type === 'home_popup' && (!a.pwa_show_once || !seenIds.includes(a.id)) && !sessionSeenIds.includes(a.id));

                setTopBanners(filteredTop);
                setCarouselBanners(filteredCarousel);

                // Show latest popup only
                if (filteredPopups.length > 0) {
                    setPopupBanner(filteredPopups[0]);
                    setShowFeatured(true);
                }
            }
        } catch (e) {
            console.error('Dashboard Fetch Error:', e);
            if (navigator.onLine) {
                toast.error('Network error');
            }
        } finally {
            setLoading(false);
        }
    };

    // Safety timeout to ensure loader disappears after 10s
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (loading) {
                console.warn('PWA Loader safety timeout reached');
                setLoading(false);
            }
        }, 10000);
        return () => clearTimeout(timeout);
    }, [loading]);

    useEffect(() => {
        fetchData();

        // Listen for real-time updates from PwaNotificationListener
        window.addEventListener('pwa-new-notification', fetchData);
        window.addEventListener('pwa-refresh', fetchData);
        return () => {
            window.removeEventListener('pwa-new-notification', fetchData);
            window.removeEventListener('pwa-refresh', fetchData);
        };
    }, []); // Only once on mount or when notification/refresh arrives

    const handleDismiss = (id: number, type: 'top' | 'carousel' | 'popup') => {
        // Always track in session storage even if not pwa_show_once
        const sessionSeenStr = sessionStorage.getItem('session_dismissed_announcements') || '[]';
        const sessionSeenIds: number[] = JSON.parse(sessionSeenStr);
        if (!sessionSeenIds.includes(id)) {
            sessionSeenIds.push(id);
            sessionStorage.setItem('session_dismissed_announcements', JSON.stringify(sessionSeenIds));
        }

        const seenIdsStr = localStorage.getItem('seen_announcement_ids') || '[]';
        const seenIds: number[] = JSON.parse(seenIdsStr);
        if (!seenIds.includes(id)) {
            // Only add to localStorage if the announcement specifically asks to be shown ONCE forever
            // We search for the announcement in our current state to check its pwa_show_once property
            const announcement = allAnnouncements.find((a) => a.id === id);
            if (announcement?.pwa_show_once) {
                seenIds.push(id);
                localStorage.setItem('seen_announcement_ids', JSON.stringify(seenIds));
            }
        }

        if (type === 'top') {
            setTopBanners((prev) => prev.filter((b) => b.id !== id));
        } else if (type === 'popup') {
            setShowFeatured(false);
            setPopupBanner(null);
        }
    };

    const { employee, today_status, clock_in_time, session_1_out_time, session_2_in_time, clock_out_time } = dashboardData || {
        employee: { name: '...', designation: 'Refreshing...', profile_image: null, profile_image_url: null, department: '...' },
        today_status: null,
        clock_in_time: null,
        session_1_out_time: null,
        session_2_in_time: null,
        clock_out_time: null,
    };

    // Status indicator
    let statusBg = 'bg-white dark:bg-white text-primary';
    let statusText: string | null = today_status ?? t('not_clocked_in', 'Not Clocked In');
    let isActive = false;

    if (clock_in_time && !clock_out_time) {
        isActive = true;
        statusBg = 'bg-white dark:bg-white text-green-700 ';

        if (session_1_out_time && !session_2_in_time) {
            statusText = t('on_break_status', 'On Break');
            isActive = false; // Physically not working
            statusBg = 'bg-white dark:bg-white text-orange-700';
        } else {
            statusText = t('working_active', 'Working · Active');
        }
    } else if (clock_out_time) {
        statusBg = 'bg-white dark:bg-white text-blue-700';
        statusText = t('shift_completed', 'Shift Completed');
    } else if (!today_status || today_status === 'Not Clocked In' || today_status === 'Absent') {
        statusText = null;
    }

    // Feature menu definition
    const features = [
        {
            label: t('attendance', 'Attendance'),
            sub: t('view_history', 'View your history'),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" color="none" fill="none" viewBox="0 0 24 24">
                    <path d="M12 7V12L14.5 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"></circle>
                    <path opacity="0.5" d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                </svg>
            ),
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
            path: '/employee/history',
        },
        {
            label: t('activity', 'Activity'),
            sub: t('log_activity', 'Log field activity'),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" color="none" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="13" r="3" stroke="currentColor" stroke-width="1.5"></circle>
                    <path
                        opacity="0.5"
                        d="M9.77778 21H14.2222C17.3433 21 18.9038 21 20.0248 20.2646C20.51 19.9462 20.9267 19.5371 21.251 19.0607C22 17.9601 22 16.4279 22 13.3636C22 10.2994 22 8.76721 21.251 7.6666C20.9267 7.19014 20.51 6.78104 20.0248 6.46268C19.3044 5.99013 18.4027 5.82123 17.022 5.76086C16.3631 5.76086 15.7959 5.27068 15.6667 4.63636C15.4728 3.68489 14.6219 3 13.6337 3H10.3663C9.37805 3 8.52715 3.68489 8.33333 4.63636C8.20412 5.27068 7.63685 5.76086 6.978 5.76086C5.59733 5.82123 4.69555 5.99013 3.97524 6.46268C3.48995 6.78104 3.07328 7.19014 2.74902 7.6666C2 8.76721 2 10.2994 2 13.3636C2 16.4279 2 17.9601 2.74902 19.0607C3.07328 19.5371 3.48995 19.9462 3.97524 20.2646C5.09624 21 6.65675 21 9.77778 21Z"
                        stroke="currentColor"
                        stroke-width="1.5"
                    ></path>
                    <path d="M19 10H18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                </svg>
            ),
            iconBg: 'bg-orange-100 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400',
            path: '/employee/activity',
        },
        {
            label: t('leave', 'Leave'),
            sub: t('request_time_off', 'Request time off'),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" color="none" fill="none" viewBox="0 0 24 24">
                    <path
                        d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12V14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14V12Z"
                        stroke="currentColor"
                        stroke-width="1.5"
                    ></path>
                    <path d="M18 16L16 16M16 16L14 16M16 16L16 14M16 16L16 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                    <path opacity="0.5" d="M7 4V2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                    <path opacity="0.5" d="M17 4V2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                    <path opacity="0.5" d="M2 9H22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                </svg>
            ),
            iconBg: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
            path: '/employee/leave',
        },
        {
            label: t('day_off', 'Day Off'),
            sub: t('your_rest_schedule', 'Your rest schedule'),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24">
                    <path
                        d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12V14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14V12Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    ></path>
                    <path opacity="0.5" d="M7 4V2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                    <path opacity="0.5" d="M17 4V2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                    <path opacity="0.5" d="M2 9H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                    <path d="M9 16L11 14L13 16L15 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
            ),
            iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
            path: '/employee/day-off',
        },
        {
            label: t('my_calendar', 'My Calendar'),
            sub: t('view_schedule', 'View your schedule'),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" color="none" fill="none" viewBox="0 0 24 24">
                    <path
                        d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12V14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14V12Z"
                        stroke="currentColor"
                        stroke-width="1.5"
                    ></path>
                    <path opacity="0.5" d="M7 4V2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                    <path d="M17 4V2.5" opacity="0.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                    <path opacity="0.5" d="M2 9H22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                    <circle cx="16.5" cy="16.5" r="1.5" stroke="currentColor" stroke-width="1.5"></circle>
                </svg>
            ),
            iconBg: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
            path: '/employee/calendar',
        },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#060818]">
            <AnimatePresence>
                {topBanners.map((banner) => (
                    <TopBanner
                        key={banner.id}
                        id={banner.id}
                        title={banner.title}
                        pwa_title={banner.pwa_title}
                        type={banner.type}
                        actionLabel={banner.pwa_action_label}
                        onAction={() => banner.pwa_action_url && (banner.pwa_action_url.startsWith('http') ? window.open(banner.pwa_action_url, '_blank') : navigate(banner.pwa_action_url))}
                        onDismiss={() => handleDismiss(banner.id, 'top')}
                    />
                ))}
            </AnimatePresence>
            {/* Hero Header - Redesigned White Theme Header */}
            <div className="bg-gray-50 dark:bg-[#060818] text-slate-900 dark:text-white px-4 mx-0 pt-6 pb-3 sticky top-0 z-40 rounded-b-3xl overflow-hidden border-none">                
                <div className="relative z-10 flex justify-between items-start gap-4">
                    {/* Left Section: Greeting & User Info */}
                    <div className="flex-1 min-w-0">
                        {loading ? (
                            <div className="space-y-2">
                                <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                                <div className="h-4 w-56 bg-slate-50 dark:bg-slate-800/50 rounded-lg animate-pulse" />
                            </div>
                        ) : dashboardData?.celebration ? (
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xl font-black tracking-tight">
                                    {dashboardData.celebration.type === 'birthday' ? (
                                        <span className="text-2xl">🎂</span>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" color="none" fill="none" viewBox="0 0 24 24" className="text-amber-500">
                                            <path
                                                fill-rule="evenodd"
                                                clip-rule="evenodd"
                                                d="M15.6021 2.42216C15.3823 2.20239 15.1058 2.21205 14.9542 2.23217C14.8108 2.25119 14.6391 2.30006 14.4755 2.34661L14.3495 2.38242L14.2471 2.31779C14.1085 2.23026 13.9596 2.13623 13.8272 2.07867C13.6778 2.01375 13.4257 1.93989 13.1608 2.07911C12.901 2.21567 12.8154 2.46014 12.7801 2.61571C12.7479 2.75726 12.7341 2.93427 12.7211 3.10261L12.7111 3.23012L12.7103 3.24075L12.5987 3.33259C12.4654 3.44226 12.3271 3.55608 12.229 3.66333C12.125 3.77695 11.9648 3.99043 12.0055 4.28767C12.0476 4.59506 12.2702 4.75445 12.4093 4.83159C12.5353 4.90144 12.701 4.96261 12.8556 5.01961L12.9644 5.05983L13.0046 5.1687C13.0616 5.3232 13.1228 5.489 13.1927 5.61495C13.2698 5.75405 13.4292 5.97665 13.7366 6.01874C14.0338 6.05944 14.2473 5.8992 14.3609 5.79528C14.4682 5.69717 14.582 5.55884 14.6917 5.42554L14.7835 5.31397L14.7941 5.31313L14.9216 5.30319C15.09 5.29011 15.267 5.27635 15.4085 5.24417C15.5641 5.2088 15.8086 5.12329 15.9451 4.86346C16.0844 4.59857 16.0105 4.34645 15.9456 4.19709C15.888 4.06467 15.794 3.9158 15.7065 3.77723L15.6418 3.67478L15.6776 3.54877C15.7242 3.38517 15.7731 3.21343 15.7921 3.07009C15.8122 2.91841 15.8219 2.64192 15.6021 2.42216Z"
                                                fill="currentColor"
                                            ></path>
                                            <path
                                                d="M10.1867 2.16087C10.5401 2.37692 10.6515 2.83856 10.4354 3.19196C10.2786 3.44841 10.3179 3.77888 10.5305 3.99142L10.6283 4.0893C11.217 4.67795 11.4341 5.54273 11.1932 6.3396C11.0733 6.7361 10.6548 6.96036 10.2583 6.84051C9.86176 6.72066 9.6375 6.30208 9.75735 5.90558C9.83823 5.638 9.76534 5.34762 9.56768 5.14996L9.4698 5.05208C8.76728 4.34955 8.6374 3.25725 9.15561 2.40958C9.37166 2.05618 9.83329 1.94483 10.1867 2.16087Z"
                                                fill="currentColor"
                                            ></path>
                                            <path
                                                d="M21.4091 13.5812C21.0474 13.4231 20.6268 13.4895 20.3314 13.7514C19.5221 14.469 18.3445 14.5883 17.4078 14.0475L17.195 13.9246C16.8362 13.7175 16.7133 13.2588 16.9204 12.9001C17.1275 12.5414 17.5862 12.4185 17.945 12.6256L18.1578 12.7484C18.5353 12.9664 19.01 12.9184 19.3362 12.6291C20.069 11.9793 21.1126 11.8145 22.0101 12.2068L22.3015 12.3343C22.6811 12.5002 22.8542 12.9424 22.6883 13.3219C22.5223 13.7015 22.0801 13.8746 21.7006 13.7087L21.4091 13.5812Z"
                                                fill="currentColor"
                                            ></path>
                                            <path
                                                d="M12.9163 7.17885C12.7068 6.96938 12.3672 6.96938 12.1577 7.17885C11.9483 7.38832 11.9483 7.72793 12.1577 7.9374C12.3672 8.14687 12.7068 8.14687 12.9163 7.9374C13.1257 7.72793 13.1257 7.38832 12.9163 7.17885Z"
                                                fill="currentColor"
                                            ></path>
                                            <path
                                                fill-rule="evenodd"
                                                clip-rule="evenodd"
                                                d="M22.5242 8.86414C22.7801 9.41805 22.6074 10.0469 22.1403 10.514C21.8694 10.7849 21.5064 10.9076 21.1831 10.9651C20.8524 11.0239 20.5029 11.0251 20.1966 11.0055C19.8874 10.9857 19.6038 10.9434 19.3988 10.9066C19.2957 10.888 19.2112 10.8707 19.1516 10.8577C19.1218 10.8512 19.0982 10.8458 19.0815 10.8419L19.0617 10.8372L19.0559 10.8358L19.0541 10.8354L19.053 10.8351C18.8729 10.7905 18.7323 10.65 18.6877 10.4699L19.1731 10.3498C18.6877 10.4699 18.6875 10.4688 18.6875 10.4688L18.687 10.4669L18.6856 10.4611L18.6809 10.4414C18.677 10.4247 18.6716 10.401 18.6652 10.3712C18.6522 10.3116 18.6348 10.2271 18.6163 10.1241C18.5795 9.91904 18.5372 9.63547 18.5174 9.32622C18.4978 9.01998 18.4989 8.67041 18.5578 8.33971C18.6152 8.01645 18.7379 7.65343 19.0088 7.38256C19.476 6.91542 20.1048 6.74276 20.6587 6.99861C21.0789 7.19269 21.3522 7.58546 21.4551 8.06776C21.9374 8.17068 22.3302 8.44397 22.5242 8.86414Z"
                                                fill="currentColor"
                                            ></path>
                                            <g opacity="0.5">
                                                <path
                                                    d="M17.69 4.74357C18.0962 4.8248 18.3596 5.21992 18.2784 5.62609L18.1344 6.34603C17.9362 7.33684 17.2224 8.14551 16.2638 8.46504C15.8159 8.61435 15.4823 8.99222 15.3897 9.4552L15.2457 10.1751C15.1645 10.5813 14.7693 10.8447 14.3632 10.7635C13.957 10.6822 13.6936 10.2871 13.7748 9.88096L13.9188 9.16103C14.117 8.17021 14.8308 7.36154 15.7894 7.04201C16.2374 6.89271 16.5709 6.51484 16.6635 6.05185L16.8075 5.33192C16.8887 4.92575 17.2839 4.66233 17.69 4.74357Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M6.92859 3.96277C7.13805 3.7533 7.47767 3.7533 7.68714 3.96277C7.89661 4.17223 7.89661 4.51185 7.68714 4.72132C7.47767 4.93079 7.13805 4.93079 6.92859 4.72132C6.71912 4.51185 6.71912 4.17223 6.92859 3.96277Z"
                                                    fill="currentColor"
                                                ></path>
                                            </g>
                                            <path
                                                opacity="0.7"
                                                d="M19.817 15.3353C19.6076 15.1259 19.2679 15.1259 19.0585 15.3353C18.849 15.5448 18.849 15.8844 19.0585 16.0939C19.2679 16.3033 19.6076 16.3033 19.817 16.0939C20.0265 15.8844 20.0265 15.5448 19.817 15.3353Z"
                                                fill="currentColor"
                                            ></path>
                                            <path
                                                opacity="0.2"
                                                d="M17.1581 10.1791C17.3675 9.96961 17.7072 9.96961 17.9166 10.1791C18.1261 10.3885 18.1261 10.7282 17.9166 10.9376C17.7072 11.1471 17.3675 11.1471 17.1581 10.9376C16.9486 10.7282 16.9486 10.3885 17.1581 10.1791Z"
                                                fill="currentColor"
                                            ></path>
                                            <path
                                                opacity="0.5"
                                                d="M4.01207 15.7618L5.70156 10.6933C6.46758 8.39525 6.85059 7.24623 7.75684 7.03229C8.6631 6.81835 9.51953 7.67478 11.2324 9.38764L14.6114 12.7666C16.3242 14.4795 17.1807 15.3359 16.9667 16.2422C16.7528 17.1484 15.6038 17.5314 13.3057 18.2975L8.23724 19.987L8.23723 19.987C5.47182 20.9088 4.08912 21.3697 3.35924 20.6398C2.62936 19.9099 3.09026 18.5272 4.01207 15.7618Z"
                                                fill="currentColor"
                                            ></path>
                                            <path
                                                d="M8.8001 7.50424L8.85072 7.25922C8.45761 7.02857 8.111 6.94867 7.75679 7.03229C7.61235 7.06638 7.4812 7.12423 7.35967 7.2067L8.05611 7.35058C7.57757 7.25172 7.41498 7.21808 7.35967 7.2067C7.34804 7.2146 7.3364 7.22279 7.32494 7.23114L7.31964 7.25736C7.31242 7.29328 7.30199 7.34575 7.28885 7.41325C7.26258 7.54824 7.22547 7.74345 7.18165 7.98662C7.09406 8.47264 6.97937 9.15184 6.87078 9.92573C6.65564 11.4589 6.45638 13.4179 6.55904 14.9834C6.62115 15.9306 6.81822 17.1057 6.9941 18.0238C7.08286 18.4872 7.16784 18.8933 7.23066 19.1838C7.26209 19.3291 7.28803 19.4457 7.30619 19.5264L7.32733 19.6195L7.333 19.6441L7.33493 19.6525C7.33494 19.6526 7.33512 19.6533 8.0656 19.4833L7.33493 19.6525L7.47191 20.2412C7.71447 20.1612 7.96933 20.0762 8.23717 19.987L8.90132 19.7656L8.79453 19.3066L8.78944 19.2845L8.76953 19.1968C8.75221 19.1199 8.7272 19.0075 8.69676 18.8667C8.63584 18.585 8.55336 18.1909 8.46732 17.7416C8.29357 16.8346 8.11155 15.7351 8.05582 14.8852C7.96377 13.4814 8.1436 11.6495 8.35623 10.1342C8.46152 9.38377 8.57288 8.72427 8.65787 8.25265C8.70034 8.017 8.73615 7.82867 8.76123 7.69981C8.77376 7.63539 8.78361 7.58587 8.79026 7.55277L8.79777 7.51563L8.7996 7.50665L8.8001 7.50424Z"
                                                fill="currentColor"
                                            ></path>
                                            <path
                                                d="M13.0393 18.3863L11.6162 18.8606L11.5238 18.5826L12.2356 18.3461C11.5238 18.5826 11.5239 18.5827 11.5238 18.5826L11.5229 18.5798L11.5209 18.5738L11.5138 18.552C11.5077 18.5333 11.499 18.5064 11.4881 18.472C11.4663 18.4031 11.4354 18.3042 11.3986 18.1811C11.325 17.9354 11.227 17.5917 11.1288 17.1985C10.9367 16.4293 10.7274 15.407 10.7274 14.5552C10.7274 13.7034 10.9367 12.6811 11.1288 11.9119C11.227 11.5187 11.325 11.175 11.3986 10.9293C11.4354 10.8062 11.4663 10.7073 11.4881 10.6384C11.499 10.604 11.5077 10.5771 11.5138 10.5584L11.5209 10.5366L11.5229 10.5305L11.5235 10.5287C11.5235 10.5287 11.5238 10.5278 12.2356 10.7643L11.5238 10.5278L11.7355 9.89084L12.9224 11.0777C12.921 11.0824 12.9194 11.0872 12.9178 11.0922C12.8982 11.154 12.8698 11.245 12.8356 11.3594C12.767 11.5886 12.6755 11.9095 12.5841 12.2753C12.3971 13.0241 12.2274 13.8973 12.2274 14.5552C12.2274 15.2131 12.3971 16.0863 12.5841 16.8351C12.6755 17.2009 12.767 17.5218 12.8356 17.751C12.8698 17.8654 12.8982 17.9564 12.9178 18.0182C12.9276 18.0491 12.9352 18.0727 12.9403 18.0881L12.9458 18.1052L12.9471 18.109L13.0393 18.3863Z"
                                                fill="currentColor"
                                            ></path>
                                        </svg>
                                    )}
                                    <span className="text-xl font-black tracking-tight">
                                        {t(`happy_${dashboardData.celebration.type}`, {
                                            milestone: getLocalizedMilestone(dashboardData.celebration.milestone, t),
                                            defaultValue: `Happy ${dashboardData.celebration.milestone}!`,
                                        })}
                                    </span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center gap-1.5">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                    {t('special_day_msg', 'This is your day!')}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <h1 className="text-2xl font-black tracking-tight leading-tight text-primary">
                                    {getTimeGreeting(t)}!
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium truncate">
                                    {randomQuote || employee.designation}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Section: Avatar with Notification Badge */}
                    <div className="relative">
                        <Avatar
                            onClick={() => navigate('/employee/profile')}
                            className={cn(
                                'w-12 h-12 border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 cursor-pointer active:scale-95 transition-all duration-200 hover:scale-105 hover:border-primary/30',
                                loading && 'animate-pulse border-slate-100 dark:border-slate-800'
                            )}
                        >
                            <AvatarImage src={employee.profile_image_url} alt={employee.name} className="object-cover" />
                            <AvatarFallback className="text-lg font-black bg-primary/10 text-primary">
                                {employee.name ? employee.name.charAt(0).toUpperCase() : <IconUser size={20} />}
                            </AvatarFallback>
                        </Avatar>
                </div>
            </div>
        </div>

            <div className="px-4 mt-4 z-10 space-y-5 pb-28 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {!loading && (
                    <div className="space-y-3">
                        <SmartClockCard />
                    </div>
                )}
                
                {loading ? (
                    <div className="space-y-5 animate-pulse">
                        {/* Smart Clock Skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl h-44 shadow-sm border border-gray-100 dark:border-gray-700" />

                        {/* Carousel Skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl h-48 shadow-sm border border-gray-100 dark:border-gray-700" />

                        {/* Feature Menu Skeleton */}
                        <div className="space-y-3">
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded ml-1" />
                            <div className="grid grid-cols-2 gap-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl h-32 shadow-sm border border-gray-100 dark:border-gray-700" />
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Image Section / Announcements Carousel */}
                        <HomeCarousel announcements={carouselBanners} />

                        {/* Feature Menu */}
                        <div>
                            <p className="text-[12px] font-black uppercase text-gray-400 mb-3 ml-1">{t('quick_access', 'Quick Access')}</p>
                            <div className="grid grid-cols-2 gap-3">
                                {features.map((feature) => (
                                    <div className="bg-gray-50 dark:bg-gray-900 p-1.5 border border-white dark:border-gray-800 rounded-2xl overflow-hidden">
                                        <NavLink
                                            key={feature.label}
                                            to={feature.path}
                                            className="bg-[#FCFCFC] dark:bg-[#0e1726] rounded-[10px] p-4 shadow-md ring-1 ring-white dark:ring-0 flex flex-col gap-3 active:scale-[0.97] transition-transform"
                                        >
                                            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', feature.iconBg)}>{feature.icon}</div>
                                            <div>
                                                <p className="font-black text-sm text-gray-900 dark:text-white leading-tight">{feature.label}</p>
                                                <p className="text-[11px] text-gray-400 font-medium mt-0.5">{feature.sub}</p>
                                            </div>
                                            <IconChevronRight className="w-4 h-4 text-gray-300 self-end -mt-1" />
                                        </NavLink>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Featured Announcement Popup */}
            {showFeatured && popupBanner && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    {popupBanner.pwa_show_title === false && popupBanner.has_pwa_action === false ? (
                        /* Pure Image Splash Mode */
                        <div className="relative w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
                            <img src={popupBanner.featured_image_url} className="w-full h-auto object-contain max-h-[85vh] rounded-[2rem]" alt={popupBanner.title} />
                            <button
                                onClick={() => handleDismiss(popupBanner.id, 'popup')}
                                className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 active:scale-95 transition-all"
                            >
                                <IconX className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        /* Standard Modal Mode */
                        <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="bg-primary p-0 text-center relative overflow-hidden h-48">
                                {popupBanner.featured_image_url ? (
                                    <img src={popupBanner.featured_image_url} className="w-full h-full object-cover" alt={popupBanner.title} />
                                ) : (
                                    <div className="w-full h-full bg-primary flex flex-col items-center justify-center p-8">
                                        <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full" />
                                        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-white/10 rounded-full" />
                                        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30">
                                            <span className="text-4xl">📢</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-8 text-center">
                                {popupBanner.pwa_show_title !== false && (
                                    <h2 className="text-gray-900 dark:text-white text-2xl font-black leading-tight mb-3">{popupBanner.pwa_title || popupBanner.title}</h2>
                                )}
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8 font-medium">
                                    {popupBanner.short_description || 'You have a new important announcement from management. Please read the full details below.'}
                                </p>
                                <div className="flex flex-col gap-3">
                                    {popupBanner.has_pwa_action !== false &&
                                        (popupBanner.pwa_action_label && popupBanner.pwa_action_url ? (
                                            <button
                                                onClick={() => {
                                                    if (popupBanner.pwa_action_url.startsWith('http')) {
                                                        window.open(popupBanner.pwa_action_url, '_blank');
                                                    } else {
                                                        navigate(popupBanner.pwa_action_url);
                                                    }
                                                    if (popupBanner.pwa_show_once) handleDismiss(popupBanner.id, 'popup');
                                                }}
                                                className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-transform uppercase tracking-widest text-[11px]"
                                            >
                                                {popupBanner.pwa_action_label}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => navigate(`/employee/announcements/${popupBanner.id}`)}
                                                className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-transform uppercase tracking-widest text-[11px]"
                                            >
                                                {t('read_details', 'Read Details')}
                                            </button>
                                        ))}
                                    <button
                                        onClick={() => handleDismiss(popupBanner.id, 'popup')}
                                        className="w-full py-2 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-gray-600 transition-colors active:scale-95 mt-2"
                                    >
                                        {popupBanner.pwa_show_once ? t('dismiss', 'Dismiss Permanent') : t('maybe_later', 'Maybe Later')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {/* Celebration Popup */}
            {dashboardData?.celebration && (
                <CelebrationPopup isOpen={showCelebration} onClose={() => setShowCelebration(false)} employee={dashboardData.employee} celebration={dashboardData.celebration} />
            )}
        </div>
    );
}