import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { IconHistory, IconFilter, IconX, IconLoader2, IconClock } from '@tabler/icons-react';
import PageHeader from '@/components/ui/pwa/PageHeader';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { HistoryCard } from './components/HistoryCard';
import { HistoryFilterSheet } from './components/HistoryFilterSheet';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { PwaEmptyState } from '@/components/ui/pwa/pwa-empty-state';
import { PwaActionButton } from '@/components/ui/pwa/PwaActionButton';
import { pwaCache } from '@/lib/pwa-cache';
import { pwaFetch } from '@/lib/pwa-fetch';

export default function EmployeePwaHistory() {
    const { t } = useTranslation('pwa');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const token = localStorage.getItem('employee_auth_token');

    // Feed State
    const [records, setRecords] = useState<any[]>(pwaCache.get('attendance_history') || []);
    const [loading, setLoading] = useState(!pwaCache.get('attendance_history'));
    const [loadingMore, setLoadingMore] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false);
    
    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);

    // Filter State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        in_status: '',
        out_status: '',
        date_from: '',
        date_to: '',
    });

    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: any) => {
        if (loading || loadingMore || isFiltering) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => {
                    const next = prev + 1;
                    fetchHistory(next, filters, false, false);
                    return next;
                });
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, isFiltering, hasMore, filters]);

    const fetchHistory = async (currentPage: number, currentFilters: any, isInitial: boolean = false, isFilterAction: boolean = false) => {
        if (!token) { navigate('/employee/login'); return; }
        
        if (isFilterAction) {
            setIsFiltering(true);
        } else if (isInitial) {
            // Only show main loader if we have NO cached data
            if (!pwaCache.get('attendance_history')) {
                setLoading(true);
            }
        } else {
            setLoadingMore(true);
        }

        // OFFLINE GUARD: Prevent request loops if offline
        if (!navigator.onLine) {
            setTimeout(() => {
                setLoading(false);
                setLoadingMore(false);
                setIsFiltering(false);
                if (!isInitial) setHasMore(false); // Stop pagination trigger
            }, 500);
            return;
        }

        try {
            const query = new URLSearchParams({
                page: String(currentPage),
                per_page: '15',
                ...Object.fromEntries(Object.entries(currentFilters).filter(([_, v]) => v !== ''))
            });

            const res = await pwaFetch(`/api/employee-app/history?${query.toString()}`, {
                headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
            });
            
            if (res.status === 401) { 
                localStorage.removeItem('employee_auth_token'); 
                navigate('/employee/login'); 
                return; 
            }

            if (res.ok) {
                const data = await res.json();
                const newRecords = data.data || [];
                
                setRecords(prevRecords => (isInitial || isFilterAction) ? newRecords : [...prevRecords, ...newRecords]);
                
                const hasAnyFilter = currentFilters.status !== '' || currentFilters.in_status !== '' || currentFilters.out_status !== '' || currentFilters.date_from !== '';
                if (isInitial && !hasAnyFilter && currentPage === 1) {
                    pwaCache.set('attendance_history', newRecords);
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

    useEffect(() => {
        fetchHistory(1, filters, true, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleRefresh = () => {
            setPage(1);
            fetchHistory(1, filters, true, false);
        };
        window.addEventListener('pwa-refresh', handleRefresh);
        return () => window.removeEventListener('pwa-refresh', handleRefresh);
    }, [filters]);

    const handleApplyFilters = (newFilters: any) => {
        setFilters(newFilters);
        setPage(1);
        setHasMore(true);
        fetchHistory(1, newFilters, false, true);
        setIsFilterOpen(false);
    };

    const clearFilter = (key: keyof typeof filters) => {
        const reset = { ...filters, [key]: '' };
        if (key === 'date_from') reset.date_to = '';
        handleApplyFilters(reset);
    };

    useEffect(() => {
        dispatch(setPageTitle(t('attendance_history', 'Attendance History')));
    }, [dispatch, t]);

    const hasFilters = filters.status !== '' || filters.in_status !== '' || filters.out_status !== '' || filters.date_from !== '';

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-[#060818] pb-32">
            <PageHeader 
                title={t('attendance_history', 'Attendance History')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5 text-primary' width="22" height="22" color="none" fill="none" viewBox="0 0 24 24"><path d="M12 7V12L14.5 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"></circle><path opacity="0.5" d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>}
                rightAction={
                    <PwaActionButton
                        icon={<IconFilter />}
                        variant="soft"
                        isActive={hasFilters}
                        onClick={() => setIsFilterOpen(true)}
                    />
                }
            />

            {/* Tabs Navigation */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-[56px] z-40 overflow-x-auto hide-scrollbars">
                <div className="flex px-2">
                    {[
                        { id: 'all', label: t('tab_all', 'All') },
                        { id: 'early_in', label: t('early_in', 'Early In'), key: 'in_status', value: 'Early' },
                        { id: 'late_in', label: t('late_in', 'Late In'), key: 'in_status', value: 'Late' },
                        { id: 'early_depart', label: t('early_depart', 'Early Depart'), key: 'out_status', value: 'Early' },
                        { id: 'stay_late', label: t('stay_late', 'Stay Late'), key: 'out_status', value: 'Stay Late' },
                        { id: 'overtime', label: t('overtime', 'Overtime'), key: 'out_status', value: 'Overtime' },
                    ].map((tab) => {
                        const isActive = tab.id === 'all' 
                            ? (!filters.in_status && !filters.out_status)
                            : (filters[tab.key as 'in_status' | 'out_status'] === tab.value);
                        
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if (tab.id === 'all') {
                                        handleApplyFilters({ ...filters, in_status: '', out_status: '', status: '' });
                                    } else {
                                        handleApplyFilters({ 
                                            ...filters, 
                                            in_status: tab.key === 'in_status' ? tab.value : '', 
                                            out_status: tab.key === 'out_status' ? tab.value : '',
                                            status: '' 
                                        });
                                    }
                                }}
                                className={cn(
                                    "px-5 py-4 text-[12px] font-black uppercase tracking-wide relative transition-all whitespace-nowrap shrink-0",
                                    isActive ? "text-primary" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                )}
                            >
                                <span className="relative">
                                    {tab.label}
                                </span>
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeTabHistory"
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
                                        ? format(new Date(filters.date_from), 'd MMM yyyy') 
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
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('selected_range', 'Selected Range')}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-5 pt-4 flex-1">
                {(loading || (isFiltering && records.length === 0)) && page === 1 ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <IconLoader2 size={40} className="animate-spin text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('syncing_timeline', 'Syncing Timeline...')}</p>
                    </div>
                ) : records.length === 0 ? (
                    <PwaEmptyState 
                        illustration={hasFilters ? 'search' : 'data'}
                        title={hasFilters ? t('no_matches_found', "No Matches Found") : t('no_records_yet', "No Records Yet")}
                        description={hasFilters 
                            ? t('no_matches_desc', "We couldn't find any attendance logs matching your audit filters. Try adjusting your range or categories.")
                            : t('no_records_desc', "Your attendance timeline is currently empty. Clock in to start building your biometric history.")
                        }
                        action={hasFilters ? {
                            label: t('reset_audit_filter', "Reset Audit Filter"),
                            onClick: () => handleApplyFilters({ status: '', in_status: '', out_status: '', date_from: '', date_to: '' }),
                            icon: <IconX size={16} />
                        } : undefined}
                    />
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                {hasFilters ? t('filtered_logs', 'Filtered Logs') : t('detailed_timeline', 'Detailed Timeline')}
                            </h4>
                            <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                {total} {t('entries', 'Entries')}
                            </span>
                        </div>
                        
                        <div className={cn("grid gap-4 transition-opacity duration-300", isFiltering ? "opacity-40 scale-[0.99] pointer-events-none" : "opacity-100 scale-100")}>
                            {records.map((record, idx) => {
                                if (records.length === idx + 1) {
                                    return (
                                        <div ref={lastElementRef} key={record.id}>
                                            <HistoryCard record={record} />
                                        </div>
                                    );
                                }
                                return (
                                    <motion.div
                                        key={record.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: (idx % 15) * 0.05 }}
                                    >
                                        <HistoryCard record={record} />
                                    </motion.div>
                                );
                            })}
                        </div>

                        {loadingMore && (
                            <div className="flex flex-col items-center py-6 gap-2">
                                <Loader size="sm" />
                            </div>
                        )}
                        
                        {!hasMore && records.length > 0 && (
                            <div className="text-center py-10 opacity-30">
                                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('end_of_records', 'End of records')}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <HistoryFilterSheet 
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                onApply={handleApplyFilters}
            />
        </div>
    );
}
