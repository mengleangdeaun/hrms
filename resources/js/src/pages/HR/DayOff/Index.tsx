import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { IconCalendarOff, IconCheck, IconX, IconPlus, IconLoader2, IconCalendar, IconTrash } from '@tabler/icons-react';
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import FilterBar from '@/components/ui/FilterBar';
import TableSkeleton from '@/components/ui/TableSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import ActionButtons from '@/components/ui/ActionButtons';
import ConfirmationModal from '@/components/ConfirmationModal';
import DeleteModal from '@/components/DeleteModal';
import { DatePicker } from '@/components/ui/date-picker';
import SortableHeader from '@/components/ui/SortableHeader';
import { Badge } from '@/components/ui/badge';
import { useFormatDate } from '@/hooks/useFormatDate';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { 
    useDayOffAssignments, 
    useDayOffRequests, 
    useAssignDayOff, 
    useUpdateDayOff, 
    useDeleteDayOff, 
    useApproveDayOffRequest, 
    useRejectDayOffRequest,
    useHRFilterEmployees,
    useHRBranches,
    useHRDepartments
} from '@/hooks/useHRData';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

const ALL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export default function DayOffIndex() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'assignments'|'requests'>('assignments');

    // Mutation Hooks
    const assignMutation = useAssignDayOff();
    const updateMutation = useUpdateDayOff();
    const deleteMutation = useDeleteDayOff();
    const approveMutation = useApproveDayOffRequest();
    const rejectMutation = useRejectDayOffRequest();

    const processing = assignMutation.isPending || updateMutation.isPending || deleteMutation.isPending || approveMutation.isPending || rejectMutation.isPending;

    // Assignments filtering & pagination
    const [search, setSearch] = useState('');
    const [branchFilter, setBranchFilter] = useState('ALL');
    const [deptFilter, setDeptFilter] = useState('ALL');
    const [employeeFilter, setEmployeeFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('full_name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Requests filtering & pagination
    const [reqStatusFilter, setReqStatusFilter] = useState('ALL');
    const [currentPageRequests, setCurrentPageRequests] = useState(1);
    const [itemsPerPageRequests, setItemsPerPageRequests] = useState(10);

    const assignmentParams = useMemo(() => ({
        page: currentPage,
        per_page: itemsPerPage,
        search,
        branch_id: branchFilter,
        department_id: deptFilter,
        employee_id: employeeFilter,
        sort_by: sortBy,
        sort_direction: sortDirection,
    }), [currentPage, itemsPerPage, search, branchFilter, deptFilter, employeeFilter, sortBy, sortDirection]);

    const requestParams = useMemo(() => ({
        page: currentPageRequests,
        per_page: itemsPerPageRequests,
        search,
        status: reqStatusFilter,
        branch_id: branchFilter,
        department_id: deptFilter,
        employee_id: employeeFilter,
    }), [currentPageRequests, itemsPerPageRequests, search, reqStatusFilter, branchFilter, deptFilter, employeeFilter]);

    // Data Hooks
    const { data: assignmentsRes, isLoading: loadingAssignments } = useDayOffAssignments(assignmentParams);
    const { data: requestsRes, isLoading: loadingRequests } = useDayOffRequests(requestParams);
    const { data: employees = [], isLoading: loadingEmployees } = useHRFilterEmployees(true);
    const { data: branches = [] } = useHRBranches();
    const { data: departments = [] } = useHRDepartments();

    const assignments = assignmentsRes?.data || [];
    const requests = requestsRes?.data || [];
    const totalItems = assignmentsRes?.total || 0;
    const totalPages = assignmentsRes?.last_page || 1;
    const totalItemsRequests = requestsRes?.total || 0;
    const totalPagesRequests = requestsRes?.last_page || 1;

    // Assign modal state
    const [assignOpen, setAssignOpen] = useState(false);
    const [assignForm, setAssignForm] = useState({ 
        employee_id: '', 
        days_off: [] as string[], 
        frequency: 'weekly',
        weeks_of_month: [] as number[],
        specific_dates: [] as string[],
        effective_from: dayjs().format('YYYY-MM-DD'), 
        effective_to: '', 
        notes: '' 
    });
    const [editingId, setEditingId] = useState<number|null>(null);

    // Reject modal state
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectId, setRejectId] = useState<number|null>(null);
    const [rejectReason, setRejectReason] = useState('');

    // Confirmation modals
    const [approveOpen, setApproveOpen] = useState(false);
    const [approveId, setApproveId] = useState<number|null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number|null>(null);

    const { formatDate, formatTime } = useFormatDate();

    useEffect(() => { dispatch(setPageTitle(t('day_off_management', 'Day Off Management'))); }, [t, dispatch]);

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['hr-day-off-assignments'] });
        queryClient.invalidateQueries({ queryKey: ['hr-day-off-requests'] });
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignForm.employee_id) { toast.error('Please select employee'); return; }
        if (assignForm.frequency !== 'specific_dates' && assignForm.days_off.length === 0) { toast.error('Please select days'); return; }
        if (assignForm.frequency === 'monthly' && assignForm.weeks_of_month.length === 0) { toast.error('Please select at least one week'); return; }
        if (assignForm.frequency === 'specific_dates' && assignForm.specific_dates.length === 0) { toast.error('Please select at least one date'); return; }
        
        const action = editingId ? updateMutation : assignMutation;
        action.mutate(editingId ? { id: editingId, ...assignForm } : assignForm, {
            onSuccess: () => {
                toast.success(editingId ? t('day_off_updated', 'Day off updated') : t('day_off_assigned', 'Day off assigned'));
                setAssignOpen(false);
                setEditingId(null);
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || 'Operation failed');
            }
        });
    };

    const openAssignModal = (emp?: any) => {
        if (emp?.active_day_off) {
            setEditingId(emp.active_day_off.id);
            setAssignForm({
                employee_id: String(emp.id),
                days_off: emp.active_day_off.days_off || [],
                frequency: emp.active_day_off.frequency || 'weekly',
                weeks_of_month: emp.active_day_off.weeks_of_month || [],
                specific_dates: emp.active_day_off.specific_dates || [],
                effective_from: emp.active_day_off.effective_from?.split('T')[0] || dayjs().format('YYYY-MM-DD'),
                effective_to: emp.active_day_off.effective_to?.split('T')[0] || '',
                notes: emp.active_day_off.notes || '',
            });
        } else {
            setEditingId(null);
            setAssignForm({ 
                employee_id: emp ? String(emp.id) : '', 
                days_off: [], 
                frequency: 'weekly',
                weeks_of_month: [],
                specific_dates: [],
                effective_from: dayjs().format('YYYY-MM-DD'), 
                effective_to: '', 
                notes: '' 
            });
        }
        setAssignOpen(true);
    };

    const handleApprove = async () => {
        if (!approveId) return;
        approveMutation.mutate(approveId, {
            onSuccess: () => {
                toast.success('Request approved');
                setApproveOpen(false);
            },
            onError: (err: any) => toast.error(err.response?.data?.message || 'Failed')
        });
    };

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectId) return;
        rejectMutation.mutate({ id: rejectId, reason: rejectReason }, {
            onSuccess: () => {
                toast.success('Request rejected');
                setRejectOpen(false);
            },
            onError: (err: any) => toast.error(err.response?.data?.message || 'Failed')
        });
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        deleteMutation.mutate(deleteId, {
            onSuccess: () => {
                toast.success('Assignment removed');
                setDeleteOpen(false);
            },
            onError: (err: any) => toast.error(err.response?.data?.message || 'Failed')
        });
    };

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    // Reset page if filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, branchFilter, deptFilter, employeeFilter]);

    useEffect(() => {
        setCurrentPageRequests(1);
    }, [search, reqStatusFilter, branchFilter, deptFilter, employeeFilter]);

    const toggleDay = (day: string) => {
        setAssignForm(prev => ({
            ...prev,
            days_off: prev.days_off.includes(day) ? prev.days_off.filter(d => d !== day) : [...prev.days_off, day]
        }));
    };

    const toggleWeek = (week: number) => {
        setAssignForm(prev => ({
            ...prev,
            weeks_of_month: prev.weeks_of_month.includes(week) ? prev.weeks_of_month.filter(w => w !== week) : [...prev.weeks_of_month, week]
        }));
    };

    const addSpecificDate = (date: Date | undefined) => {
        if (!date) return;
        const dateStr = dayjs(date).format('YYYY-MM-DD');
        if (!assignForm.specific_dates.includes(dateStr)) {
            setAssignForm(prev => ({ ...prev, specific_dates: [...prev.specific_dates, dateStr].sort() }));
        }
    };

    const removeSpecificDate = (dateStr: string) => {
        setAssignForm(prev => ({ ...prev, specific_dates: prev.specific_dates.filter(d => d !== dateStr) }));
    };

    const selectedEmployeeData = useMemo(() => {
        if (!assignForm.employee_id) return null;
        return assignments.find((a: any) => String(a.id) === assignForm.employee_id);
    }, [assignments, assignForm.employee_id]);

    const empOptions = employees.map((e: any) => {
        const assignment = assignments.find((a: any) => a.id === e.id);
        return { 
            value: String(e.id), 
            label: e.full_name, 
            description: `${e.employee_id}${assignment?.working_shift?.name ? ` • ${assignment.working_shift.name}` : ''}` 
        };
    });

    const tabs = (
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-0.5 rounded-lg w-fit h-10 shrink-0">
            {(['assignments', 'requests'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 sm:px-5 py-0 rounded-lg text-[13px] font-bold transition-all flex items-center gap-2 ${activeTab === tab ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {tab === 'assignments' ? t('assignments', 'Assignments') : t('requests', 'Requests')}
                    {tab === 'requests' && requests.filter((r: any) => r.status === 'pending').length > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] w-5 h-5 flex items-center justify-center font-black px-1.5 py-0.5 rounded-full">{requests.filter((r: any) => r.status === 'pending').length}</span>
                    )}
                </button>
            ))}
        </div>
    );

    const getBadgeVariant = (status: string | undefined): "success" | "warning" | "destructive" | "flat" | "default" => {
        switch (status) {
            case 'approved': return 'success';
            case 'pending': return 'warning';
            case 'rejected': return 'destructive';
            default: return 'default';
        }
    };

    return (
        <div>
            {/* ════════ ASSIGNMENTS TAB ════════ */}
            {activeTab === 'assignments' && (
                <>
                    <FilterBar
                        icon={<IconCalendarOff className="w-6 h-6 text-primary" />}
                        title={t('day_off_assignments', 'Day Off Assignments')}
                        description={t('day_off_assignments_desc', 'Manage employee weekly rest day assignments')}
                        search={search} setSearch={setSearch}
                        itemsPerPage={itemsPerPage} setItemsPerPage={setItemsPerPage}
                        hasActiveFilters={branchFilter !== 'ALL' || deptFilter !== 'ALL' || employeeFilter !== 'ALL' || !!search}
                        onClearFilters={() => {
                            setSearch('');
                            setBranchFilter('ALL');
                            setDeptFilter('ALL');
                            setEmployeeFilter('ALL');
                        }}
                        onRefresh={handleRefresh}
                        onAdd={() => openAssignModal()}
                        addLabel={t('assign_day_off', 'Assign Day Off')}
                        preActions={tabs}
                    >
                        <div className="space-y-1.5 flex flex-col w-full">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('branch', 'Branch')}</span>
                            <Select value={branchFilter} onValueChange={setBranchFilter}>
                                <SelectTrigger className="h-10 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-white dark:bg-black">
                                    <SelectItem value="ALL">All Branches</SelectItem>
                                    {branches.map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 flex flex-col w-full">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('department', 'Department')}</span>
                            <Select value={deptFilter} onValueChange={setDeptFilter}>
                                <SelectTrigger className="h-10 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-white dark:bg-black">
                                    <SelectItem value="ALL">All Departments</SelectItem>
                                    {departments.map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 flex flex-col w-full">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('employee', 'Employee')}</span>
                            <SearchableSelect 
                                options={[{ value: 'ALL', label: 'All Employees' }, ...empOptions]} 
                                value={employeeFilter} 
                                onChange={(v) => setEmployeeFilter(String(v))} 
                                placeholder="Select employee..." 
                            />
                        </div>
                    </FilterBar>

                    {loadingAssignments ? <TableSkeleton columns={7} rows={itemsPerPage} /> : totalItems === 0 ? (
                        <EmptyState isSearch={!!search || branchFilter !== 'ALL' || deptFilter !== 'ALL' || employeeFilter !== 'ALL'} searchTerm={search} onClearFilter={() => {
                            setSearch('');
                            setBranchFilter('ALL');
                            setDeptFilter('ALL');
                            setEmployeeFilter('ALL');
                            setCurrentPage(1);
                        }} />
                    ) : (
                        <div className="rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden mb-5 bg-white dark:bg-black shadow-sm">
                            <div className="table-responsive">
                                <table className="w-full text-sm">
                                    <thead className="border-b dark:border-gray-600 text-gray-500 uppercase font-bold text-[11px] tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3 text-left">#</th>
                                            <SortableHeader label={t('employee', 'Employee')} value="full_name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                            <SortableHeader label={t('branch', 'Branch')} value="branch" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                            <th className="px-4 py-3 text-left">{t('current_days_off', 'Days Off')}</th>
                                            <th className="px-4 py-3 text-left">{t('source', 'Source')}</th>
                                            <th className="px-4 py-3 text-left">{t('effective_period', 'Period')}</th>
                                            <th className="px-4 py-3 text-right pr-4">{t('actions', 'Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {assignments.map((emp: any, i: number) => (
                                            <tr key={emp.id} className="hover:bg-gray-50/30 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 text-gray-400 text-xs">{(currentPage-1)*itemsPerPage+i+1}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8 rounded-full border shadow-sm">
                                                            <AvatarImage src={emp.profile_image_url} alt={emp.full_name} className="object-cover" />
                                                            <AvatarFallback className="rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase">
                                                                {emp.full_name?.charAt(0) || '?'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-bold text-gray-900 dark:text-gray-100">{emp.full_name}</p>
                                                            <p className="text-[11px] text-gray-400 uppercase tracking-tighter">{emp.employee_id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{emp.branch?.name || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex flex-wrap gap-1">
                                                            {(emp.resolved_days_off || []).map((d: string) => (
                                                                <span key={d} className="bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-full">
                                                                    {d.charAt(0).toUpperCase() + d.slice(1, 9)}
                                                                </span>
                                                            ))}
                                                            {(!emp.resolved_days_off || emp.resolved_days_off.length === 0) && emp.day_off_frequency !== 'specific_dates' && <span className="text-gray-400 text-xs">-</span>}
                                                        </div>
                                                        {emp.day_off_frequency === 'monthly' && (
                                                            <span className="text-[10px] text-gray-400 font-medium italic">
                                                                {t('weeks', 'Weeks')}: {emp.day_off_weeks?.map((w:number) => w === 5 ? t('last', 'Last') : `${w}${w===1?'st':w===2?'nd':w===3?'rd':'th'}`).join(', ')}
                                                            </span>
                                                        )}
                                                        {emp.day_off_frequency === 'specific_dates' && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {emp.day_off_specific_dates?.slice(0, 3).map((d: string) => (
                                                                    <span key={d} className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                                                        {dayjs(d).format('MMM D')}
                                                                    </span>
                                                                ))}
                                                                {emp.day_off_specific_dates?.length > 3 && (
                                                                    <span className="text-[9px] text-gray-400 font-bold">+{emp.day_off_specific_dates.length - 3}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit ${emp.day_off_source === 'custom' ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                                        <span className={`w-1 h-1 rounded-full ${emp.day_off_source === 'custom' ? 'bg-violet-600' : 'bg-gray-400'}`} />
                                                        {emp.day_off_source === 'custom' ? t('custom', 'Custom') : emp.working_shift?.name || t('shift', 'Shift')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-500">
                                                    {emp.day_off_source === 'custom' && emp.active_day_off ? (
                                                        <div className="flex flex-col">
                                                            <span>{dayjs(emp.active_day_off.effective_from).format('MMM D, YY')} → {emp.active_day_off.effective_to ? dayjs(emp.active_day_off.effective_to).format('MMM D, YY') : '∞'}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="opacity-50 italic">{t('continuous_shift', 'Continuous (Shift)')}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right pr-4">
                                                    <ActionButtons
                                                        variant="rounded"
                                                        onEdit={() => openAssignModal(emp)}
                                                        onDelete={emp.active_day_off ? () => { setDeleteId(emp.active_day_off.id); setDeleteOpen(true); } : undefined}
                                                        skipDeleteConfirm
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination currentPage={currentPage} totalItems={totalItems} itemsPerPage={itemsPerPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                        </div>
                    )}
                </>
            )}

            {/* ════════ REQUESTS TAB ════════ */}
            {activeTab === 'requests' && (
                <>
                    <FilterBar
                        icon={<IconCalendarOff className="w-6 h-6 text-primary" />}
                        title={t('day_off_requests', 'Day Off Requests')}
                        description={t('day_off_requests_desc', 'Review and process employee day-off change requests')}
                        search={search} setSearch={setSearch}
                        itemsPerPage={itemsPerPageRequests} setItemsPerPage={setItemsPerPageRequests}
                        hasActiveFilters={reqStatusFilter !== 'ALL' || branchFilter !== 'ALL' || deptFilter !== 'ALL' || employeeFilter !== 'ALL' || !!search}
                        onClearFilters={() => {
                            setSearch('');
                            setReqStatusFilter('ALL');
                            setBranchFilter('ALL');
                            setDeptFilter('ALL');
                            setEmployeeFilter('ALL');
                        }}
                        onRefresh={handleRefresh}
                        preActions={tabs}
                    >
                        <div className="space-y-1.5 flex flex-col w-full">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('status', 'Status')}</span>
                            <Select value={reqStatusFilter} onValueChange={setReqStatusFilter}>
                                <SelectTrigger className="h-10 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-white dark:bg-black">
                                    <SelectItem value="ALL">All</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 flex flex-col w-full">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('branch', 'Branch')}</span>
                            <Select value={branchFilter} onValueChange={setBranchFilter}>
                                <SelectTrigger className="h-10 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-white dark:bg-black">
                                    <SelectItem value="ALL">All Branches</SelectItem>
                                    {branches.map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 flex flex-col w-full">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('department', 'Department')}</span>
                            <Select value={deptFilter} onValueChange={setDeptFilter}>
                                <SelectTrigger className="h-10 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-white dark:bg-black">
                                    <SelectItem value="ALL">All Departments</SelectItem>
                                    {departments.map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 flex flex-col w-full">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('employee', 'Employee')}</span>
                            <SearchableSelect 
                                options={[{ value: 'ALL', label: 'All Employees' }, ...empOptions]} 
                                value={employeeFilter} 
                                onChange={(v) => setEmployeeFilter(String(v))} 
                                placeholder="Select employee..." 
                            />
                        </div>
                    </FilterBar>

                    {loadingRequests ? <TableSkeleton columns={7} rows={itemsPerPageRequests} /> : totalItemsRequests === 0 ? (
                        <EmptyState 
                            isSearch={reqStatusFilter !== 'ALL' || !!search || branchFilter !== 'ALL' || deptFilter !== 'ALL' || employeeFilter !== 'ALL'} 
                            searchTerm={search}
                            onClearFilter={() => {
                                setSearch('');
                                setReqStatusFilter('ALL');
                                setBranchFilter('ALL');
                                setDeptFilter('ALL');
                                setEmployeeFilter('ALL');
                                setCurrentPageRequests(1);
                            }} 
                        />
                    ) : (
                        <div className="rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden mb-5 bg-white dark:bg-black shadow-sm">
                            <div className="table-responsive">
                                <table className="w-full text-sm">
                                    <thead className="border-b dark:border-gray-600 text-gray-500 uppercase font-bold text-[11px] tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3 text-left">#</th>
                                            <th className="px-4 py-3 text-left">{t('requested_on', 'Requested')}</th>
                                            <th className="px-4 py-3 text-left">{t('employee', 'Employee')}</th>
                                            <th className="px-4 py-3 text-left">{t('current', 'Current')}</th>
                                            <th className="px-4 py-3 text-left">{t('requested', 'Requested')}</th>
                                            <th className="px-4 py-3 text-left">{t('reason', 'Reason')}</th>
                                            <th className="px-4 py-3 text-center">{t('status', 'Status')}</th>
                                            <th className="px-4 py-3 text-left">{t('actioned_at', 'Actioned At')}</th>
                                            <th className="px-4 py-3 text-right pr-4">{t('actions', 'Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {requests.map((req: any, i: number) => (
                                            <tr key={req.id} className="hover:bg-gray-50/30 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 text-gray-400 text-xs">{(currentPageRequests-1)*itemsPerPageRequests+i+1}</td>
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
                                                        <Avatar className="h-8 w-8 rounded-full border shadow-sm">
                                                            <AvatarImage src={req.employee?.profile_image_url} alt={req.employee?.full_name} className="object-cover" />
                                                            <AvatarFallback className="rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase">
                                                                {req.employee?.full_name?.charAt(0) || '?'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-bold text-gray-900 dark:text-gray-100">{req.employee?.full_name}</p>
                                                            <p className="text-[11px] text-gray-400">{req.employee?.employee_id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">{(req.current_days_off||[]).map((d:string) => <span key={d} className="bg-gray-100 dark:bg-gray-800 text-gray-500 text-[11px] font-bold px-2 py-0.5 rounded-full">{d.slice(0,3)}</span>)}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">{(req.requested_days_off||[]).map((d:string) => <span key={d} className="bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-full">{d.slice(0,3)}</span>)}</div>
                                                </td>
                                                <td className="px-4 py-3 max-w-[180px]"><p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{req.reason}</p></td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge size="sm" variant={getBadgeVariant(req.status)} className="font-bold">
                                                        {t(`status_${req.status}`, req.status) as string}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
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
                                                            {t('pending', 'Pending')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right pr-4">
                                                    <ActionButtons
                                                        variant="rounded"
                                                        showApproveReject={req.status === 'pending'}
                                                        skipRejectConfirm
                                                        skipDeleteConfirm
                                                        onApprove={() => { setApproveId(req.id); setApproveOpen(true); }}
                                                        onReject={() => { setRejectId(req.id); setRejectReason(''); setRejectOpen(true); }}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination currentPage={currentPageRequests} totalItems={totalItemsRequests} itemsPerPage={itemsPerPageRequests} totalPages={totalPagesRequests} onPageChange={setCurrentPageRequests} />
                        </div>
                    )}
                </>
            )}

            {/* ════════ ASSIGN MODAL ════════ */}
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                <DialogContent className="sm:max-w-[550px] bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-gray-100">{editingId ? t('edit_day_off', 'Edit Day Off') : t('assign_day_off', 'Assign Day Off')}</DialogTitle>
                        <DialogDescription className="text-gray-500">{t('assign_day_off_desc', 'Set weekly rest day(s) for an employee')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAssign} className="space-y-5 mt-4">
                        {!editingId && (
                            <div>
                                <label className="text-sm font-semibold mb-2 block text-gray-800 dark:text-gray-200">{t('employee', 'Employee')} <span className="text-red-500">*</span></label>
                                <SearchableSelect options={empOptions} value={assignForm.employee_id} onChange={(v) => setAssignForm(p => ({...p, employee_id: String(v)}))} placeholder="Select employee..." />
                            </div>
                        )}

                        {selectedEmployeeData && (
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 space-y-4">
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
                                    <Avatar className="h-10 w-10 rounded-full border shadow-sm">
                                        <AvatarImage src={selectedEmployeeData.profile_image_url} alt={selectedEmployeeData.full_name} className="object-cover" />
                                        <AvatarFallback className="rounded-full text-sm font-bold bg-primary/10 text-primary uppercase">
                                            {selectedEmployeeData.full_name?.charAt(0) || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-gray-100 leading-tight">{selectedEmployeeData.full_name}</p>
                                        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-tight">{selectedEmployeeData.employee_id}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t('current_schedule', 'Current Schedule')}</span>
                                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${selectedEmployeeData.day_off_source === 'custom' ? 'bg-violet-100 text-violet-600' : 'bg-slate-200 text-slate-600'}`}>
                                        {selectedEmployeeData.day_off_source === 'custom' ? t('custom_override', 'Custom Override') : t('shift_default', 'Shift Default')}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedEmployeeData.day_off_frequency === 'specific_dates' ? (
                                        selectedEmployeeData.day_off_specific_dates?.map((d: string) => (
                                            <span key={d} className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                                {dayjs(d).format('MMM D, YYYY')}
                                            </span>
                                        ))
                                    ) : (
                                        (selectedEmployeeData.resolved_days_off || []).map((d: string) => (
                                            <span key={d} className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                                {d} {selectedEmployeeData.day_off_frequency === 'monthly' ? `(${selectedEmployeeData.day_off_weeks?.join(', ')})` : ''}
                                            </span>
                                        ))
                                    )}
                                    {(!selectedEmployeeData.resolved_days_off || selectedEmployeeData.resolved_days_off.length === 0) && selectedEmployeeData.day_off_frequency !== 'specific_dates' && (
                                        <span className="text-xs text-slate-400 italic">{t('no_days_off', 'No days off defined')}</span>
                                    )}
                                </div>
                                {selectedEmployeeData.working_shift && (
                                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <IconCalendarOff className="w-3 h-3" />
                                        {t('base_shift', 'Base Shift')}: <span className="font-bold text-slate-500">{selectedEmployeeData.working_shift.name}</span>
                                    </p>
                                )}
                            </div>
                        )}

                        <Tabs value={assignForm.frequency} onValueChange={(v) => setAssignForm(p => ({...p, frequency: v}))} className="w-full">
                            <TabsList className="grid grid-cols-3 w-full h-11 bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
                                <TabsTrigger value="weekly" className="rounded-lg text-[11px] h-9 font-black uppercase tracking-wider">{t('weekly', 'Weekly')}</TabsTrigger>
                                <TabsTrigger value="monthly" className="rounded-lg text-[11px] h-9 font-black uppercase tracking-wider">{t('monthly', 'Monthly')}</TabsTrigger>
                                <TabsTrigger value="specific_dates" className="rounded-lg text-[11px] h-9 font-black uppercase tracking-wider">{t('specific', 'Specific')}</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="weekly" className="mt-4 animate-in fade-in slide-in-from-top-1">
                                <div>
                                    <label className="text-sm font-semibold mb-3 block text-gray-800 dark:text-gray-200">{t('days_off', 'Days Off')} <span className="text-red-500">*</span></label>
                                    <div className="grid grid-cols-7 gap-1.5">
                                        {ALL_DAYS.map(day => (
                                            <button key={day} type="button" onClick={() => toggleDay(day)}
                                                className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${assignForm.days_off.includes(day) ? 'bg-primary text-white border-primary shadow-sm' : 'bg-gray-50 dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-primary/50'}`}>
                                                {day.slice(0,3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="monthly" className="mt-4 animate-in fade-in slide-in-from-top-1 space-y-5">
                                <div>
                                    <label className="text-sm font-semibold mb-3 block text-gray-800 dark:text-gray-200">{t('days_off', 'Days Off')} <span className="text-red-500">*</span></label>
                                    <div className="grid grid-cols-7 gap-1.5">
                                        {ALL_DAYS.map(day => (
                                            <button key={day} type="button" onClick={() => toggleDay(day)}
                                                className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${assignForm.days_off.includes(day) ? 'bg-primary text-white border-primary shadow-sm' : 'bg-gray-50 dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-primary/50'}`}>
                                                {day.slice(0,3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-500/5 border border-violet-100 dark:border-violet-500/10">
                                    <label className="text-xs font-black uppercase tracking-widest mb-3 block text-violet-600 dark:text-violet-400">{t('weeks_of_month', 'Occurs on weeks')} <span className="text-red-500">*</span></label>
                                    <div className="flex flex-wrap gap-4">
                                        {[1, 2, 3, 4, 5].map(week => (
                                            <div key={week} className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id={`week-${week}`} 
                                                    checked={assignForm.weeks_of_month.includes(week)} 
                                                    onCheckedChange={() => toggleWeek(week)}
                                                    className="border-violet-300 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                                                />
                                                <label htmlFor={`week-${week}`} className="text-sm font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                                                    {week === 5 ? t('last_week', 'Last') : `${week}${week===1?'st':week===2?'nd':week===3?'rd':'th'}`}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="specific_dates" className="mt-4 animate-in fade-in slide-in-from-top-1 space-y-4">
                                <div>
                                    <label className="text-sm font-semibold mb-3 block text-gray-800 dark:text-gray-200">{t('select_dates', 'Select Specific Dates')} <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2">
                                        <DatePicker onChange={addSpecificDate} className="flex-1" placeholder={t('pick_date_to_add', 'Pick a date to add...')} />
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 min-h-[40px]">
                                    {assignForm.specific_dates.length === 0 ? (
                                        <span className="text-xs text-slate-400 italic py-2">{t('no_dates_selected', 'No specific dates selected yet.')}</span>
                                    ) : (
                                        assignForm.specific_dates.map(dateStr => (
                                            <span key={dateStr} className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-500/20 shadow-sm">
                                                {dayjs(dateStr).format('MMM D, YYYY')}
                                                <button type="button" onClick={() => removeSpecificDate(dateStr)} className="hover:text-rose-500 transition-colors">
                                                    <IconTrash size={12} />
                                                </button>
                                            </span>
                                        ))
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold mb-2 block text-gray-800 dark:text-gray-200">{t('effective_from', 'From')} <span className="text-red-500">*</span></label>
                                <DatePicker value={assignForm.effective_from} onChange={d => setAssignForm(p => ({...p, effective_from: d ? dayjs(d).format('YYYY-MM-DD') : ''}))} />
                            </div>
                            <div>
                                <label className="text-sm font-semibold mb-2 block text-gray-800 dark:text-gray-200">{t('effective_to', 'To')}</label>
                                <DatePicker value={assignForm.effective_to} onChange={d => setAssignForm(p => ({...p, effective_to: d ? dayjs(d).format('YYYY-MM-DD') : ''}))} placeholder="∞ Permanent" />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-semibold mb-2 block text-gray-800 dark:text-gray-200">{t('notes', 'Notes')}</label>
                            <Textarea value={assignForm.notes} onChange={e => setAssignForm(p => ({...p, notes: e.target.value}))} className="resize-none h-20 bg-white dark:bg-black border-gray-200 dark:border-gray-800" placeholder="Optional notes..." />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => setAssignOpen(false)} className="border-gray-200 dark:border-gray-800">{t('cancel', 'Cancel')}</Button>
                            <Button type="submit" disabled={assignMutation.isPending || updateMutation.isPending} className="bg-primary hover:bg-primary/90 text-white">
                                {(assignMutation.isPending || updateMutation.isPending) ? <IconLoader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {editingId ? t('update', 'Update') : t('assign', 'Assign')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Reject Modal */}
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-gray-100">{t('reject_request', 'Reject Request')}</DialogTitle>
                        <DialogDescription className="text-gray-500">Provide a reason for rejection.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleReject} className="space-y-4 mt-4">
                        <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="resize-none h-32 bg-white dark:bg-black border-gray-200 dark:border-gray-800" placeholder="Rejection reason..." required />
                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing || !rejectReason.trim()} variant="destructive">{processing ? 'Processing...' : 'Reject'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmationModal isOpen={approveOpen} setIsOpen={setApproveOpen} title="Approve Request" description="Are you sure you want to approve this day off change request?" confirmText="Approve" confirmVariant="success" onConfirm={handleApprove} loading={processing} />
            <DeleteModal isOpen={deleteOpen} setIsOpen={setDeleteOpen} title="Remove Assignment" message="This will remove the custom day-off assignment. The employee will fallback to their shift schedule." onConfirm={handleDelete} isLoading={processing} />
        </div>
    );
}
