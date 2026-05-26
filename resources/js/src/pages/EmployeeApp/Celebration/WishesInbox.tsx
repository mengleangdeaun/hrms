import React, { useEffect, useState, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { pwaFetch } from '@/lib/pwa-fetch';
import { IconHeart, IconCake, IconConfetti, IconLoader2, IconMessageOff } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/ui/pwa/PageHeader';
import Loader from '@/components/ui/Loader';
import { PwaActionButton } from '@/components/ui/pwa/PwaActionButton';
import { PwaEmptyState } from '@/components/ui/pwa/pwa-empty-state';
import { pwaCache } from '@/lib/pwa-cache';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/km';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);

interface Wish {
    id: number;
    sender: {
        full_name: string;
        profile_image: string | null;
        profile_image_url: string;
    };
    type: 'birthday' | 'anniversary';
    message: string | null;
    image_path: string | null;
    created_at: string;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

const WishSkeleton = memo(() => (
    <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900" />
                    <div className="flex-1 space-y-2">
                        <div className="w-24 h-3 bg-gray-100 dark:bg-gray-900 rounded" />
                        <div className="w-32 h-2 bg-gray-100 dark:bg-gray-900 rounded" />
                    </div>
                </div>
                <div className="h-16 bg-gray-50 dark:bg-gray-900/50 rounded-2xl" />
            </div>
        ))}
    </div>
));
WishSkeleton.displayName = 'WishSkeleton';

const WishCard = memo(({ wish, formatDate }: { wish: Wish, formatDate: (d: string) => string }) => (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 space-y-4 transition-all active:scale-[0.99]">
        <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-primary/10">
                {wish.sender?.profile_image_url && <AvatarImage src={wish.sender.profile_image_url} alt={wish.sender.full_name || 'Anonymous'} />}
                <AvatarFallback className="bg-primary/5 text-primary font-black text-sm">
                    {wish.sender?.full_name?.charAt(0) || '?'}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-gray-900 dark:text-white truncate">
                    {wish.sender?.full_name || 'Anonymous'}
                </p>
                <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                    {wish.type === 'birthday' ? <IconCake size={10} className="text-pink-500" /> : <IconConfetti size={10} className="text-amber-500" />}
                    {wish.type === 'birthday' ? 'Birthday Wish' : 'Anniversary Wish'}
                    <span>•</span>
                    {formatDate(wish.created_at)}
                </p>
            </div>
        </div>

        {wish.message && (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic border border-gray-100/50 dark:border-white/5">
                "{wish.message}"
            </div>
        )}

        {wish.image_path && (
            <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
                <img src={`/storage/${wish.image_path}`} className="w-full h-auto object-cover max-h-60" loading="lazy" />
            </div>
        )}
    </div>
));
WishCard.displayName = 'WishCard';

export default function WishesInbox() {
    const { t } = useTranslation('pwa');
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const cachedWishes = pwaCache.get('my_wishes');
    const [wishes, setWishes] = useState<Wish[]>(cachedWishes || []);
    const [loading, setLoading] = useState(!cachedWishes);

    // Sync dayjs locale
    useEffect(() => {
        const lang = i18n.language === 'kh' ? 'km' : i18n.language === 'zh' ? 'zh-cn' : 'en';
        dayjs.locale(lang);
    }, [i18n.language]);

    const fetchWishes = useCallback(async () => {
        const token = localStorage.getItem('employee_auth_token');
        if (!token) return;
        try {
            const res = await pwaFetch('/api/employee-app/celebrations/my-wishes', {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            if (res.ok) {
                const data = await res.json();
                setWishes(data);
                pwaCache.set('my_wishes', data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWishes();
    }, [fetchWishes]);

    const formatDate = useCallback((dateStr: string) => {
        return dayjs(dateStr).format('MMM D, hh:mm A');
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#060818] flex flex-col">
            <PageHeader
                title={t('my_wishes', 'Received Wishes')}
                icon={<IconHeart className="w-5 h-5 text-red-500" />}
            />

            <main className="p-4 flex-1 space-y-4 pb-24">
                {loading && wishes.length === 0 ? (
                    <WishSkeleton />
                ) : wishes.length === 0 ? (
                    <PwaEmptyState
                        illustration="data"
                        title={t('no_wishes', 'No wishes yet!')}
                        description={t('no_wishes_desc', 'Wishes from your coworkers will appear here on your special days.')}
                    />
                ) : (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {wishes.map((wish) => (
                            <WishCard key={wish.id} wish={wish} formatDate={formatDate} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
