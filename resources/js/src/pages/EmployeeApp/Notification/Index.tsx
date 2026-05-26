import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { pwaFetch } from '@/lib/pwa-fetch';
import { 
    IconBell, 
    IconBellOff, 
    IconChevronRight, 
    IconCalendarPlus, 
    IconCircleCheck, 
    IconCircleX, 
    IconCheck, 
    IconTrash,
    IconCake,
    IconConfetti,
    IconBriefcase,
    IconInfoCircle,
    IconSpeakerphone,
    IconAlertTriangle,
    IconLoader2
} from '@tabler/icons-react';
import PageHeader from '../../../components/ui/pwa/PageHeader';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import { pwaToast } from '@/utils/pwaToast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import updateLocale from 'dayjs/plugin/updateLocale';
import 'dayjs/locale/km';
import 'dayjs/locale/zh-cn';
import { useNotifications } from '@/context/NotificationContext';
import Loader from '@/components/ui/Loader';
import BottomSheet from '@/components/ui/bottom-sheet';
import { cn } from '@/lib/utils';
import { CelebrationNotificationHeader } from './components/CelebrationNotificationHeader';
import { PwaEmptyState } from '@/components/ui/pwa/pwa-empty-state';
import { PwaActionButton } from '@/components/ui/pwa/PwaActionButton';
import { motion } from 'framer-motion';

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(updateLocale);

// Configure English for short relative time
dayjs.updateLocale('en', {
    relativeTime: {
        future: "in %s",
        past: "%s ago",
        s: 'sec',
        m: "1 min",
        mm: "%d min",
        h: "1 h",
        hh: "%d h",
        d: "1 d",
        dd: "%d d",
        M: "1 mo",
        MM: "%d mo",
        y: "1 y",
        yy: "%d y"
    }
});

// Configure Khmer for specific seconds string
dayjs.updateLocale('km', {
    relativeTime: {
        future: "%sទៀត",
        past: "%sមុន",
        s: 'ប៉ុន្មានវិនាទី',
        m: '1 នាទី',
        mm: '%d នាទី',
        h: '1 ម៉ោង',
        hh: '%d ម៉ោង',
        d: '1 ថ្ងៃ',
        dd: '%d ថ្ងៃ',
        M: '1 ខែ',
        MM: '%d ខែ',
        y: '1 ឆ្នាំ',
        yy: '%d ឆ្នាំ'
    }
});

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    data: any;
    read_at: string | null;
    created_at: string;
}

type TabType = 'all' | 'announcement' | 'leave' | 'birthday' | 'anniversary' | 'other';

export default function NotificationIndex() {
    const { t } = useTranslation('pwa');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteAllNotifications } = useNotifications();

    // Sync dayjs locale with app language
    useEffect(() => {
        const lang = i18n.language === 'kh' ? 'km' : i18n.language === 'zh' ? 'zh-cn' : 'en';
        dayjs.locale(lang);
    }, [i18n.language]);

    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [celebrants, setCelebrants] = useState<any[]>([]);
    const [celebrantCount, setCelebrantCount] = useState(0);
    const [isCelebrantsLoading, setIsCelebrantsLoading] = useState(true);
    const [isConfirmDeleteAll, setIsConfirmDeleteAll] = useState(false);
    const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle(t('notifications', 'Notifications')));
        
        // Fetch global celebrations once
        const fetchCelebrants = async () => {
            const token = localStorage.getItem('employee_auth_token');
            if (!token) return;

            // OFFLINE GUARD
            if (!navigator.onLine) {
                setIsCelebrantsLoading(false);
                return;
            }

            try {
                const res = await pwaFetch('/api/employee-app/celebrations', {
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCelebrants(data);
                }
            } catch (err) {
                console.error('Failed to fetch celebrants:', err);
            } finally {
                setIsCelebrantsLoading(false);
            }
        };
        fetchCelebrants();

        window.addEventListener('pwa-refresh', fetchCelebrants);
        return () => window.removeEventListener('pwa-refresh', fetchCelebrants);
    }, [dispatch, t]);

    const handleMarkAllRead = async () => {
        setIsMarkingAllRead(true);
        try {
            await markAllAsRead();
        } finally {
            setIsMarkingAllRead(false);
        }
    };

    const getNotifData = (notif: Notification) => {
        // Defensive check: sometimes Echo events wrap data inside another 'data' key
        // or the data attribute is double encoded.
        const d = notif.data;
        if (!d) return {};
        if (typeof d === 'string') {
            try { return JSON.parse(d); } catch { return {}; }
        }
        // If data has a 'data' key and looks like a nested payload
        if (d.data && typeof d.data === 'object' && ('category' in d.data || 'pwa_action_url' in d.data)) {
            return d.data;
        }
        return d;
    };

    const getNotificationCategory = (notif: Notification): TabType => {
        const data = getNotifData(notif);
        
        // Priority 1: Specifically flagged celebrations
        if (data?.category === 'celebration' || data?.type === 'birthday' || data?.type === 'anniversary') {
            if (data.type === 'birthday' || notif.type.includes('Birthday')) return 'birthday';
            if (data.type === 'anniversary' || notif.type.includes('Anniversary')) return 'anniversary';
        }

        // Priority 2: Standard types
        if (notif.type === 'announcement' || notif.type.includes('Announcement') || data?.type === 'announcement') return 'announcement';
        if (notif.type.includes('leave') || data?.type?.includes('leave')) return 'leave';
        
        return 'other';
    };

    const filteredNotifications = useMemo(() => {
        if (activeTab === 'all') return notifications;
        return notifications.filter(n => getNotificationCategory(n) === activeTab);
    }, [notifications, activeTab]);

    const groupedNotifications = useMemo(() => {
        const groups: Record<string, Notification[]> = {};
        filteredNotifications.forEach(notif => {
            const date = dayjs(notif.created_at);
            let label = '';
            if (date.isToday()) label = t('today', 'Today');
            else if (date.isYesterday()) label = t('yesterday', 'Yesterday');
            else {
                // For older dates, use a clean localized format
                // In Khmer: ថ្ងៃចន្ទ, 28 មេសា
                label = date.format(i18n.language === 'kh' ? 'dddd, D MMMM' : 'dddd, MMM D');
            }

            if (!groups[label]) groups[label] = [];
            groups[label].push(notif);
        });
        return groups;
    }, [filteredNotifications, t]);

    const renderNotificationText = (text: string, notif: Notification) => {
        const data = getNotifData(notif);
        const placeholders = data?.placeholders || {};
        
        // Handle specialized placeholders like 'days' array
        const finalPlaceholders = { ...placeholders };
        if (Array.isArray(placeholders.days)) {
            finalPlaceholders.days = placeholders.days.map((d: string) => t(d.toLowerCase()) as string).join(', ');
        }

        return t(text, finalPlaceholders) as string;
    };

    const handleNotificationClick = (notif: Notification) => {
        const data = getNotifData(notif);
        console.log('[NotificationIndex] Clicked notification:', { type: notif.type, data });
        
        // Use the persisted action URL if available (best practice)
        const actionUrl = data?.pwa_action_url || data?.action_url || notif.data?.pwa_action_url;

        if (actionUrl) {
            navigate(actionUrl, { state: { notificationId: notif.id } });
            return;
        }

        // Fallback for legacy notifications without actionUrl
        const isAnnouncement = notif.type === 'announcement' || notif.type.includes('Announcement') || data?.type === 'announcement';
        
        const category = getNotificationCategory(notif);
        const isWishReceived = notif.type === 'wish_received' || data?.type === 'wish_received' || notif.type.includes('WishReceived');
        
        if (isAnnouncement && data?.announcement_id) {
            navigate(`/employee/announcements/${data.announcement_id}`, { state: { notificationId: notif.id } });
        } else if (isWishReceived) {
            navigate('/employee/wishes', { state: { notificationId: notif.id } });
        } else if (category === 'leave') {
            navigate('/employee/leave', { state: { notificationId: notif.id } });
        } else if (category === 'birthday' || category === 'anniversary' || data?.category === 'celebration') {
            // This is a "Today is X's Birthday" notification
            const celebrantId = data?.celebrant_id || data?.employee_id || data?.user_id;
            if (celebrantId) {
                navigate(`/employee/celebrations/${celebrantId}?type=${category === 'anniversary' ? 'anniversary' : 'birthday'}`, { state: { notificationId: notif.id } });
            } else {
                console.warn('[NotificationIndex] Celebration notification missing celebrant ID:', data);
            }
        }
    };

    const getIcon = (notif: Notification) => {
        const cat = getNotificationCategory(notif);
        if (cat === 'announcement') return { 
            icon: (props: any) => (
                <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} color="none" fill="none" viewBox="0 0 24 24" className={props.className}>
                    <path d="M1.53479 10.9714C1.60847 9.76255 1.64531 9.15814 1.95854 8.57679C2.24473 8.04563 2.7923 7.53042 3.33988 7.27707C3.93921 6.99979 4.62617 6.99979 6.00008 6.99979C6.51215 6.99979 6.76819 6.99979 7.0162 6.95791C7.26138 6.9165 7.50046 6.84478 7.72795 6.74438C7.95806 6.64283 8.17181 6.50189 8.59932 6.22002L8.81825 6.07566C11.3612 4.39898 12.6327 3.56063 13.7001 3.92487C13.9047 3.9947 14.1028 4.09551 14.2797 4.21984C15.2024 4.86829 15.2725 6.37699 15.4127 9.3944C15.4646 10.5117 15.5 11.4679 15.5 11.9998C15.5 12.5317 15.4646 13.4879 15.4127 14.6052C15.2725 17.6226 15.2024 19.1313 14.2797 19.7797C14.1028 19.9041 13.9047 20.0049 13.7001 20.0747C12.6327 20.4389 11.3612 19.6006 8.81825 17.9239L8.59932 17.7796C8.17181 17.4977 7.95806 17.3567 7.72795 17.2552C7.50046 17.1548 7.26138 17.0831 7.0162 17.0417C6.76819 16.9998 6.51215 16.9998 6.00008 16.9998C4.62617 16.9998 3.93921 16.9998 3.33988 16.7225C2.7923 16.4692 2.24473 15.9539 1.95854 15.4228C1.64531 14.8414 1.60847 14.237 1.53479 13.0282C1.51299 12.6706 1.5 12.3222 1.5 11.9998C1.5 11.6774 1.51299 11.329 1.53479 10.9714Z" stroke="currentColor" strokeWidth={props.stroke || 1.5}></path>
                        <path opacity="0.4" d="M20 6C20 6 21.5 7.8 21.5 12C21.5 16.2 20 18 20 18" stroke="currentColor" strokeWidth={props.stroke || 1.5} strokeLinecap="round"></path>
                        <path opacity="0.7" d="M18 9C18 9 18.5 9.9 18.5 12C18.5 14.1 18 15 18 15" stroke="currentColor" strokeWidth={props.stroke || 1.5} strokeLinecap="round"></path>
                </svg>
            ), 
            color: 'text-blue-500', 
            bg: 'bg-blue-50 dark:bg-blue-900/20', 
            ring: 'ring-blue-100 dark:ring-blue-900/30' 
        };
        if (cat === 'birthday') return { icon: IconCake, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20', ring: 'ring-pink-100 dark:ring-pink-900/30' };
        if (cat === 'anniversary') return { 
            icon: (props: any) => (
                <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} color="none" fill="none" viewBox="0 0 24 24" className={props.className}>
                    <path d="M4.01207 15.7618L5.70156 10.6933C6.46758 8.39525 6.85059 7.24623 7.75684 7.03229C8.6631 6.81835 9.51953 7.67478 11.2324 9.38764L14.6114 12.7666C16.3242 14.4795 17.1807 15.3359 16.9667 16.2422C16.7528 17.1484 15.6038 17.5314 13.3057 18.2975L8.23724 19.987C5.47183 20.9088 4.08912 21.3697 3.35924 20.6398C2.62936 19.9099 3.09026 18.5272 4.01207 15.7618Z" stroke="currentColor" strokeWidth={props.stroke || 1.5} strokeLinecap="round"></path>
                    <path opacity="0.5" d="M12.2351 18.3461C12.2351 18.3461 11.477 16.0649 11.477 14.5552C11.477 13.0454 12.2351 10.7643 12.2351 10.7643M8.06517 19.4833C8.06517 19.4833 7.42484 16.7314 7.307 14.9343C7.11229 11.965 8.06517 7.35254 8.06517 7.35254" stroke="currentColor" strokeWidth={props.stroke || 1.5} strokeLinecap="round"></path>
                    <path d="M14.5093 10.0061L14.6533 9.28614C14.7986 8.55924 15.3224 7.96597 16.0256 7.73155C16.7289 7.49714 17.2526 6.90387 17.398 6.17697L17.542 5.45703" stroke="currentColor" strokeWidth={props.stroke || 1.5} strokeLinecap="round"></path>
                    <path d="M17.5693 13.2533L17.7822 13.3762C18.4393 13.7556 19.2655 13.6719 19.8332 13.1685C20.3473 12.7126 21.0794 12.597 21.709 12.8723L22.0005 12.9997" stroke="currentColor" strokeWidth={props.stroke || 1.5} strokeLinecap="round"></path>
                    <path d="M9.79489 2.77903C9.4574 3.33109 9.54198 4.04247 9.99951 4.5L10.0974 4.59788C10.4906 4.99104 10.6355 5.56862 10.4746 6.10085" stroke="currentColor" strokeWidth={props.stroke || 1.5} strokeLinecap="round"></path>
                    <g opacity="0.5"><path d="M6.92761 3.94079C7.13708 3.73132 7.47669 3.73132 7.68616 3.94079C7.89563 4.15026 7.89563 4.48988 7.68616 4.69935C7.47669 4.90882 7.13708 4.90882 6.92761 4.69935C6.71814 4.48988 6.71814 4.15026 6.92761 3.94079Z" fill="currentColor"></path></g>
                    <g opacity="0.5"><path d="M12.1571 7.1571C12.3666 6.94763 12.7062 6.94763 12.9157 7.1571C13.1251 7.36657 13.1251 7.70619 12.9157 7.91566C12.7062 8.12512 12.3666 8.12512 12.1571 7.91566C11.9476 7.70619 11.9476 7.36657 12.1571 7.1571Z" fill="currentColor"></path></g>
                    <g opacity="0.5"><path d="M17.1571 10.1571C17.3666 9.94763 17.7062 9.94763 17.9157 10.1571C18.1251 10.3666 18.1251 10.7062 17.9157 10.9157C17.7062 11.1251 17.3666 11.1251 17.1571 10.9157C16.9476 10.7062 16.9476 10.3666 17.1571 10.1571Z" fill="currentColor"></path></g>
                    <path opacity="0.5" d="M19.058 15.3134C19.2674 15.1039 19.6071 15.1039 19.8165 15.3134C20.026 15.5228 20.026 15.8624 19.8165 16.0719C19.6071 16.2814 19.2674 16.2814 19.058 16.0719C18.8485 15.8624 18.8485 15.5228 19.058 15.3134Z" fill="currentColor"></path>
                    <path d="M19.1725 10.328L18.6871 10.4481L18.7596 10.7409L19.0523 10.8134L19.1725 10.328ZM21.0005 8.5L20.5005 8.49866C20.5001 8.63174 20.5528 8.75946 20.6469 8.85355C20.741 8.94765 20.8688 9.00035 21.0018 9L21.0005 8.5ZM19.1725 10.328C19.6578 10.2079 19.6579 10.208 19.6579 10.2081C19.6579 10.2081 19.6579 10.2081 19.6579 10.2082C19.6579 10.2083 19.6579 10.2083 19.6579 10.2083C19.6579 10.2083 19.6579 10.2082 19.6579 10.208C19.6578 10.2076 19.6576 10.2068 19.6572 10.2055C19.6566 10.2028 19.6556 10.1985 19.6542 10.1924C19.6513 10.1803 19.6471 10.1616 19.6417 10.1369C19.631 10.0876 19.616 10.0151 19.5999 9.92546C19.5675 9.74514 19.5314 9.50098 19.5147 9.2406C19.4979 8.97721 19.5022 8.71525 19.5417 8.49306C19.5825 8.26343 19.6511 8.13217 19.7153 8.06792L19.0082 7.36081C18.7373 7.63169 18.6146 7.9947 18.5571 8.31797C18.4983 8.64867 18.4972 8.99823 18.5168 9.30448C18.5366 9.61372 18.5788 9.89729 18.6157 10.1023C18.6342 10.2054 18.6516 10.2899 18.6645 10.3495C18.671 10.3793 18.6764 10.4029 18.6803 10.4196C18.6823 10.428 18.6838 10.4346 18.685 10.4394C18.6856 10.4418 18.686 10.4437 18.6864 10.4452C18.6866 10.4459 18.6867 10.4465 18.6868 10.447C18.6869 10.4473 18.687 10.4475 18.687 10.4477C18.687 10.4478 18.6871 10.4479 18.6871 10.4479C18.6871 10.448 18.6871 10.4481 19.1725 10.328ZM19.7153 8.06792C19.9581 7.82516 20.15 7.84372 20.2388 7.88469C20.3352 7.92922 20.5016 8.08886 20.5005 8.49866L21.5005 8.50134C21.5023 7.81729 21.2043 7.22917 20.6581 6.97686C20.1042 6.72101 19.4753 6.89367 19.0082 7.36081L19.7153 8.06792ZM19.1725 10.328C19.0523 10.8134 19.0525 10.8134 19.0526 10.8134C19.0526 10.8134 19.0527 10.8135 19.0528 10.8135C19.053 10.8135 19.0532 10.8136 19.0535 10.8136C19.054 10.8138 19.0546 10.8139 19.0553 10.8141C19.0568 10.8145 19.0587 10.8149 19.0611 10.8155C19.0659 10.8166 19.0725 10.8182 19.0809 10.8202C19.0975 10.8241 19.1212 10.8295 19.151 10.8359C19.2106 10.8489 19.2951 10.8663 19.3982 10.8848C19.6032 10.9217 19.8868 10.9639 20.196 10.9837C20.5023 11.0033 20.8518 11.0022 21.1825 10.9434C21.5058 10.8859 21.8688 10.7632 22.1397 10.4923L21.4326 9.78518C21.3683 9.84944 21.2371 9.91797 21.0074 9.9588C20.7852 9.99832 20.5233 10.0026 20.2599 9.98575C19.9995 9.96908 19.7553 9.93298 19.575 9.90058C19.4854 9.88447 19.4129 9.86952 19.3636 9.85879C19.3389 9.85344 19.3202 9.84915 19.3081 9.84633C19.302 9.84492 19.2976 9.84387 19.295 9.84324C19.2937 9.84293 19.2929 9.84272 19.2925 9.84262C19.2923 9.84257 19.2922 9.84255 19.2922 9.84255C19.2922 9.84256 19.2922 9.84257 19.2923 9.84258C19.2923 9.84259 19.2924 9.84261 19.2924 9.84262C19.2925 9.84264 19.2926 9.84266 19.1725 10.328ZM22.1397 10.4923C22.6068 10.0251 22.7795 9.3963 22.5236 8.84239C22.2713 8.29616 21.6832 7.99817 20.9992 8L21.0018 9C21.4116 8.9989 21.5713 9.16534 21.6158 9.26173C21.6568 9.35044 21.6753 9.54242 21.4326 9.78518L22.1397 10.4923Z" fill="currentColor"></path>
                    <path opacity="0.5" d="M15.1881 3.41748L15.1605 3.51459C15.1302 3.62126 15.1151 3.67459 15.1222 3.72695C15.1294 3.77931 15.1581 3.82476 15.2154 3.91567L15.2677 3.99844C15.4695 4.31836 15.5704 4.47831 15.5017 4.60915C15.4329 4.73998 15.24 4.75504 14.8542 4.78517L14.7543 4.79296C14.6447 4.80152 14.5899 4.8058 14.542 4.83099C14.494 4.85618 14.4584 4.89943 14.3872 4.98592L14.3224 5.06467C14.0718 5.36905 13.9465 5.52124 13.8035 5.50167C13.6606 5.4821 13.5947 5.30373 13.4629 4.94699L13.4288 4.85469C13.3914 4.75332 13.3726 4.70263 13.3358 4.66584C13.2991 4.62905 13.2484 4.61033 13.147 4.57287L13.0547 4.53878C12.698 4.40698 12.5196 4.34108 12.5 4.19815C12.4805 4.05522 12.6326 3.92992 12.937 3.67932L13.0158 3.61448C13.1023 3.54327 13.1455 3.50767 13.1707 3.45974C13.1959 3.41181 13.2002 3.35699 13.2087 3.24735L13.2165 3.14753C13.2466 2.76169 13.2617 2.56877 13.3925 2.50001C13.5234 2.43124 13.6833 2.53217 14.0033 2.73403L14.086 2.78626C14.1769 2.84362 14.2224 2.8723 14.2747 2.87947C14.3271 2.88664 14.3804 2.87148 14.4871 2.84117L14.5842 2.81358C14.9596 2.70692 15.1472 2.65359 15.2477 2.75402C15.3481 2.85445 15.2948 3.04213 15.1881 3.41748Z" stroke="currentColor" strokeWidth={props.stroke || 1.5}></path>
                </svg>
            ), 
            color: 'text-amber-500', 
            bg: 'bg-amber-50 dark:bg-amber-900/20', 
            ring: 'ring-amber-100 dark:ring-amber-900/30' 
        };
        if (cat === 'leave') {
            if (notif.type === 'leave_approved') return { 
                icon: (props: any) => (
                    <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} color="none" fill="none" viewBox="0 0 24 24" className={props.className}>
                        <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={props.stroke || 1.5}></circle>
                        <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" strokeWidth={props.stroke || 1.5} strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                ), 
                color: 'text-green-500', 
                bg: 'bg-green-50 dark:bg-green-900/20', 
                ring: 'ring-green-100 dark:ring-green-900/30' 
            };
            if (notif.type === 'leave_rejected') return { 
                icon: (props: any) => (
                    <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} color="none" fill="none" viewBox="0 0 24 24" className={props.className}>
                        <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={props.stroke || 1.5}></circle>
                        <path d="M14.5 9.50002L9.5 14.5M9.49998 9.5L14.5 14.5" stroke="currentColor" strokeWidth={props.stroke || 1.5} strokeLinecap="round"></path>
                    </svg>
                ), 
                color: 'text-red-500', 
                bg: 'bg-red-50 dark:bg-red-900/20', 
                ring: 'ring-red-100 dark:ring-red-900/30' 
            };
            return { 
                icon: (props: any) => (
                    <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} color="none" fill="none" viewBox="0 0 24 24" className={props.className}>
                        <path opacity="0.5" d="M3 12C3 15.7712 3 19.6569 4.31802 20.8284C5.63604 22 7.75736 22 12 22C16.2426 22 18.364 22 19.682 20.8284C21 19.6569 21 15.7712 21 12" stroke="currentColor" strokeWidth={props.stroke || 1.5}></path>
                        <path d="M14.6603 14.2019L20.6676 12.3997C21.2631 12.2211 21.5609 12.1317 21.7498 11.9176C21.7866 11.8759 21.8199 11.8312 21.8492 11.784C22 11.5415 22 11.2307 22 10.6089C22 8.15877 22 6.9337 21.327 6.10659C21.1977 5.94763 21.0524 5.80233 20.8934 5.67298C20.0663 5 18.8412 5 16.3911 5H7.60893C5.15877 5 3.9337 5 3.10659 5.67298C2.94763 5.80233 2.80233 5.94763 2.67298 6.10659C2 6.9337 2 8.15877 2 10.6089C2 11.2307 2 11.5415 2.15078 11.784C2.18015 11.8312 2.21341 11.8759 2.25021 11.9176C2.43915 12.1317 2.7369 12.2211 3.3324 12.3997L9.33968 14.2019" stroke="currentColor" strokeWidth={props.stroke || 1.5}></path>
                        <path opacity="0.5" d="M6.5 5C7.32344 4.97913 8.15925 4.45491 8.43944 3.68032C8.44806 3.65649 8.4569 3.62999 8.47457 3.57697L8.50023 3.5C8.54241 3.37344 8.56351 3.31014 8.58608 3.254C8.87427 2.53712 9.54961 2.05037 10.3208 2.00366C10.3812 2 10.4479 2 10.5814 2H13.4191C13.5525 2 13.6192 2 13.6796 2.00366C14.4508 2.05037 15.1262 2.53712 15.4144 3.254C15.4369 3.31014 15.458 3.37343 15.5002 3.5L15.5259 3.57697C15.5435 3.62968 15.5524 3.65656 15.561 3.68032C15.8412 4.45491 16.6766 4.97913 17.5 5" stroke="currentColor" strokeWidth={props.stroke || 1.5}></path>
                        <path d="M14 12.5H10C9.72386 12.5 9.5 12.7239 9.5 13V15.1615C9.5 15.3659 9.62448 15.5498 9.8143 15.6257L10.5144 15.9058C11.4681 16.2872 12.5319 16.2872 13.4856 15.9058L14.1857 15.6257C14.3755 15.5498 14.5 15.3659 14.5 15.1615V13C14.5 12.7239 14.2761 12.5 14 12.5Z" stroke="currentColor" strokeWidth={props.stroke || 1.5} strokeLinecap="round"></path>
                    </svg>
                ), 
                color: 'text-blue-500', 
                bg: 'bg-blue-50 dark:bg-blue-900/20', 
                ring: 'ring-blue-100 dark:ring-blue-900/30' 
            };
        }
        return { 
            icon: (props: any) => (
                <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} color="none" fill="none" viewBox="0 0 24 24" className={props.className}>
                    <path d="M18.7491 9.70957V9.00497C18.7491 5.13623 15.7274 2 12 2C8.27256 2 5.25087 5.13623 5.25087 9.00497V9.70957C5.25087 10.5552 5.00972 11.3818 4.5578 12.0854L3.45036 13.8095C2.43882 15.3843 3.21105 17.5249 4.97036 18.0229C9.57274 19.3257 14.4273 19.3257 19.0296 18.0229C20.789 17.5249 21.5612 15.3843 20.5496 13.8095L19.4422 12.0854C18.9903 11.3818 18.7491 10.5552 18.7491 9.70957Z" stroke="currentColor" strokeWidth={props.stroke || 1.5}></path>
                    <path opacity="0.5" d="M7.5 19C8.15503 20.7478 9.92246 22 12 22C14.0775 22 15.845 20.7478 16.5 19" stroke="currentColor" strokeWidth={props.stroke || 1.5} strokeLinecap="round"></path>
                    <path opacity="0.5" d="M12 6V10" stroke="currentColor" strokeWidth={props.stroke || 1.5} strokeLinecap="round"></path>
                </svg>
            ), 
            color: 'text-primary', 
            bg: 'bg-primary/5', 
            ring: 'ring-primary/20' 
        };
    };

    const confirmDeleteAll = async () => {
        setIsDeletingAll(true);
        try {
            await deleteAllNotifications();
            setIsConfirmDeleteAll(false);
        } finally {
            setIsDeletingAll(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#060818]">
            <PageHeader 
                title={t('notifications', 'Notifications')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5 text-primary' width="22" height="22" color="none" fill="none" viewBox="0 0 24 24"><path d="M18.7491 9.70957V9.00497C18.7491 5.13623 15.7274 2 12 2C8.27256 2 5.25087 5.13623 5.25087 9.00497V9.70957C5.25087 10.5552 5.00972 11.3818 4.5578 12.0854L3.45036 13.8095C2.43882 15.3843 3.21105 17.5249 4.97036 18.0229C9.57274 19.3257 14.4273 19.3257 19.0296 18.0229C20.789 17.5249 21.5612 15.3843 20.5496 13.8095L19.4422 12.0854C18.9903 11.3818 18.7491 10.5552 18.7491 9.70957Z" stroke="currentColor" stroke-width="1.5"></path><path opacity="0.5" d="M7.5 19C8.15503 20.7478 9.92246 22 12 22C14.0775 22 15.845 20.7478 16.5 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>}
                rightAction={
                    <div className="flex items-center gap-1">
                        {notifications.length > 0 && (
                            <>
                                {unreadCount > 0 && (
                                    <PwaActionButton
                                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" color="none" fill="none" viewBox="0 0 24 24"><path opacity="0.5" d="M4 12.9L7.14286 16.5L15 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M20.0002 7.5625L11.4286 16.5625L11.0002 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>}
                                        variant="ghost"
                                        onClick={handleMarkAllRead}
                                        disabled={isMarkingAllRead}
                                        title={t('mark_all_read', 'Mark all read')}
                                    />
                                )}
                                <PwaActionButton
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" color="none" fill="none" viewBox="0 0 24 24"><path d="M20.5001 6H3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path d="M18.8334 8.5L18.3735 15.3991C18.1965 18.054 18.108 19.3815 17.243 20.1907C16.378 21 15.0476 21 12.3868 21H11.6134C8.9526 21 7.6222 21 6.75719 20.1907C5.89218 19.3815 5.80368 18.054 5.62669 15.3991L5.16675 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M9.5 11L10 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M14.5 11L14 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M6.5 6C6.55588 6 6.58382 6 6.60915 5.99936C7.43259 5.97849 8.15902 5.45491 8.43922 4.68032C8.44784 4.65649 8.45667 4.62999 8.47434 4.57697L8.57143 4.28571C8.65431 4.03708 8.69575 3.91276 8.75071 3.8072C8.97001 3.38607 9.37574 3.09364 9.84461 3.01877C9.96213 3 10.0932 3 10.3553 3H13.6447C13.9068 3 14.0379 3 14.1554 3.01877C14.6243 3.09364 15.03 3.38607 15.2493 3.8072C15.3043 3.91276 15.3457 4.03708 15.4286 4.28571L15.5257 4.57697C15.5433 4.62992 15.5522 4.65651 15.5608 4.68032C15.841 5.45491 16.5674 5.97849 17.3909 5.99936C17.4162 6 17.4441 6 17.5 6" stroke="currentColor" stroke-width="1.5"></path></svg>}
                                    variant="danger"
                                    onClick={() => setIsConfirmDeleteAll(true)}
                                    title={t('delete_all', 'Delete all')}
                                />
                            </>
                        )}
                    </div>
                }
            />

            {/* Tabs */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-700 sticky top-[56px] z-40 overflow-x-auto hide-scrollbars">
                <div className="flex px-4">
                    {(['all', 'announcement', 'leave', 'birthday', 'anniversary', 'other'] as TabType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-5 py-4 text-[12px] font-black uppercase tracking-wider relative transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5",
                                activeTab === tab ? "text-primary" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            )}
                        >
                            <span className="relative">
                                {t(`tab_${tab}`, tab) as string}
                            </span>
                            
                            {/* Smart Indicators for celebrations */}
                            {tab === 'birthday' && celebrants.some(c => c.type === 'birthday') && (
                                <span className={cn(
                                    "w-2 h-2 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.5)] transition-all animate-pulse",
                                    activeTab === tab ? "bg-pink-500 scale-110" : "bg-pink-500/60"
                                )} />
                            )}
                            {tab === 'anniversary' && celebrants.some(c => c.type === 'anniversary') && (
                                <span className={cn(
                                    "w-2 h-2 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all animate-pulse",
                                    activeTab === tab ? "bg-amber-500 scale-110" : "bg-amber-500/60"
                                )} />
                            )}

                            {activeTab === tab && (
                                <motion.div 
                                    layoutId="notifTabUnderline"
                                    className="absolute bottom-0 left-4 right-4 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary-rgb),0.2)]" 
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pb-24">
                {loading ? (
                    <div className="flex justify-center items-center h-full min-h-[60vh]">
                        <Loader size="md" text={t('loading...', 'Loading...') as string} />
                    </div>
                ) : (
                    <>
                        {/* Global Celebrations List */}
                        {(activeTab === 'birthday' || activeTab === 'anniversary') && (
                            <CelebrationNotificationHeader 
                                activeTab={activeTab} 
                                onCountChange={setCelebrantCount} 
                                celebrants={celebrants}
                                loading={isCelebrantsLoading}
                            />
                        )}

                        {filteredNotifications.length === 0 && 
                         !( (activeTab === 'birthday' || activeTab === 'anniversary') && celebrantCount > 0 ) ? (
                            <PwaEmptyState 
                                illustration="notification"
                                title={activeTab === 'all' ? t('feed_empty_title', 'Your feed is empty!') as string : t('nothing_here_yet', 'Nothing here yet') as string}
                                description={activeTab === 'all' 
                                    ? t('feed_empty_desc', "We'll let you know when there's something new.") as string
                                    : t('no_tab_notifications', { tab: t(`tab_${activeTab}`).toLowerCase() }) as string
                                }
                            />
                        ) : (
                            <div key={activeTab} className="divide-y divide-gray-100 dark:divide-gray-800/50 animate-in fade-in slide-in-from-top-2 duration-500">
                        {Object.entries(groupedNotifications).map(([label, notifs]) => (
                            <div key={label} className="relative">
                                {/* Sticky Date Label */}
                                <div className="sticky top-0 z-30 bg-gray-50/80 dark:bg-[#060818]/80 backdrop-blur-md px-5 py-3 border-b border-gray-100/50 dark:border-gray-800/30">
                                    <h4 className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">
                                        {label}
                                    </h4>
                                </div>

                                <div className="p-3 space-y-1">
                                    {notifs.map(notif => {
                                        const config = getIcon(notif);
                                        const Icon = config.icon;
                                        const isUnread = !notif.read_at;

                                        return (
                                            <button
                                                key={notif.id}
                                                onClick={() => handleNotificationClick(notif)}
                                                className={cn(
                                                    "group relative w-full text-left bg-white dark:bg-gray-800/50 rounded-2xl p-4 transition-all duration-300",
                                                    "border border-transparent hover:border-gray-100 dark:hover:border-gray-700",
                                                    "hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none hover:-translate-y-0.5",
                                                    "active:scale-[0.98]",
                                                    isUnread && "bg-blue-50/50 dark:bg-primary/5 border-primary/10 hover:border-primary/20 shadow-sm shadow-primary/5"
                                                )}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={cn(
                                                        "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ring-1 shadow-inner",
                                                        "transition-transform group-hover:scale-105 duration-300",
                                                        config.bg,
                                                        config.ring
                                                    )}>
                                                        <Icon size={22} className={config.color} stroke={1.5} />
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2 pr-14">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <p className={cn(
                                                                    "text-[14px] font-bold truncate leading-relaxed transition-colors",
                                                                    isUnread ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                                                                )}>
                                                                    {renderNotificationText(notif.title, notif)}
                                                                </p>
                                                                {isUnread && (
                                                                    <span className="relative flex h-2 w-2 shrink-0">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        <span className={cn(
                                                            "absolute top-5 right-5 text-[10px] font-bold transition-colors",
                                                            isUnread ? "text-primary dark:text-primary" : "text-gray-400"
                                                        )}>
                                                            {dayjs(notif.created_at).fromNow()}
                                                        </span>
                                                        {notif.message && (
                                                            <p className={cn(
                                                                "text-[12px] mt-1 line-clamp-2 leading-relaxed transition-colors",
                                                                isUnread ? "text-gray-600 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"
                                                            )}>
                                                                {renderNotificationText(notif.message, notif)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                </>
            )}
        </div>

            {/* Confirmation BottomSheet */}
            <BottomSheet 
                isOpen={isConfirmDeleteAll} 
                onClose={() => setIsConfirmDeleteAll(false)}
                title={t('confirm_delete_all', 'Clear Notifications') as string}
            >
                <div className="space-y-6 pt-2">
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                            <IconAlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('delete_all_confirmation', 'Are you sure you want to delete all notifications? This action cannot be undone.') as string}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setIsConfirmDeleteAll(false)}
                            className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                        >
                            {t('cancel', 'Cancel')}
                        </button>
                        <button
                            onClick={confirmDeleteAll}
                            disabled={isDeletingAll}
                            className="h-12 rounded-xl bg-red-500 text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isDeletingAll ? (
                                <IconLoader2 size={16} className="animate-spin" />
                            ) : (
                                t('confirm_delete', 'Confirm') as string
                            )}
                        </button>
                    </div>
                </div>
            </BottomSheet>
        </div>
    );
}
