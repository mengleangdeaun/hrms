import { useEffect, useState, useCallback } from 'react';
import api from '@/utils/api';
import {
    IconMessage2,
    IconTrash,
    IconRefresh,
    IconDeviceMobile,
    IconUser,
    IconCalendar,
    IconCircleCheck,
    IconCircle,
    IconCircleDashed
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import FilterBar from '@/components/ui/FilterBar';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import DeleteModal from '@/components/DeleteModal';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

interface AppFeedback {
    id: number;
    employee_id: number | null;
    message: string;
    device_info: any;
    status: 'pending' | 'reviewed' | 'resolved';
    created_at: string;
    employee?: {
        full_name: string;
        designation?: { name: string };
    };
}

const AppFeedbackIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [feedbacks, setFeedbacks] = useState<AppFeedback[]>([]);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0
    });

    const [status, setStatus] = useState<string>('all');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [feedbackToDelete, setFeedbackToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

        
    useEffect(() => {
        dispatch(setPageTitle(t('app_feedback', 'App Feedback' )));
    }, [dispatch, t]);

    const fetchData = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/settings/app-feedbacks?page=${page}&search=${search}&status=${status}`);
            setFeedbacks(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total
            });
        } catch (error) {
            toast.error(t('failed_load_feedback', 'Failed to load app feedback'));
        } finally {
            setLoading(false);
        }
    }, [search, status]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = (id: number) => {
        setFeedbackToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!feedbackToDelete) return;

        setIsDeleting(true);
        try {
            await api.delete(`/settings/app-feedbacks/${feedbackToDelete}`);
            toast.success(t('feedback_deleted', 'Feedback deleted successfully'));
            fetchData(pagination.current_page);
            setDeleteModalOpen(false);
        } catch (error) {
            toast.error(t('failed_delete_feedback', 'Failed to delete feedback'));
        } finally {
            setIsDeleting(false);
            setFeedbackToDelete(null);
        }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            await api.put(`/settings/app-feedbacks/${id}/status`, { status });
            toast.success(t('status_updated', 'Status updated successfully'));
            fetchData(pagination.current_page);
        } catch (error) {
            toast.error(t('failed_update_status', 'Failed to update status'));
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'resolved': return <IconCircleCheck className="w-4 h-4 text-success" />;
            case 'reviewed': return <IconCircle className="w-4 h-4 text-info" />;
            default: return <IconCircleDashed className="w-4 h-4 text-warning" />;
        }
    };

    return (
        <div>
            <FilterBar
                title={t('app_feedback', 'App Feedback')}
                description={t('app_feedback_desc', 'Review and manage feedback submitted through the PWA application.')}
                icon={<IconMessage2 className="w-6 h-6 text-primary" />}
                onRefresh={() => fetchData(1)}
                search={search}
                setSearch={setSearch}
                itemsPerPage={10}
                setItemsPerPage={() => { }}
                hasActiveFilters={status !== 'all'}
                onClearFilters={() => setStatus('all')}
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('status', 'Status')}</span>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('all', 'All Status')}</SelectItem>
                            <SelectItem value="pending">{t('pending', 'Pending')}</SelectItem>
                            <SelectItem value="reviewed">{t('reviewed', 'Reviewed')}</SelectItem>
                            <SelectItem value="resolved">{t('resolved', 'Resolved')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>

            {loading && feedbacks.length === 0 ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader />
                </div>
            ) : feedbacks.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {feedbacks.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700 flex flex-col h-full">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <IconUser size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                            {item.employee?.full_name || t('anonymous', 'Anonymous')}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            {item.employee?.designation?.name || t('employee', 'Employee')}
                                        </p>
                                    </div>
                                </div>
                                <div className={cn(
                                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                                    item.status === 'resolved' ? "bg-success/10 text-success" :
                                    item.status === 'reviewed' ? "bg-info/10 text-info" : "bg-warning/10 text-warning"
                                )}>
                                    {getStatusIcon(item.status)}
                                    {item.status}
                                </div>
                            </div>

                            <div className="flex-1 space-y-4">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                    <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                                        "{item.message}"
                                    </p>
                                </div>

                                {item.device_info && (
                                    <div className="flex flex-wrap gap-2">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/40 rounded-lg text-[10px] text-slate-500 font-mono border border-slate-100 dark:border-slate-800/50">
                                            <IconDeviceMobile size={12} />
                                            {item.device_info.screen}
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/40 rounded-lg text-[10px] text-slate-500 font-mono border border-slate-100 dark:border-slate-800/50">
                                            {item.device_info.platform}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <IconCalendar size={14} />
                                    {format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select 
                                        value={item.status} 
                                        onValueChange={(val) => handleUpdateStatus(item.id, val)}
                                    >
                                        <SelectTrigger className="h-8 w-[110px] text-[10px] font-bold bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-800">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">PENDING</SelectItem>
                                            <SelectItem value="reviewed">REVIEWED</SelectItem>
                                            <SelectItem value="resolved">RESOLVED</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <button 
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                                    >
                                        <IconTrash size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <Pagination
                    currentPage={pagination.current_page}
                    totalPages={pagination.last_page}
                    totalItems={pagination.total}
                    itemsPerPage={10}
                    onPageChange={(page) => fetchData(page)}
                />
            </>
            ) : (
                <EmptyState 
                    isSearch={search !== '' || status !== 'all'}
                    searchTerm={search}
                    title={t('no_feedback_yet', 'No app feedback received yet.')}
                    description={t('no_feedback_desc', 'Feedback submitted through the PWA application will appear here.')}
                    onClearFilter={() => {
                        setSearch('');
                        setStatus('all');
                    }}
                />
            )}

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={confirmDelete}
                isLoading={isDeleting}
                title={t('delete_feedback_title', 'Delete Feedback')}
                message={t('delete_feedback_msg', 'Are you sure you want to delete this feedback? This action cannot be undone.')}
            />
        </div>
    );
};

export default AppFeedbackIndex;
