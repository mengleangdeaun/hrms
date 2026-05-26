import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { IconClock, IconClockRecord, IconPhoto, IconEye, IconInfoCircle, IconEyeOff } from '@tabler/icons-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from '@/components/ui/avatar';
import Pagination from '../../../components/ui/Pagination';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
import FilterBar from '../../../components/ui/FilterBar';
import SortableHeader from '../../../components/ui/SortableHeader';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import ActionButtons from '../../../components/ui/ActionButtons';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { DateRangePicker } from '../../../components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { Button } from '../../../components/ui/button';
import DeleteModal from '../../../components/DeleteModal';
import { useLeaveRecords, useApproveLeave, useRejectLeave, useDeleteLeaveRecord, useHRFilterEmployees, exportLeaveRecords } from '@/hooks/useHRData';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { ImagePreviewModal } from '@/components/ui/image-preview-modal';
import { Badge } from '@/components/ui/badge';
import { useFormatDate } from '@/hooks/useFormatDate';

interface LeaveRequest {
    id: number;
    created_at: string;
    employee?: {
        id: number;
        full_name: string;
        employee_id: string;
        profile_image_url?: string;
    };
    leave_type?: {
        id: number;
        name: string;
        color: string;
    };
    duration_type: string;
    start_date: string;
    end_date: string;
    total_days: number;
    reason: string;
    status: string;
    actioned_at?: string;
    rejection_reason?: string;
    start_time?: string;
    end_time?: string;
    attachments?: string[];
}

export default function LeaveRecordIndex() {
    const { t } = useTranslation();
    const { formatDate, formatTime } = useFormatDate();
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    // Filtering & Pagination
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL_STATUSES');
    const [employeeFilter, setEmployeeFilter] = useState('');
    const [dateFilter, setDateFilter] = useState<DateRange | undefined>();
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isExporting, setIsExporting] = useState(false);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortDirection('asc');
        }
    };

    useEffect(() => {
        dispatch(setPageTitle(t('leave_records_title')));
    }, [t, dispatch]);

    // Hooks
    const { data: response, isLoading: loadingRecords } = useLeaveRecords({
        page: currentPage,
        per_page: itemsPerPage,
        search,
        status: statusFilter,
        employee_id: employeeFilter,
        start_date: dateFilter?.from ? dayjs(dateFilter.from).format('YYYY-MM-DD') : undefined,
        end_date: dateFilter?.to ? dayjs(dateFilter.to).format('YYYY-MM-DD') : undefined,
        sort_by: sortBy,
        sort_direction: sortDirection
    });

    const requests = response?.data || [];
    const totalItems = response?.meta?.total || 0;
    const totalPages = response?.meta?.last_page || 1;

    const { data: employees = [], isLoading: loadingEmployees } = useHRFilterEmployees(true);
    
    const approveMutation = useApproveLeave();
    const rejectMutation = useRejectLeave();
    const deleteMutation = useDeleteLeaveRecord();

    const isProcessing = approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending;
    const rawLoading = loadingRecords || loadingEmployees;
    const loading = useDelayedLoading(rawLoading, 500);

    // Modals
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [activeRequest, setActiveRequest] = useState<LeaveRequest | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [itemToApprove, setItemToApprove] = useState<number | null>(null);

    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['hr-leave-records'] });
        queryClient.invalidateQueries({ queryKey: ['hr-employees-filter'] });
    };

    const handleApprove = (id: number) => {
        setItemToApprove(id);
        setApproveModalOpen(true);
    };

    const executeApprove = async () => {
        if (!itemToApprove) return;
        approveMutation.mutate(itemToApprove, {
            onSuccess: () => {
                toast.success(t('leave_approved_success'));
                setApproveModalOpen(false);
                setItemToApprove(null);
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || t('error_approving_request'));
            }
        });
    };

    const openRejectModal = (request: any) => {
        setActiveRequest(request);
        setRejectionReason('');
        setRejectModalOpen(true);
    };

    const handleViewDetails = (request: any) => {
        setActiveRequest(request);
        setViewDialogOpen(true);
    };

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeRequest) return;
        rejectMutation.mutate({ id: activeRequest.id, reason: rejectionReason }, {
            onSuccess: () => {
                toast.success(t('leave_request_rejected'));
                setRejectModalOpen(false);
            },
            onError: (err: any) => {
                const data = err.response?.data;
                if (data?.errors?.rejection_reason) {
                    toast.error(data.errors.rejection_reason[0]);
                } else {
                    toast.error(data?.message || t('error_rejecting_request'));
                }
            }
        });
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;

        const request = requests.find((r: any) => r.id === itemToDelete);
        if (request?.status === 'approved') {
            toast.error(t('cannot_delete_approved_request'));
            setDeleteModalOpen(false);
            return;
        }

        deleteMutation.mutate(itemToDelete, {
            onSuccess: () => {
                toast.success(t('record_deleted_success'));
                setDeleteModalOpen(false);
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || t('failed_delete_record'));
            }
        });
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            await exportLeaveRecords({
                search,
                status: statusFilter,
                employee_id: employeeFilter,
                start_date: dateFilter?.from ? dayjs(dateFilter.from).format('YYYY-MM-DD') : undefined,
                end_date: dateFilter?.to ? dayjs(dateFilter.to).format('YYYY-MM-DD') : undefined,
                sort_by: sortBy,
                sort_direction: sortDirection,
            });
            toast.success(t('export_success', 'Export successful'));
        } catch (error) {
            console.error('Export failed:', error);
            toast.error(t('export_failed', 'Export failed'));
        } finally {
            setIsExporting(false);
        }
    };

    // Derived standard table state
    const hasActiveFilters = !!(statusFilter !== 'ALL_STATUSES' || employeeFilter || dateFilter?.from || search);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, employeeFilter, dateFilter]);

    const getBadgeVariant = (status: string | undefined): "success" | "warning" | "destructive" | "flat" | "default" => {
        switch (status) {
            case 'approved': return 'success';
            case 'pending': return 'warning';
            case 'rejected': return 'destructive';
            case 'cancelled': return 'flat';
            default: return 'default';
        }
    };

    const employeeOptions = useMemo(() => 
        employees.map((emp: any) => ({
            value: String(emp.id),
            label: emp.full_name,
            description: emp.employee_id
        }))
    , [employees]);

    return (
        <div>
            <FilterBar
                icon={<IconClockRecord className="w-6 h-6 text-primary" />}
                title={t('leave_records_title')}
                description={t('leave_records_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={() => {
                    setSearch('');
                    setStatusFilter('ALL_STATUSES');
                    setEmployeeFilter('');
                    setDateFilter(undefined);
                }}
                onRefresh={handleRefresh}
                onExport={handleExport}
                isExporting={isExporting}
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('date_range_label')}</span>
                    <DateRangePicker
                        value={dateFilter}
                        onChange={setDateFilter}
                        placeholder={t('filter_by_date_range_placeholder')}
                    />
                </div>

                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('employee_label')}</span>
                    <SearchableSelect
                        options={employeeOptions}
                        value={employeeFilter}
                        onChange={(val) => setEmployeeFilter(String(val))}
                        placeholder={t('all_employees_placeholder')}
                        searchPlaceholder={t('search_employees_placeholder')}
                        loading={loadingEmployees}
                    />
                </div>

                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('status_label')}</span>
                    <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                    >
                        <SelectTrigger className="h-10 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm transition-all focus:ring-primary text-gray-800 dark:text-gray-200">
                            <SelectValue placeholder={t('all_statuses_placeholder')} />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                            <SelectItem value="ALL_STATUSES" className="font-medium">{t('all_statuses_label')}</SelectItem>
                            <SelectItem value="pending" className="font-medium">{t('pending_label')}</SelectItem>
                            <SelectItem value="approved" className="font-medium">{t('approved_label')}</SelectItem>
                            <SelectItem value="rejected" className="font-medium">{t('rejected_label')}</SelectItem>
                            <SelectItem value="cancelled" className="font-medium">{t('cancelled_label')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>

            {loading ? (
                <TableSkeleton columns={8} rows={5} />
            ) : requests.length === 0 ? (
                <EmptyState
                    isSearch={hasActiveFilters}
                    searchTerm={search}
                    onClearFilter={() => { setSearch(''); setStatusFilter('ALL_STATUSES'); setDateFilter(undefined); setEmployeeFilter(''); }}
                />
            ) : (
                <div className="rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden mb-5 bg-white dark:bg-black shadow-sm">
                    <div className="table-responsive">
                        <table className="w-full text-sm">
                            <thead className="border-b dark:border-gray-600 text-gray-500 uppercase font-bold text-[11px] tracking-wider">
                                <tr>
                                    <th>#</th>
                                    <SortableHeader label={t('requested_label')} value="created_at" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3 whitespace-nowrap" />
                                    <SortableHeader label={t('employee_label')} value="employee" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3" />
                                    <SortableHeader label={t('leave_type_label')} value="leave_type" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3" />
                                    <th className="px-4 py-3 text-left whitespace-nowrap">{t('duration_detail_label')}</th>
                                    <th className="px-4 py-3 text-left">{t('reason_label')}</th>
                                    <SortableHeader label={t('status_label')} value="status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3 text-center" />
                                    <SortableHeader label={t('actioned_at_label', 'Actioned At')} value="actioned_at" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3 text-center" />
                                    <th className="px-4 py-3 text-right pr-4">{t('actions_label')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {requests.map((req: LeaveRequest, index: number) => (
                                    <tr key={req.id} className="hover:bg-gray-50/30 dark:hover:bg-white/5 transition-colors group">
                                        <td className="text-start text-gray-400 text-xs font-medium pl-4">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex flex-col text-gray-600 dark:text-gray-400">
                                                <span className="text-sm font-medium">
                                                    {formatDate(req.created_at)}
                                                </span>
                                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                                                    {formatTime(req.created_at)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 rounded-full border border-primary/20">
                                                    <AvatarImage src={req.employee?.profile_image_url} alt={req.employee?.full_name} className="object-cover" />
                                                    <AvatarFallback className="rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase">
                                                        {req.employee?.full_name?.charAt(0) || '?'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-[120px]">
                                                    <p className="font-bold text-gray-900 dark:text-gray-100 truncate">
                                                        {req.employee?.full_name || 'Unknown'}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 uppercase tracking-tighter truncate">{req.employee?.employee_id || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                                                {req.leave_type?.name}
                                            </span>
                                            <div className="text-[11px] text-gray-500 uppercase font-bold tracking-wide mt-1">
                                                {req.duration_type?.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="font-medium text-gray-800 dark:text-gray-200">
                                                {req.start_date !== req.end_date ? (
                                                    <>{dayjs(req.start_date).format('MMM D')} - {dayjs(req.end_date).format('MMM D, YYYY')}</>
                                                ) : (
                                                    <>{dayjs(req.start_date).format('MMM D, YYYY')}</>
                                                )}
                                            </div>
                                            <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block mt-1">
                                                {req.total_days} {req.total_days == 1 ? t('day') : t('days')}
                                            </div>
                                            {req.start_time && (
                                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <IconClock className="w-3 h-3" />
                                                    {formatTime(`2000-01-01 ${req.start_time}`)} - {formatTime(`2000-01-01 ${req.end_time}`)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 max-w-[200px]">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2" title={req.reason}>
                                                {req.reason}
                                            </p>
                                            {req.rejection_reason && (
                                                <p className="text-xs text-danger mt-1 line-clamp-1" title={req.rejection_reason}>
                                                    <span className="font-semibold italic">Note:</span> {req.rejection_reason}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-start">
                                            <Badge size="sm" variant={getBadgeVariant(req.status)} className="font-bold">
                                                {t(req.status + '_label')}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-start">
                                            {req.actioned_at ? (
                                                <div className="flex flex-col text-gray-600 dark:text-gray-400">
                                                    <span className="text-sm font-medium">
                                                        {formatDate(req.actioned_at)}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                                                        {formatTime(req.actioned_at)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-300 dark:text-gray-700 text-xs italic">
                                                    {t('pending')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right pr-4">
                                            <div className="flex gap-2 items-center justify-end">
                                                <ActionButtons
                                                    variant="rounded"
                                                    showApproveReject={req.status === 'pending'}
                                                    skipRejectConfirm={true}
                                                    skipDeleteConfirm={true}
                                                    onView={() => handleViewDetails(req)}
                                                    onApprove={() => handleApprove(req.id)}
                                                    onReject={() => openRejectModal(req)}
                                                    onDelete={req.status !== 'approved' ? () => { setItemToDelete(req.id); setDeleteModalOpen(true); } : undefined}
                                                    disabled={isProcessing}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Reject Modal */}
            <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-gray-100">{t('reject_leave_request_title')}</DialogTitle>
                        <DialogDescription className="text-gray-500 dark:text-gray-400">
                            {t('reject_leave_request_desc', { name: activeRequest?.employee?.full_name })}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleReject} className="space-y-4 mt-4">
                        <div>
                            <label className="text-sm font-semibold mb-2 block text-gray-800 dark:text-gray-200">{t('rejection_reason_label')} <span className="text-red-500">*</span></label>
                            <Textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full rounded-lg resize-none h-32 bg-white dark:bg-black border-gray-200 dark:border-gray-800"
                                placeholder={t('rejection_reason_placeholder')}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                onClick={() => setRejectModalOpen(false)}
                                variant="outline"
                                className="border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300"
                            >
                                {t('cancel_btn_label')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isProcessing || !rejectionReason.trim()}
                                variant="destructive"
                                className="bg-rose-600 hover:bg-rose-700 text-white"
                            >
                                {isProcessing ? t('processing_dots') : t('confirm_rejection_btn')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                title={t('delete_leave_record_title')}
                message={t('delete_leave_record_confirm')}
                onConfirm={executeDelete}
                isLoading={deleteMutation.isPending}
            />

            <ConfirmationModal
                isOpen={approveModalOpen}
                setIsOpen={setApproveModalOpen}
                title={t('approve_leave_request_title')}
                description={t('approve_leave_request_desc')}
                confirmText={t('approve_btn_label')}
                confirmVariant="success"
                onConfirm={executeApprove}
                loading={approveMutation.isPending}
            />

            {/* View Details Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
              <DialogContent className="sm:max-w-[650px] max-h-[85vh] h-auto gap-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-0 overflow-hidden rounded-2xl shadow-2xl flex flex-col">
                <div className="bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 rounded-full border shadow-sm">
                        <AvatarImage src={activeRequest?.employee?.profile_image_url} alt={activeRequest?.employee?.full_name} className="object-cover" />
                        <AvatarFallback className="rounded-full text-sm font-bold bg-primary/10 text-primary uppercase">
                            {activeRequest?.employee?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                        {t('leave_request_details', 'Leave Request Details')}
                      </DialogTitle>
                      <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                        {activeRequest?.employee?.full_name} • {activeRequest?.employee?.employee_id}
                      </p>
                    </div>
                  </div>
                </div>

                <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1 min-h-0">
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">Type & Duration</span>
                      <p className="font-bold text-gray-900 dark:text-gray-100">{activeRequest?.leave_type?.name}</p>
                      <p className="text-xs text-primary font-bold">{activeRequest?.total_days} {t('days')}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">Status</span>
                      <Badge variant={getBadgeVariant(activeRequest?.status)} className="mt-1">
                        {activeRequest?.status}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-2 px-1">Reason</span>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/50 italic text-sm text-gray-600 dark:text-gray-400 leading-relaxed ring-1 ring-gray-100 dark:ring-gray-800">
                      "{activeRequest?.reason}"
                    </div>
                  </div>

                  {activeRequest?.attachments && activeRequest.attachments.length > 0 && (
                    <div>
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-3 px-1">Evidence / Attachments</span>
                      <div className="grid grid-cols-3 gap-3">
                        {activeRequest.attachments.map((url: string, i: number) => (
                          <div 
                            key={i} 
                            className="aspect-square rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all relative group"
                            onClick={() => setPreviewImage(url)}
                          >
                            <img src={url} alt="attachment" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <IconEye className="text-white w-6 h-6" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  </div>
                </PerfectScrollbar>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                  <Button variant="ghost" onClick={() => setViewDialogOpen(false)} className="rounded-xl px-6">
                    Close
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Full Image Preview Modal */}
            <ImagePreviewModal 
                open={!!previewImage} 
                onOpenChange={(open) => !open && setPreviewImage(null)} 
                src={previewImage || ''} 
                title={t('evidence_preview', 'Attachment Preview')}
            />
        </div>
    );
}
