import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { IconActivity, IconCamera, IconMapPin, IconUser, IconCalendarEvent, IconCheck, IconAlertTriangle, IconClock, IconEye, IconExternalLink, IconFilter } from '@tabler/icons-react';
import HighlightText from '@/components/ui/HighlightText';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Textarea } from '@/components/ui/textarea';

// Standard Components
import FilterBar from '@/components/ui/FilterBar';
import TableSkeleton from '@/components/ui/TableSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import SortableHeader from '@/components/ui/SortableHeader';
import DeleteModal from '@/components/DeleteModal';
import ActionButtons from '@/components/ui/ActionButtons';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHRActivities, useHRFilterEmployees, useHRUpdateActivityStatus, useHRDeleteActivity, exportHRActivities } from '@/hooks/useHRData';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    submitted: { label: 'submitted_status', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <IconClock size={12} /> },
    reviewed: { label: 'reviewed_status', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <IconCheck size={12} /> },
    flagged: { label: 'flagged_status', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <IconAlertTriangle size={12} /> },
};

export default function HrActivityIndex() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    // UI State
    const [selected, setSelected] = useState<any | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [adminNote, setAdminNote] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [activePhotoIdx, setActivePhotoIdx] = useState(0);

    // Deletion
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    // Filters & Sorting
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [employeeFilter, setEmployeeFilter] = useState('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [sortBy, setSortBy] = useState('submitted_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        dispatch(setPageTitle(t('activity_log')));
    }, [t, dispatch]);

    // TanStack Query
    const queryParams = useMemo(() => {
        const params: any = {
            page: currentPage,
            per_page: itemsPerPage,
            sort_by: sortBy,
            sort_dir: sortDirection
        };
        if (search) params.search = search;
        if (statusFilter !== 'all') params.status = statusFilter;
        if (employeeFilter !== 'all') params.employee_id = employeeFilter;
        if (dateRange?.from) params.date_from = format(dateRange.from, 'yyyy-MM-dd');
        if (dateRange?.to) params.date_to = format(dateRange.to, 'yyyy-MM-dd');
        return params;
    }, [currentPage, itemsPerPage, sortBy, sortDirection, search, statusFilter, employeeFilter, dateRange]);

    const { data: pagination, isLoading: rawLoading } = useHRActivities(queryParams);
    const loading = useDelayedLoading(rawLoading, 500);
    const activities = pagination?.data ?? [];

    const { data: employees = [] } = useHRFilterEmployees(true);
    
    const updateStatusMutation = useHRUpdateActivityStatus();
    const deleteMutation = useHRDeleteActivity();

    const handleSort = (column: string) => {
        if (sortBy === column) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortBy(column); setSortDirection('desc'); }
        setCurrentPage(1);
    };

    const openDetail = (act: any) => {
        setSelected(act);
        setNewStatus(act.status);
        setAdminNote(act.admin_note ?? '');
        setActivePhotoIdx(0);
        setDetailOpen(true);
    };

    const saveStatus = async () => {
        if (!selected) return;
        updateStatusMutation.mutate({ id: selected.id, status: newStatus, admin_note: adminNote }, {
            onSuccess: () => {
                toast.success(t('activity_updated_msg'));
                setDetailOpen(false);
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || t('failed_update_msg'));
            }
        });
    };

    const confirmDelete = (id: number) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        deleteMutation.mutate(itemToDelete, {
            onSuccess: () => {
                toast.success(t('activity_deleted_msg'));
                setDeleteModalOpen(false);
                setItemToDelete(null);
            },
            onError: () => {
                toast.error(t('failed_delete_msg'));
            }
        });
    };

    const handleExport = async () => {
        try {
            toast.loading(t('exporting', 'Exporting...'), { id: 'export' });
            const params = {
                search: search,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                employee_id: employeeFilter !== 'all' ? employeeFilter : undefined,
                date_from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                date_to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
            };
            await exportHRActivities(params);
            toast.success(t('export_success', 'Exported successfully'), { id: 'export' });
        } catch (e) {
            toast.error(t('export_error', 'Export failed'), { id: 'export' });
        }
    };


    const employeeOptions = useMemo(() => [
        { value: 'all', label: t('all_employees_label') },
        ...employees.map((e: any) => ({ value: String(e.id), label: `${e.full_name} (${e.employee_id})` }))
    ], [employees, t]);

    const hasActiveFilters = search !== '' || statusFilter !== 'all' || employeeFilter !== 'all' || dateRange !== undefined;

    return (
        <div>
            <FilterBar
                icon={<IconCamera className="w-6 h-6 text-primary" />}
                title={t('activity_log')}
                description={t('activity_log_desc')}
                search={searchInput}
                setSearch={setSearchInput}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['hr-activities'] })}
                onExport={handleExport}
                hasActiveFilters={hasActiveFilters}

                onClearFilters={() => {
                    setSearchInput('');
                    setSearch('');
                    setStatusFilter('all');
                    setEmployeeFilter('all');
                    setDateRange(undefined);
                    setCurrentPage(1);
                }}
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('date_range_label')}</span>
                    <DateRangePicker
                        value={dateRange}
                        onChange={(range) => { setDateRange(range); setCurrentPage(1); }}
                        placeholder={t('all_dates_label')}
                    />
                </div>

                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('status_label')}</span>
                    <Select
                        value={statusFilter}
                        onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                    >
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                            <SelectValue placeholder={t('all_statuses_label')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-medium">{t('all_statuses_label')}</SelectItem>
                            <SelectItem value="submitted" className="font-medium">{t('submitted_status')}</SelectItem>
                            <SelectItem value="reviewed" className="font-medium">{t('reviewed_status')}</SelectItem>
                            <SelectItem value="flagged" className="font-medium">{t('flagged_status')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('employee_label')}</span>
                    <SearchableSelect
                        options={employeeOptions}
                        value={employeeFilter}
                        onChange={(val) => { setEmployeeFilter(String(val)); setCurrentPage(1); }}
                        placeholder={t('all_employees_label')}
                    />
                </div>
            </FilterBar>

                    {loading ? (
                        <TableSkeleton columns={6} rows={itemsPerPage} />
                    ) : activities.length === 0 ? (
                        <EmptyState
                            isSearch={hasActiveFilters}
                            searchTerm={search}
                            onClearFilter={() => {
                                setSearch(''); setStatusFilter('all'); setEmployeeFilter('all');
                                setDateRange(undefined); setCurrentPage(1);
                            }}
                            title={t('no_activities_found_title')}
                            description={t('no_activities_found_desc')}
                        />
                    ) : (
            <div className="table-responsive bg-white dark:bg-black rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                        <table className="w-full table-hover text-left">
                            <thead className="border-b dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-4">#</th>
                                    <th className="px-6 py-4 w-20">{t('photo_label')}</th>
                                    <th className="px-6 py-4 ">{t('type_label', 'Type')}</th>
                                    <SortableHeader label={t('employee_label')} value="employee.full_name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label={t('submitted_status')} value="submitted_at" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th className="px-6 py-4">{t('location_label')}</th>
                                    <SortableHeader label={t('status_label')} value="status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th className="px-6 py-4 text-right">{t('actions_label')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium">
                                {activities.map((act: any, index: number) => {
                                    const status = STATUS_CONFIG[act.status] ?? STATUS_CONFIG.submitted;
                                    return (
                                        <tr key={act.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="text-start text-gray-400 text-xs font-medium">
                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                            </td>
                                            {/* Photo Thumbnail */}
                                            <td className="px-6 py-3">
                                                <div
                                                    className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 cursor-pointer hover:scale-105 transition-transform group shadow-sm"
                                                    onClick={() => openDetail(act)}
                                                >
                                                    <img src={act.photo_url} alt="" className="w-full h-full object-cover" />
                                                    {act.attachment_urls && act.attachment_urls.length > 1 && (
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="text-[10px] font-black text-white">+{act.attachment_urls.length - 1}</span>
                                                        </div>
                                                    )}
                                                    {act.attachment_urls && act.attachment_urls.length > 1 && (
                                                        <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-primary text-[8px] flex items-center justify-center text-white border border-white dark:border-gray-800 font-bold group-hover:hidden">
                                                            {act.attachment_urls.length}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Type */}
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-50 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded-md border border-gray-100 dark:border-gray-700">
                                                    {act.activity_type ?? 'N/A'}
                                                </span>
                                            </td>
                                            

                                            {/* Employee */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <div className="text-gray-900 dark:text-white font-bold">
                                                            <HighlightText text={act.employee?.full_name} highlight={search} />
                                                        </div>
                                                        <div className="text-xs text-gray-400 font-medium">
                                                            <HighlightText text={act.employee?.employee_id} highlight={search} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Date */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-gray-700 dark:text-gray-300">
                                                    {new Date(act.submitted_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-0.5">
                                                    {new Date(act.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>

                                            {/* Location */}
                                            <td className="px-6 py-4">
                                                {act.latitude ? (
                                                    <a
                                                        href={`https://www.google.com/maps?q=${act.latitude},${act.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group inline-flex items-center gap-1.5 text-primary hover:text-primary-dark transition-colors"
                                                    >
                                                        <IconMapPin size={14} className="shrink-0 group-hover:animate-bounce" />
                                                        <span className="truncate max-w-[150px] font-bold">
                                                            {act.location_name ?? t('view_map_label')}
                                                        </span>
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-300 font-normal italic">{t('no_gps_label')}</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-none', status.className)}>
                                                    {status.icon} {t(status.label)}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <ActionButtons
                                                    skipDeleteConfirm={true}
                                                    onDelete={() => confirmDelete(act.id)}
                                                    onView={() => openDetail(act)}
                                                    viewLabel={t('review_activity_label')}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                   
                </div>
                {pagination && pagination.total > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={pagination.last_page}
                        totalItems={pagination.total}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>
             )}

            {/* Review Detail Panel - Shadcn Dialog Version */}
<Dialog open={detailOpen} onOpenChange={setDetailOpen}>
  <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[90vh] backdrop-blur-sm gap-0 h-auto flex flex-col p-0 bg-white dark:bg-slate-900 ring-[10px] ring-white/40 dark:ring-white/10 border shadow-2xl rounded-2xl overflow-hidden">
    {/* Header — compact gradient + icon */}
    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
      <div className="bg-primary/20 p-2 rounded-xl shadow-sm">
        <IconActivity className="text-primary w-5 h-5" />
      </div>
      <div>
        <DialogTitle className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
          {t('activity_review_title')}
        </DialogTitle>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {t('activity_review_desc')} {selected?.employee?.full_name || t('activity')}.
        </p>
      </div>
    </div>

    {/* Scrollable Content — 2‑column grid */}
    <PerfectScrollbar  options={{ suppressScrollX: true }} className="flex-1 min-h-0">
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* LEFT COLUMN — Gallery + Meta */}
          <div className="space-y-4">
            {/* Photo Gallery */}
            <div className="space-y-2">
              <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden group border border-gray-100 dark:border-gray-800">
                <img
                  src={selected?.attachment_urls?.[activePhotoIdx] ?? selected?.photo_url}
                  alt="Activity"
                  className="w-full h-full object-contain"
                />
                <a
                  href={selected?.attachment_urls?.[activePhotoIdx] ?? selected?.photo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-gray-800 dark:text-gray-200 rounded-full hover:bg-white dark:hover:bg-gray-900 hover:scale-105 transition-all duration-200"
                  title="Open full image in new tab"
                >
                  <IconExternalLink size={14} />
                </a>
                {selected?.attachment_urls && selected.attachment_urls.length > 1 && (
                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-semibold text-white uppercase tracking-wider border border-white/20">
                    {activePhotoIdx + 1} / {selected.attachment_urls.length}
                  </div>
                )}
              </div>
              {selected?.attachment_urls && selected.attachment_urls.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto p-1 scrollbar-hide">
                  {selected.attachment_urls.map((url: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setActivePhotoIdx(i)}
                      className={cn(
                        "relative shrink-0 w-16 h-11 rounded-md overflow-hidden border transition-all",
                        activePhotoIdx === i
                          ? "border-primary ring-1 ring-primary scale-105 shadow-sm"
                          : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Metadata (Date & Location) — moved from grid to vertical stack */}
            <div className="space-y-3 pt-1 border-t border-gray-100 dark:border-gray-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  <IconCalendarEvent size={10} /> {t('date_time_label')}
                </div>
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                  {selected?.submitted_at &&
                    new Date(selected.submitted_at).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                </p>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  <IconMapPin size={10} /> {t('location_label')}
                </div>
                {selected?.latitude ? (
                  <a
                    href={`https://www.google.com/maps?q=${selected.latitude},${selected.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-primary hover:underline block truncate"
                  >
                    {selected.location_name ??
                      `${parseFloat(selected.latitude).toFixed(4)}, ${parseFloat(selected.longitude).toFixed(4)}`}
                  </a>
                ) : (
                  <p className="text-xs font-medium text-gray-400">{t('unavailable_label')}</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — Employee info, comment, review */}
          <div className="space-y-4">
            {/* Header info (type, name, designation, badge) */}
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {selected?.activity_type ?? t('outdoor_activity_label')}
                </p>
                <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white leading-tight">
                  {selected?.employee?.full_name}
                </h3>
                <p className="text-xs font-medium text-primary flex items-center gap-1">
                  <IconUser size={12} />
                  {selected?.employee?.designation?.name} · {selected?.employee?.branch?.name}
                </p>
              </div>
              <span
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-gray-800 rounded-full text-[10px] font-semibold border shadow-sm uppercase',
                  (STATUS_CONFIG[selected?.status] ?? STATUS_CONFIG.submitted).className
                )}
              >
                {(STATUS_CONFIG[selected?.status] ?? STATUS_CONFIG.submitted).icon}
                {selected?.status}
              </span>
            </div>

            {/* Staff comment */}
            {selected?.comment && (
              <div className="border-l-2 border-primary pl-3 py-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  {t('staff_comment_label')}
                </p>
                <p className="text-xs font-normal text-gray-700 dark:text-gray-300 leading-relaxed italic">
                  "{selected.comment}"
                </p>
              </div>
            )}

            {/* Manager review form */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase text-gray-400">
                  {t('manager_review_label')}
                </p>
                <div className="flex gap-1.5">
                  {['submitted', 'reviewed', 'flagged'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setNewStatus(s)}
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider border transition-all active:scale-95',
                        newStatus === s
                          ? STATUS_CONFIG[s].className +
                              ' ring-1 ring-primary ring-offset-1 dark:ring-offset-[#0e1726]'
                          : 'bg-transparent text-gray-400 border-gray-200 dark:border-gray-800 grayscale opacity-60'
                      )}
                    >
                      {t(`${s}_status`)}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                rows={2}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={t('admin_note_placeholder')}
                className="text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </PerfectScrollbar>

    {/* Sticky Footer */}
    <div className="shrink-0 flex justify-end gap-2 px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-background">
      <Button type="button" variant="ghost" size="sm" className="px-4" onClick={() => setDetailOpen(false)}>
        {t('discard_btn_label')}
      </Button>
      <Button
        type="button"
        variant="default"
        size="sm"
        className="px-5 bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20"
        onClick={saveStatus}
        disabled={updateStatusMutation.isPending}
      >
        {updateStatusMutation.isPending ? t('saving_label') : t('confirm_review_btn')}
      </Button>
    </div>
  </DialogContent>
</Dialog>

            {/* Delete Modal */}
            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={deleteMutation.isPending}
                title={t('delete_activity_title')}
                message={t('delete_activity_confirm')}
            />
        </div>
    );
}
