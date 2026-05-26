import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { pwaToast } from '@/utils/pwaToast';
import { IconCalendarEvent, IconPlus, IconLoader2 } from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';

import PageHeader from '@/components/ui/pwa/PageHeader';
import { PwaActionButton } from '@/components/ui/pwa/PwaActionButton';
import { PwaEmptyState } from '@/components/ui/pwa/pwa-empty-state';
import { PwaImagePreviewModal } from '@/components/ui/pwa/pwa-image-preview-modal';
import { pwaCache } from '@/lib/pwa-cache';
import { pwaFetch } from '@/lib/pwa-fetch';

// Sub-components
import { LeaveBalanceCard } from './components/LeaveBalanceCard';
import { LeaveRequestCard } from './components/LeaveRequestCard';
import { ApprovalCard } from './components/ApprovalCard';
import { LeaveActionBottomSheet } from './components/LeaveActionBottomSheet';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/lib/utils';

export default function LeaveIndex() {
    const { t } = useTranslation('pwa');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // State
    const [loading, setLoading] = useState(!pwaCache.get('leave_requests'));
    const [requests, setRequests] = useState<any>(pwaCache.get('leave_requests') || []);
    const [balances, setBalances] = useState<any>(pwaCache.get('leave_balances') || []);
    const [approvals, setApprovals] = useState<any>(pwaCache.get('leave_approvals') || []);
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'history' | 'approvals'>((searchParams.get('tab') as any) || 'all');
    
    // Action State
    const [actionId, setActionId] = useState<number | null>(null);
    const [actionMode, setActionMode] = useState<'approve' | 'reject' | 'cancel' | null>(null);
    const [processing, setProcessing] = useState(false);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [previewIndex, setPreviewIndex] = useState(0);

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem('employee_auth_token');
        if (!token) {
            navigate('/employee/login');
            return;
        }

        // OFFLINE GUARD
        if (!navigator.onLine) {
            setLoading(false);
            return;
        }

        try {
            const [reqRes, balRes, appRes] = await Promise.all([
                pwaFetch('/api/employee-app/leave-requests', { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } }),
                pwaFetch('/api/employee-app/my-leave-balances', { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } }),
                pwaFetch('/api/employee-app/leave-requests/approvals', { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } })
            ]);

            if (reqRes.status === 401) {
                localStorage.removeItem('employee_auth_token');
                navigate('/employee/login');
                return;
            }

            if (reqRes.ok) {
                const res = await reqRes.json();
                const data = res.data || res;
                setRequests(data);
                pwaCache.set('leave_requests', data);
            }
            if (balRes.ok) {
                const bals = await balRes.json();
                setBalances(bals);
                pwaCache.set('leave_balances', bals);
            }
            if (appRes.ok) {
                const res = await appRes.json();
                const data = res.data || res;
                setApprovals(data);
                pwaCache.set('leave_approvals', data);
            }
            
        } catch (e) {
            if (navigator.onLine) {
                pwaToast.error('Network error loading leave data');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        dispatch(setPageTitle(t('leave_requests', 'Leave Requests')));
        fetchData();

        window.addEventListener('pwa-refresh', fetchData);
        return () => window.removeEventListener('pwa-refresh', fetchData);
    }, [dispatch, t, fetchData]);

    // Performant Filtering
    const filteredRequests = useMemo(() => {
        const reqArray = Array.isArray(requests) ? requests : (requests?.data || []);
        if (!Array.isArray(reqArray)) return [];

        if (activeTab === 'all') return reqArray;
        if (activeTab === 'pending') return reqArray.filter(r => r && r.status === 'pending');
        if (activeTab === 'history') return reqArray.filter(r => r && ['approved', 'rejected', 'cancelled'].includes(r.status));
        return [];
    }, [activeTab, requests]);

    // Global Action Handler
    const handleAction = async (reason?: string) => {
        if (!actionId || !actionMode) return;
        
        const token = localStorage.getItem('employee_auth_token');
        setProcessing(true);

        const endpointMap: Record<string, { url: string, method: string }> = {
            approve: { url: `/api/employee-app/leave-requests/${actionId}/approve`, method: 'POST' },
            reject: { url: `/api/employee-app/leave-requests/${actionId}/reject`, method: 'POST' },
            cancel: { url: `/api/employee-app/leave-requests/${actionId}/cancel`, method: 'PUT' }
        };

        const config = endpointMap[actionMode];

        try {
            const res = await fetch(config.url, {
                method: config.method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: reason ? JSON.stringify({ rejection_reason: reason }) : undefined
            });

            if (res.ok) {
                pwaToast.success(`Request ${actionMode}ed successfully`);
                setActionId(null);
                setActionMode(null);
                fetchData();
            } else {
                const data = await res.json();
                pwaToast.error(data.message || 'Operation failed');
            }
        } catch (e) {
            pwaToast.error('An error occurred');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#060818] pb-32">
            <PageHeader
                title={t('leave_dashboard', 'Leave Dashboard')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5 text-primary'  width="22" height="22" color="none" fill="none" viewBox="0 0 24 24"><path d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12V14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14V12Z" stroke="currentColor" stroke-width="1.5"></path><path opacity="0.5" d="M7 4V2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path d="M17 4V2.5" opacity="0.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M2 9H22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><circle cx="16.5" cy="16.5" r="1.5" stroke="currentColor" stroke-width="1.5"></circle></svg>}
                rightAction={
                    <PwaActionButton
                        icon={<IconPlus />}
                        variant="soft"
                        onClick={() => navigate('/employee/leave/create')}
                    />
                }
            />
            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4 flex-1">
                    <IconLoader2 size={40} className="animate-spin text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('syncing_requests', 'Syncing Requests...')}</p>
                </div>
            ) : (
                <>
                    {/* Sticky Tabs Shell */}
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-700 sticky top-[56px] z-30 overflow-x-auto hide-scrollbars">
                        <div className="flex px-4">
                            {['all', 'pending', 'history'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={cn(
                                        "relative px-5 py-4 text-[12px] font-black uppercase tracking-wider transition-all duration-300 shrink-0 whitespace-nowrap",
                                        activeTab === tab ? "text-primary" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    )}
                                >
                                    <span className="relative z-10">{t(`tab_${tab}`, tab.charAt(0).toUpperCase() + tab.slice(1))}</span>
                                    {activeTab === tab && (
                                        <motion.div 
                                            layoutId="leaveTabUnderline"
                                            className="absolute bottom-0 left-4 right-4 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary-rgb),0.2)]" 
                                        />
                                    )}
                                </button>
                            ))}
                            
                            {((Array.isArray(approvals) ? approvals : approvals?.data) || []).length > 0 && (
                                <button
                                    onClick={() => setActiveTab('approvals')}
                                    className={cn(
                                        "relative px-5 py-4 text-[12px] font-black uppercase tracking-wider transition-all duration-300 shrink-0 whitespace-nowrap flex items-center gap-2",
                                        activeTab === 'approvals' ? "text-primary" : "text-gray-400"
                                    )}
                                >
                                    <span className="relative z-10">{t('tab_approvals', 'Approvals')}</span>
                                    <span className={cn(
                                        "relative z-10 px-2 min-w-[20px] h-5 flex items-center justify-center text-[10px] rounded-full font-black shadow-sm transition-all",
                                        activeTab === 'approvals' ? "bg-primary text-white scale-110 shadow-primary/30" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                                    )}>
                                        {((Array.isArray(approvals) ? approvals : approvals?.data) || []).length}
                                    </span>
                                    {activeTab === 'approvals' && (
                                        <motion.div 
                                            layoutId="leaveTabUnderline"
                                            className="absolute bottom-0 left-4 right-4 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary-rgb),0.2)]" 
                                        />
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-4 space-y-6 flex-1 overflow-y-auto">
                        {balances.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">{t('your_balances', 'Your Balances')}</h3>
                                </div>
                                <div className="flex gap-4 overflow-x-auto pb-0 px-1 snap-x hide-scrollbars">
                                    {balances.map((b: any, i: number) => (
                                        <LeaveBalanceCard 
                                            key={i} 
                                            name={b.leave_type?.name} 
                                            balance={parseFloat(b.balance)}
                                            color={b.leave_type?.color}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            <AnimatePresence>
                                {activeTab === 'approvals' ? (
                                    ((Array.isArray(approvals) ? approvals : approvals?.data) || []).length === 0 ? (
                                        <PwaEmptyState 
                                            illustration="notification"
                                            title={t('no_pending_approvals', 'No Pending Approvals')}
                                            description={t('no_pending_approvals_desc', "You don't have any leave requests to review right now.")}
                                        />
                                    ) : (
                                        (Array.isArray(approvals) ? approvals : (approvals?.data || [])).map((req: any) => (
                                            <ApprovalCard 
                                                key={req.id} 
                                                request={req} 
                                                onApprove={(id) => { setActionId(id); setActionMode('approve'); }}
                                                onReject={(id) => { setActionId(id); setActionMode('reject'); }}
                                                onPreviewImage={(images, index) => { setPreviewImages(images); setPreviewIndex(index); }}
                                            />
                                        ))
                                    )
                                ) : (
                                    filteredRequests.length === 0 ? (
                                        <PwaEmptyState 
                                            illustration="notification"
                                            title={activeTab === 'pending' ? t('no_pending_requests', "No Pending Requests") : t('no_leave_history', "No Leave History")}
                                            description={activeTab === 'pending' 
                                                ? t('no_pending_requests_desc', "Any requests you submit will appear here until they are reviewed.")
                                                : t('no_leave_history_desc', "Your approved, rejected, or cancelled requests will appear here.")}
                                            action={activeTab === 'all' ? {
                                                label: t('new_request', "New Request"),
                                                onClick: () => navigate('/employee/leave/create'),
                                                icon: <IconPlus />
                                            } : undefined}
                                        />
                                    ) : (
                                        filteredRequests.map((req: any) => (
                                            <LeaveRequestCard 
                                                key={req.id} 
                                                request={req} 
                                                onCancel={(id) => { setActionId(id); setActionMode('cancel'); }}
                                                onPreviewImage={(images, index) => { setPreviewImages(images); setPreviewIndex(index); }}
                                            />
                                        ))
                                    )
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </>
            )}

            <LeaveActionBottomSheet
                isOpen={!!actionMode}
                onClose={() => { setActionMode(null); setActionId(null); }}
                mode={actionMode}
                isLoading={processing}
                onConfirm={handleAction}
            />

            <PwaImagePreviewModal
                isOpen={previewImages.length > 0}
                onClose={() => setPreviewImages([])}
                images={previewImages}
                initialIndex={previewIndex}
                title={t('evidence_preview', 'Evidence Viewer')}
            />

            <style>{`
                .hide-scrollbars::-webkit-scrollbar { display: none; }
                .hide-scrollbars { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
