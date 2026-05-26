import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { IconActivity, IconPlus, IconCheck, IconAlertTriangle, IconClock, IconFilter, IconX, IconListCheck, IconLoader2 } from '@tabler/icons-react';
import PageHeader from '@/components/ui/pwa/PageHeader';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityCard } from './components/ActivityCard';
import { FilterSheet } from './components/FilterSheet';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { PwaEmptyState } from '@/components/ui/pwa/pwa-empty-state';
import { PwaActionButton } from '@/components/ui/pwa/PwaActionButton';
import { pwaCache } from '@/lib/pwa-cache';
import { offlineDB, OfflineActivity } from '@/lib/offline-db';
import { useConnection } from '@/context/ConnectionContext';
import { pwaFetch } from '@/lib/pwa-fetch';

const STATUS_CONFIG: Record<string, { label: string; translationKey: string; color: string; icon: React.ReactNode }> = {
    submitted: { label: 'Submitted', translationKey: 'submitted', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <IconClock className="w-3 h-3" /> },
    reviewed: { label: 'Reviewed', translationKey: 'reviewed', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <IconCheck className="w-3 h-3" /> },
    flagged: { label: 'Flagged', translationKey: 'flagged', color: 'text-rose-600 bg-rose-50 border-rose-200', icon: <IconAlertTriangle className="w-3 h-3" /> },
    pending: { label: 'Pending Sync', translationKey: 'pending_sync', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: <IconLoader2 className="w-3 h-3 animate-spin" /> },
};

export default function EmployeePwaActivity() {
    const { t } = useTranslation('pwa');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const token = localStorage.getItem('employee_auth_token');

    // Feed State
    const [activities, setActivities] = useState<any[]>(pwaCache.get('activity_feed') || []);
    const [pendingActivities, setPendingActivities] = useState<OfflineActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false);
    
    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);

    // Filter State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        activity_type: '',
        date_from: '',
        date_to: '',
    });

    const loadPending = async () => {
        try {
            const pending = await offlineDB.getPendingActivities();
            setPendingActivities(pending);
        } catch (e) {
            console.error('Failed to load pending activities', e);
        }
    };

    const observer = useRef<IntersectionObserver | null>(null);
    const lastActivityElementRef = useCallback((node: any) => {
        if (loading || loadingMore || isFiltering) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => {
                    const next = prevPage + 1;
                    fetchActivities(next, filters, false, false);
                    return next;
                });
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, isFiltering, hasMore, filters]);

    const fetchActivities = async (currentPage: number, currentFilters: any, isInitial: boolean = false, isFilterAction: boolean = false) => {
        if (!token) { navigate('/employee/login'); return; }
        
        if (isFilterAction) {
            setIsFiltering(true);
        } else if (isInitial) {
            setLoading(true);
            loadPending();
        } else {
            setLoadingMore(true);
        }

        // PREVENT OFFLINE LOOPS: If offline, don't attempt remote fetch
        if (!navigator.onLine) {
            setTimeout(() => {
                setLoading(false);
                setLoadingMore(false);
                setIsFiltering(false);
                if (!isInitial) setHasMore(false); 
                
                if (isInitial && activities.length === 0) {
                    toast.error(t('offline_no_cache', 'Offline: No cached data available'), {
                        description: t('connect_to_load', 'Connect to internet to load your activity history.')
                    });
                }
            }, 500);
            return;
        }

        try {
            const query = new URLSearchParams({
                page: String(currentPage),
                per_page: '15',
                ...Object.fromEntries(Object.entries(currentFilters).filter(([_, v]) => v !== ''))
            });

            const res = await pwaFetch(`/api/employee-app/activities?${query.toString()}`, {
                headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
            });
            
            if (res.status === 401) { 
                localStorage.removeItem('employee_auth_token'); 
                navigate('/employee/login'); 
                return; 
            }

            if (res.ok) {
                const data = await res.json();
                const newActivities = data.data || [];
                
                setActivities(prev => (isInitial || isFilterAction) ? newActivities : [...prev, ...newActivities]);
                
                const hasAnyFilter = currentFilters.activity_type !== '' || currentFilters.date_from !== '';
                if (isInitial && !hasAnyFilter && currentPage === 1) {
                    pwaCache.set('activity_feed', newActivities);
                }
                
                setHasMore(data.current_page < data.last_page);
                setTotal(data.total);
            } else {
                setHasMore(false); // Stop on server error
            }
        } catch { 
            // Only show toast if we were supposed to be online
            if (navigator.onLine) {
                toast.error('Network error. Check connection.'); 
            }
            setHasMore(false); // Stop loop on error
        } finally { 
            setLoading(false); 
            setLoadingMore(false);
            setIsFiltering(false);
        }
    };

    // Effect for Initial Load and Page Change
    useEffect(() => {
        fetchActivities(1, filters, true, false);

        const handleRefresh = () => {
            setPage(1);
            setHasMore(true);
            fetchActivities(1, filters, true, false);
        };

        const handleSync = () => {
            loadPending();
            fetchActivities(1, filters, true, false);
        };

        window.addEventListener('pwa-refresh', handleRefresh);
        window.addEventListener('activity-synced', handleSync);
        
        return () => {
            window.removeEventListener('pwa-refresh', handleRefresh);
            window.removeEventListener('activity-synced', handleSync);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    // Apply Filter Logic
    const handleApplyFilters = (newFilters: any) => {
        setFilters(newFilters);
        setPage(1);
        setHasMore(true);
        fetchActivities(1, newFilters, false, true);
        setIsFilterOpen(false);
    };

    const clearFilter = (key: keyof typeof filters) => {
        const reset = { ...filters, [key]: '' };
        if (key === 'date_from') reset.date_to = ''; // Clear range together
        handleApplyFilters(reset);
    };

    useEffect(() => {
        dispatch(setPageTitle(t('activity', 'Activity') as string));
    }, [dispatch, t]);

    const hasFilters = filters.activity_type !== '' || filters.date_from !== '';

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-[#060818] pb-32">
            <PageHeader
                title={t('activities', 'Activity Feed') as string}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary" width="22" height="22" color="none" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="13" r="3" stroke="currentColor" stroke-width="1.5"></circle><path opacity="0.5" d="M9.77778 21H14.2222C17.3433 21 18.9038 21 20.0248 20.2646C20.51 19.9462 20.9267 19.5371 21.251 19.0607C22 17.9601 22 16.4279 22 13.3636C22 10.2994 22 8.76721 21.251 7.6666C20.9267 7.19014 20.51 6.78104 20.0248 6.46268C19.3044 5.99013 18.4027 5.82123 17.022 5.76086C16.3631 5.76086 15.7959 5.27068 15.6667 4.63636C15.4728 3.68489 14.6219 3 13.6337 3H10.3663C9.37805 3 8.52715 3.68489 8.33333 4.63636C8.20412 5.27068 7.63685 5.76086 6.978 5.76086C5.59733 5.82123 4.69555 5.99013 3.97524 6.46268C3.48995 6.78104 3.07328 7.19014 2.74902 7.6666C2 8.76721 2 10.2994 2 13.3636C2 16.4279 2 17.9601 2.74902 19.0607C3.07328 19.5371 3.48995 19.9462 3.97524 20.2646C5.09624 21 6.65675 21 9.77778 21Z" stroke="currentColor" stroke-width="1.5"></path><path d="M19 10H18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>} 
                rightAction={
                    <div className="flex items-center gap-2">
                        <PwaActionButton
                            icon={<IconFilter />}
                            variant="soft"
                            isActive={hasFilters}
                            onClick={() => setIsFilterOpen(true)}
                        />
                        <PwaActionButton
                            icon={<IconPlus />}
                            variant="soft"
                            onClick={() => navigate('/employee/activity/create')}
                        />
                    </div>
                }
            />

            {/* Tabs Navigation */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-[56px] z-40 overflow-x-auto hide-scrollbars">
                <div className="flex px-2">
                    {['all', 'Sale Outdoor', 'Site Visit', 'On-Site Service', 'Meeting / Discussion', 'Support', 'Other'].map((tab) => {
                        const isActive = (filters.activity_type || 'all') === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => handleApplyFilters({ ...filters, activity_type: tab === 'all' ? '' : tab })}
                                className={cn(
                                    "px-5 py-4 text-[12px] font-black uppercase tracking-wide relative transition-all whitespace-nowrap shrink-0",
                                    isActive ? "text-primary" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                )}
                            >
                                <span className="relative">
                                    {tab === 'all' ? t('tab_all', 'All') as string : t(tab.toLowerCase().replace(/ \/ /g, '_').replace(/ /g, '_'), tab) as string}
                                </span>
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-4 right-4 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary-rgb),0.2)]" 
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Active Date Filters */}
            <AnimatePresence>
                {filters.date_from && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-gray-50/50 dark:bg-gray-900/20 border-b border-gray-100 dark:border-gray-800 overflow-hidden"
                    >
                        <div className="flex items-center gap-2 px-5 py-3">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[10px] font-black rounded-full shadow-sm">
                                <IconClock size={12} />
                                <span>
                                    {filters.date_from === filters.date_to 
                                        ? format(new Date(filters.date_from), 'd MMM') 
                                        : `${format(new Date(filters.date_from), 'd MMM')} - ${format(new Date(filters.date_to), 'd MMM')}`
                                    }
                                </span>
                                <button 
                                    onClick={() => clearFilter('date_from')}
                                    className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                                >
                                    <IconX size={10} />
                                </button>
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('selected_range', 'Selected Range') as string}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-5 pt-4 flex-1">
                {(loading || (isFiltering && activities.length === 0)) && page === 1 ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <IconLoader2 size={40} className="animate-spin text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('syncing_feed', 'Syncing Feed...') as string}</p>
                    </div>
                ) : (activities.length === 0 && pendingActivities.length === 0) ? (
                    <PwaEmptyState 
                        illustration={hasFilters ? 'search' : 'data'}
                        title={hasFilters ? t("no_match", "No Matches Found") as string : t("no_activities", "No Activities Yet") as string}
                        description={hasFilters 
                            ? t("no_match_description", "We couldn't find any activities matching your filters. Try adjusting your search.") as string
                            : t("no_activities_description", "Log your field visits, site updates, and tasks with photos and GPS.") as string
                        }
                        action={hasFilters ? {
                            label: t("clear_all_filters", "Clear All Filters") as string,
                            onClick: () => handleApplyFilters({ activity_type: '', date_from: '', date_to: '' }),
                            icon: <IconX size={16} />
                        } : {
                            label: t("log_first_activity", "Log First Activity") as string,
                            onClick: () => navigate('/employee/activity/create'),
                            icon: <IconPlus size={16} />
                        }}
                    />
                ) : (
                    <div className="space-y-6">
                        {loading && activities.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm"
                            >
                                <IconLoader2 size={16} className="animate-spin text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('refreshing', 'Refreshing Feed...')}</span>
                            </motion.div>
                        )}
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                {hasFilters ? t('filtered_results', 'Filtered Results') as string : t('recent_logs', 'Recent Logs') as string}
                            </h4>
                            <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                {total + pendingActivities.length} {t('logs', 'Logs') as string}
                            </span>
                        </div>
                        
                        <div className={cn("grid gap-6 transition-opacity duration-300", isFiltering ? "opacity-40 scale-[0.99] pointer-events-none" : "opacity-100 scale-100")}>
                            {/* Pending Activities */}
                            {pendingActivities.map((act) => {
                                // Create URLs if not already mapped (using a simple cache-like check)
                                const displayAct = {
                                    ...act,
                                    id: `pending-${act.id}`,
                                    status: 'pending' as const,
                                    attachment_urls: act.attachment_urls || act.attachments.map(b => URL.createObjectURL(b))
                                };
                                return (
                                    <motion.div
                                        key={displayAct.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    >
                                        <ActivityCard 
                                            activity={displayAct} 
                                            statusConfig={STATUS_CONFIG} 
                                        />
                                    </motion.div>
                                );
                            })}

                            {/* Remote Activities */}
                            {activities.map((act, idx) => {
                                if (activities.length === idx + 1) {
                                    return (
                                        <div ref={lastActivityElementRef} key={act.id}>
                                            <ActivityCard activity={act} statusConfig={STATUS_CONFIG} />
                                        </div>
                                    );
                                } else {
                                    return (
                                        <motion.div
                                            key={act.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: (idx % 15) * 0.05 }}
                                        >
                                            <ActivityCard activity={act} statusConfig={STATUS_CONFIG} />
                                        </motion.div>
                                    );
                                }
                            })}
                        </div>

                        {loadingMore && (
                            <div className="flex flex-col gap-6 py-6">
                                <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-3xl" />
                                <div className="flex justify-center py-2">
                                    <Loader size="sm" />
                                </div>
                            </div>
                        )}
                        
                        {!hasMore && activities.length > 0 && (
                            <div className="text-center py-10 opacity-30">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('everything_up_to_date', 'Everything up to date') as string}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <FilterSheet 
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                onApply={handleApplyFilters}
            />
        </div>
    );
}
