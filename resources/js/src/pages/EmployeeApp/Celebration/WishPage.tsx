import React, { useEffect, useState, useRef, memo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { pwaFetch } from '@/lib/pwa-fetch';
import { IconArrowLeft, IconCheck, IconPhotoPlus, IconCake, IconConfetti, IconSend, IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';
import Lottie from 'lottie-react';
import confettiAnimation from '@/assets/animations/Confetti2.json';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/ui/pwa/PageHeader';
import Loader from '@/components/ui/Loader';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import 'dayjs/locale/km';
import 'dayjs/locale/zh-cn';

// Pre-set wishes (unchanged)
const BIRTHDAY_WISHES = [
    { key: "wish_hbd", emoji: "🎂" },
    { key: "wish_blast", emoji: "🥳" },
    { key: "wish_best", emoji: "✨" },
    { key: "wish_special", emoji: "🎁" },
    { key: "wish_wiser", emoji: "🧠" },
    { key: "wish_make_wish", emoji: "🕯️" },
];

const ANNIVERSARY_WISHES = [
    { key: "wish_happy_anniversary", emoji: "🎊" },
    { key: "wish_glad_have_you", emoji: "🤝" },
    { key: "wish_keep_work", emoji: "🚀" },
    { key: "wish_cheers", emoji: "🥂" },
    { key: "wish_star", emoji: "⭐" },
    { key: "wish_amazing_milestone", emoji: "🏆" },
];

const WishPageSkeleton = memo(() => (
    <div className="w-full max-w-md animate-pulse p-4 space-y-8 flex flex-col items-center">
        <div className="flex flex-col items-center space-y-4 pt-4">
            <div className="w-28 h-28 rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="space-y-2 flex flex-col items-center">
                <div className="h-6 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded-full" />
                <div className="h-3 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800/50 rounded-xl" />
            ))}
        </div>
        <div className="h-32 w-full bg-gray-100 dark:bg-gray-800/50 rounded-2xl" />
        <div className="h-14 w-full bg-gray-100 dark:bg-gray-800/50 rounded-2xl shadow-sm" />
    </div>
));
WishPageSkeleton.displayName = 'WishPageSkeleton';

const ProfileSection = memo(({ celebrant, type, t }: any) => (
    <div className="mt-2 mb-8 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
        <div className="relative">
            <div className="w-28 h-28 rounded-full border-2 border-white/80 dark:border-gray-800/80 p-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-xl">
                {celebrant.profile_image_url ? (
                    <img src={celebrant.profile_image_url} className="w-full h-full rounded-full object-cover" />
                ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-black text-4xl shadow-inner">
                        {celebrant.name.charAt(0)}
                    </div>
                )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-950 text-white shadow-lg">
                {type === 'birthday' ? <IconCake size={20} /> : <IconConfetti size={20} />}
            </div>
        </div>
        <div className="mt-5">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{celebrant.name}</h2>
            <div className="inline-block mt-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs tracking-wide">
                {type === 'birthday' 
                    ? t('birthday_status', 'Leveling up today! 🎂') 
                    : t('anniversary_status', { defaultValue: '{{milestone}} Completed! 🎊', milestone: celebrant.milestone })}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 font-medium">
                {celebrant.designation} • {celebrant.department}
            </p>
        </div>
    </div>
));
ProfileSection.displayName = 'ProfileSection';

const PresetWishesSection = memo(({ wishes, message, setMessage, t }: any) => (
    <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {wishes.map((wish: any) => {
            const wishText = t(wish.key);
            const isActive = message === wishText;
            return (
                <button
                    key={wish.key}
                    onClick={() => setMessage(wishText)}
                    className={cn(
                        "group relative flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                        "border shadow-sm hover:shadow-md active:scale-95",
                        isActive
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[0.98]"
                            : "bg-white dark:bg-gray-800/80 border-gray-200/80 dark:border-gray-700/80 text-gray-700 dark:text-gray-200 hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10"
                    )}
                >
                    <span className="text-base">{wish.emoji}</span>
                    <span className="truncate">{wishText}</span>
                    {isActive && (
                        <IconCheck size={14} className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5 shadow-md" />
                    )}
                </button>
            );
        })}
    </div>
));
PresetWishesSection.displayName = 'PresetWishesSection';

const ReceivedWishesSection = memo(({ wishes, t }: { wishes: any[], t: any }) => (
    <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                {t('wishes_received', 'Messages from Team')}
            </h3>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                {wishes.length} messages
            </span>
        </div>
        
        {wishes.length === 0 ? (
            <div className="bg-white dark:bg-gray-800/40 backdrop-blur-sm border border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <IconConfetti className="text-gray-300" size={32} />
                </div>
                <p className="text-gray-400 text-sm font-medium">{t('no_wishes_yet', "Wishes will appear here as soon as your team sends them!")}</p>
            </div>
        ) : (
            <div className="space-y-4">
                {wishes.map((wish, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={wish.id} 
                        className="bg-white dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700/50 rounded-3xl p-4 shadow-sm"
                    >
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-100 dark:border-gray-700">
                                {wish.sender?.profile_image ? (
                                    <img src={`/storage/${wish.sender.profile_image}`} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-sm font-black">
                                        {wish.sender?.full_name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-none mb-1">
                                        {wish.sender?.full_name}
                                    </h4>
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        {dayjs(wish.created_at).format('hh:mm A')}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed mt-1 italic">
                                    "{wish.message || t('warm_wishes', 'Sent you warm wishes!')}"
                                </p>
                                {wish.image_path && (
                                    <div className="mt-3 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
                                        <img src={`/storage/${wish.image_path}`} className="w-full max-h-60 object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}
    </div>
));
ReceivedWishesSection.displayName = 'ReceivedWishesSection';

export default function WishPage() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'birthday';
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation('pwa');
    const { markAsRead } = useNotifications();

    // Sync dayjs locale
    useEffect(() => {
        const lang = i18n.language === 'kh' ? 'km' : i18n.language === 'zh' ? 'zh-cn' : 'en';
        dayjs.locale(lang);
    }, [i18n.language]);

    const notificationId = (location.state as any)?.notificationId;

    useEffect(() => {
        if (notificationId) {
            markAsRead(notificationId);
        }
    }, [notificationId]);

    const [celebrant, setCelebrant] = useState<any>(null);
    const [authEmployee, setAuthEmployee] = useState<any>(null);
    const [receivedWishes, setReceivedWishes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFetchingWishes, setIsFetchingWishes] = useState(false);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isSelf = authEmployee?.id && celebrant?.id && authEmployee.id === celebrant.id;

    useEffect(() => {
        const fetchAuth = async () => {
            const token = localStorage.getItem('employee_auth_token');
            if (!token) return;
            try {
                const res = await pwaFetch('/api/employee-app/dashboard', {
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAuthEmployee(data.employee);
                }
            } catch (err) { console.error(err); }
        };
        fetchAuth();
    }, []);

    useEffect(() => {
        if (isSelf) {
            const fetchWishes = async () => {
                const token = localStorage.getItem('employee_auth_token');
                if (!token) return;
                setIsFetchingWishes(true);
                try {
                    const res = await pwaFetch('/api/employee-app/celebrations/my-wishes', {
                        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        // Filter wishes for the current type (birthday/anniversary)
                        setReceivedWishes(data.filter((w: any) => w.type === type));
                    }
                } catch (err) { console.error(err); }
                finally { setIsFetchingWishes(false); }
            };
            fetchWishes();
        }
    }, [isSelf, type]);

    useEffect(() => {
        const fetchCelebrant = async () => {
             const token = localStorage.getItem('employee_auth_token');
             if (!token) return;
             try {
                 const res = await pwaFetch('/api/employee-app/celebrations', {
                     headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                 });
                 if (res.ok) {
                     const data = await res.json();
                     const found = data.find((c: any) => c.id == id);
                     if (found) {
                        setCelebrant(found);
                        setLoading(false);
                        return;
                     }
                 }

                 // Fallback: Fetch specific employee if not in "today" list
                 const detailRes = await pwaFetch(`/api/employee-app/celebrations/${id}?type=${type}`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                 });
                 if (detailRes.ok) {
                    setCelebrant(await detailRes.json());
                 }
             } catch (err) {
                 console.error(err);
             } finally {
                 setLoading(false);
             }
        };
        fetchCelebrant();
    }, [id, type]);

    const handleSend = async () => {
        if (!message && !image) {
            toast.error(t('enter_msg_or_img', 'Please enter a message or pick an image!'));
            return;
        }

        const token = localStorage.getItem('employee_auth_token');
        if (!token) return;

        setSending(true);
        const formData = new FormData();
        formData.append('receiver_id', id!);
        formData.append('type', type);
        formData.append('message', message);
        if (image) {
            formData.append('image', image);
        }

        try {
            const res = await pwaFetch('/api/employee-app/celebrations/wish', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                body: formData
            });

            if (res.ok) {
                toast.success(t('wish_sent_success', "Wish sent! 🎉"));
                navigate('/employee/dashboard');
            } else {
                const errData = await res.json();
                toast.error(errData.message || t('failed_send_wish', "Failed to send wish."));
            }
        } catch (err) {
            toast.error(t('msg_error', "Something went wrong."));
        } finally {
            setSending(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const wishesList = type === 'birthday' ? BIRTHDAY_WISHES : ANNIVERSARY_WISHES;

    return (
        <div className="relative min-h-screen dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col">
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent dark:from-gray-950/60" />
                <Lottie animationData={confettiAnimation} loop={true} className="w-full h-full opacity-30 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen" />
            </div>

            <div className="sticky top-0 z-20">
                <PageHeader
                    title={isSelf ? t('happy_celebration_self', { defaultValue: 'Happy {{milestone}}!', milestone: celebrant?.milestone || 'Birthday' }) : (type === 'birthday' ? t('birthday_title', 'Happy Birthday!') : t('anniversary_title', 'Happy Anniversary!'))}
                    icon={type === 'birthday' ? <IconCake className="w-5 h-5" /> : <IconConfetti className="w-5 h-5" />}
                />
            </div>

            <main className="relative z-10 flex-1 px-4 pb-12 pt-2 flex flex-col items-center">
                {loading ? (
                    <WishPageSkeleton />
                ) : !celebrant ? (
                    <div className="mt-20 flex flex-col items-center text-center">
                         <IconCake size={48} className="text-gray-300 mb-4" />
                         <h1 className="text-xl font-black text-gray-900 dark:text-white">{t('celebrant_not_found', "Celebrant not found")}</h1>
                         <p className="text-gray-400 mt-2 mb-6 text-sm">{t('celebrant_not_found_desc', "Maybe the celebration has passed or is hidden.")}</p>
                         <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-primary text-white font-black rounded-2xl">{t('go_back', "Go Back")}</button>
                    </div>
                ) : (
                    <>
                        <ProfileSection celebrant={celebrant} type={type} t={t} />
                        <div className="w-full max-w-md space-y-6">
                            {isSelf ? (
                                <ReceivedWishesSection wishes={receivedWishes} t={t} />
                            ) : (
                                <>
                                    <PresetWishesSection wishes={wishesList} message={message} setMessage={setMessage} t={t} />
                                    
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <Textarea 
                                                value={message} 
                                                onChange={(e) => setMessage(e.target.value)} 
                                                placeholder={t('wish_placeholder', "Type your warm message here...")} 
                                                className="w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 focus:border-primary/50 rounded-2xl p-5 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 min-h-[120px] transition-all shadow-sm focus:shadow-md" 
                                            />
                                            <div className="absolute right-3 bottom-3 flex gap-2">
                                                <button 
                                                    onClick={() => fileInputRef.current?.click()} 
                                                    className="w-9 h-9 rounded-full bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primary hover:border-primary transition-colors"
                                                >
                                                    <IconPhotoPlus size={18} />
                                                </button>
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef} 
                                                    className="hidden" 
                                                    accept="image/*" 
                                                    onChange={handleImageChange} 
                                                />
                                            </div>
                                        </div>

                                        {imagePreview && (
                                            <div className="relative group w-24 h-24 rounded-xl overflow-hidden border-2 border-primary/30 shadow-md">
                                                <img src={imagePreview} className="w-full h-full object-cover" />
                                                <button 
                                                    onClick={() => { setImage(null); setImagePreview(null); }} 
                                                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <button 
                                        onClick={handleSend} 
                                        disabled={sending} 
                                        className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-98 transition-all duration-200 shadow-lg shadow-primary/30 hover:shadow-xl disabled:opacity-50 disabled:scale-100"
                                    >
                                        {sending ? (
                                            <div className="flex items-center gap-2">
                                                <IconLoader2 className="animate-spin" size={20} />
                                                <span>{t('sending', 'Sending...')}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <IconSend size={20} />
                                                <span>{t('send_wish_to', { defaultValue: 'Send Wish to {{name}}', name: celebrant.name.split(' ')[0] })}</span>
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}