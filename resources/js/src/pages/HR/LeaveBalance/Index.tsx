import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Checkbox } from '../../../components/ui/checkbox';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Label } from '../../../components/ui/label';
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from '@/components/ui/avatar';
import { IconBatteryVertical3 } from '@tabler/icons-react';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import ActionButtons from '../../../components/ui/ActionButtons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { DateRangePicker } from '../../../components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { 
    IconScale, 
    IconX, 
    IconDeviceFloppy, 
    IconLoader2, 
    IconInfoCircle, 
    IconUsers, 
    IconCalendarTime,
    IconPlus,
    IconMinus,
    IconCalculator,
    IconCalendarStats
} from '@tabler/icons-react';
import HighlightText from '@/components/ui/HighlightText';
import dayjs from 'dayjs';
import { 
    useHRLeaveBalances, 
    useHRFilterEmployees, 
    useHRLeaveTypes, 
    useHRCreateLeaveBalance, 
    useHRUpdateLeaveBalance 
} from '@/hooks/useHRData';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

const LeaveBalanceIndex = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    // Filter & Sort & Pagination state
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('employee');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [dateFilter, setDateFilter] = useState<DateRange | undefined>({
        from: dayjs().startOf('year').toDate(),
        to: dayjs().endOf('year').toDate()
    });
    const [leaveTypeFilter, setLeaveTypeFilter] = useState('');

    // Manual Adjust Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBalance, setEditingBalance] = useState<any>(null);

    const initialFormState = {
        employee_id: '',
        leave_type_id: '',
        total_accrued: 0,
        total_taken: 0,
        balance: 0,
        year: dayjs().year(),
    };

    const [formData, setFormData] = useState(initialFormState);

    const [employeeFilter, setEmployeeFilter] = useState('');

    // TanStack Query
    const queryParams = useMemo(() => ({
        page: currentPage,
        per_page: itemsPerPage,
        sort_by: sortBy,
        sort_direction: sortDirection,
        search,
        start_date: dateFilter?.from ? dayjs(dateFilter.from).format('YYYY-MM-DD') : undefined,
        end_date: dateFilter?.to ? dayjs(dateFilter.to).format('YYYY-MM-DD') : undefined,
        leave_type_id: leaveTypeFilter || undefined,
        employee_id: employeeFilter || undefined,
    }), [currentPage, itemsPerPage, sortBy, sortDirection, search, dateFilter, leaveTypeFilter, employeeFilter]);

    const { data: response, isLoading: rawLoading } = useHRLeaveBalances(queryParams);
    const loading = useDelayedLoading(rawLoading, 500);
    const balances = response?.data || [];
    const totalItems = response?.total || 0;
    const totalPages = response?.last_page || 1;

    const { data: employees = [] } = useHRFilterEmployees(true);
    const { data: leaveTypes = [] } = useHRLeaveTypes();
    
    const createMutation = useHRCreateLeaveBalance();
    const updateMutation = useHRUpdateLeaveBalance();

    useEffect(() => {
        dispatch(setPageTitle(t('leave_balances_title')));
    }, [t, dispatch]);

    const handleCreate = () => {
        setEditingBalance(null);
        setFormData({ ...initialFormState, year: dayjs().year() });
        setModalOpen(true);
    };

    const handleEdit = (balance: any) => {
        setEditingBalance(balance);
        setFormData({
            employee_id: String(balance.employee_id),
            leave_type_id: String(balance.leave_type_id),
            total_accrued: balance.total_accrued,
            total_taken: balance.total_taken,
            balance: balance.balance,
            year: balance.year,
        });
        setModalOpen(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        let val: any = value;
        if (type === 'number') val = parseFloat(value) || 0;

        let newFormData = { ...formData, [name]: val };

        // Auto-calculate balance
        if (name === 'total_accrued' || name === 'total_taken') {
            const accrued = name === 'total_accrued' ? val : formData.total_accrued;
            const taken = name === 'total_taken' ? val : formData.total_taken;
            newFormData.balance = accrued - taken;
        }

        setFormData(newFormData);
    };

    const handleSelectChange = (value: string, name: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const mutation = editingBalance ? updateMutation : createMutation;
        const payload = editingBalance ? { id: editingBalance.id, ...formData } : formData;

        mutation.mutate(payload, {
            onSuccess: () => {
                toast.success(t('doc_updated'));
                setModalOpen(false);
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || 'Failed to save balance');
            }
        });
    };

    // Reset page if filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, dateFilter, leaveTypeFilter]);

    // Generate year options
    const yearOptions = [];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear + 1; y++) {
        yearOptions.push(
            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
        );
    }

    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <div>
            <FilterBar
                icon={<IconBatteryVertical3 className=" h-6 w-6 text-primary" />}
                title={t('leave_balances_title')}
                description={t('leave_balances_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={handleCreate}
                addLabel={t('manual_adjust_balance_btn')}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['hr-leave-balances'] })}
                hasActiveFilters={!!search || !!dateFilter?.from || !!leaveTypeFilter || !!employeeFilter}
                onClearFilters={() => {
                    setSearch('');
                    setDateFilter({
                        from: dayjs().startOf('year').toDate(),
                        to: dayjs().endOf('year').toDate()
                    });
                    setSortBy('employee');
                    setSortDirection('asc');
                    setLeaveTypeFilter('');
                    setEmployeeFilter('');
                }}
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
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('leave_type_label')}</span>
                    <SearchableSelect
                        options={leaveTypes.map((type: any) => ({
                            value: String(type.id),
                            label: type.name,
                            description: `Allowance: ${type.allowance} days`
                        }))}
                        value={leaveTypeFilter}
                        onChange={(val) => setLeaveTypeFilter(String(val))}
                        placeholder={t('all_leave_types_placeholder')}
                        searchPlaceholder={t('search_leave_types_placeholder')}
                    />
                </div>

                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('employee_label')}</span>
                    <SearchableSelect
                        options={employees.map((emp: any) => ({
                            value: String(emp.id),
                            label: emp.full_name,
                            description: emp.employee_id
                        }))}
                        value={employeeFilter}
                        onChange={(val) => setEmployeeFilter(String(val))}
                        placeholder={t('all_employees_placeholder')}
                        searchPlaceholder={t('search_employees_placeholder')}
                    />
                </div>
            </FilterBar>

            {loading ? (
                <TableSkeleton columns={6} rows={itemsPerPage} />
            ) : response?.total === 0 ? (
                <EmptyState
                    isSearch={!!search}
                    searchTerm={search}
                    title={search ? undefined : t('no_balances_found_title')}
                    description={search ? undefined : t('no_balances_found_period_desc')}
                    onClearFilter={() => {
                        setSearch('');
                        setCurrentPage(1);
                    }}
                />
            ) : (
                <div className="bg-white dark:bg-black rounded-lg border overflow-hidden">
                    <PerfectScrollbar className="overflow-auto">
                    <table className="table-hover w-full table">
                        <thead className='border-b dark:border-gray-600' >
                            <tr>
                                <th>#</th>
                                <SortableHeader label={t('employee_sort_label')} value="employee" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                <SortableHeader label={t('leave_type_label')} value="leave_type" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                <SortableHeader label={t('total_accrued_label')} value="total_accrued" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                <SortableHeader label={t('total_taken_label')} value="total_taken" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                <SortableHeader label={t('remaining_balance_label')} value="balance" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                <th className="text-right">{t('actions_label')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {balances.map((balance: any, index: number) => (
                                <tr key={balance.id}>
                                    <td className="text-start text-gray-400 text-xs font-medium">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 rounded-full border shadow-sm">
                                                <AvatarImage src={balance.employee?.profile_image_url} alt={balance.employee?.full_name} className="object-cover" />
                                                <AvatarFallback className="rounded-full text-[10px] font-bold bg-muted text-muted-foreground uppercase">
                                                    {balance.employee?.full_name?.charAt(0) || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-semibold text-gray-800 dark:text-gray-200">
                                                    <HighlightText text={balance.employee?.full_name} highlight={search} />
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    <HighlightText text={balance.employee?.employee_id} highlight={search} />
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            {balance.leave_type && (
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: balance.leave_type?.color || '#000000' }}></div>
                                            )}
                                            <HighlightText text={balance.leave_type?.name || 'N/A'} highlight={search} />
                                        </div>
                                    </td>
                                    <td><span className="font-semibold text-emerald-600 dark:text-emerald-400">{parseFloat(balance.total_accrued)}</span> <span className="text-xs text-gray-400">days</span></td>
                                    <td><span className="font-semibold text-rose-600 dark:text-rose-400">{parseFloat(balance.total_taken)}</span> <span className="text-xs text-gray-400">days</span></td>
                                    <td>
                                        <div className="flex items-center gap-1">
                                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-bold shadow-sm ${parseFloat(balance.balance) < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                parseFloat(balance.balance) === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                }`}>
                                                {parseFloat(balance.balance)}
                                            </span>
                                            <span className="text-xs text-gray-500 font-medium">{t('days')}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <ActionButtons
                                            variant="rounded"
                                            onEdit={() => handleEdit(balance)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </PerfectScrollbar>

                    <div className="border-t border-gray-100 dark:border-gray-800">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}

            {/* Leave Balance Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent
                    className="sm:max-w-[700px] w-[95vw] max-h-[90vh] h-auto flex flex-col p-2
                        !rounded-2xl shadow-xl overflow-hidden
                        bg-background/30 dark:bg-dark backdrop-blur-xl [&>button]:hidden"
                >
                    <div className="flex flex-col h-full rounded-xl overflow-hidden
                        bg-white dark:bg-gray-900
                        ring-1 ring-white/40 dark:ring-gray-700/50 shadow-lg">
                        
                        {/* Header */}
                        <div className="shrink-0 px-6 py-5 flex items-center justify-between
                            bg-primary/5 dark:bg-primary/10 rounded-t-xl">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary/20 text-primary shadow-sm border border-primary/10">
                                    <IconScale size={24} />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                                        {editingBalance ? t('edit_leave_balance_title') : t('manual_initial_balance_title')}
                                    </DialogTitle>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                                        {editingBalance ? t('update_leave_balance_detail_desc') : t('set_initial_balance_desc')}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setModalOpen(false)}
                                className="p-2 rounded-full border border-white dark:border-gray-700
                                    hover:bg-gray-100 dark:hover:bg-gray-800/50
                                    hover:scale-105 active:scale-95 transition-all"
                            >
                                <IconX size={20} className="text-gray-500 hover:text-gray-700 dark:text-gray-400" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1 min-h-0">
                            <form id="balance-form" onSubmit={handleSubmit} className="p-6 space-y-8">
                                
                                {/* Block 1: Stakeholders */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <IconUsers size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('employee_leave_type_title', 'Stakeholders')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('employee_label')} <span className="text-rose-500">*</span></Label>
                                            <SearchableSelect
                                                options={employees.map((emp: any) => ({
                                                    value: String(emp.id),
                                                    label: emp.full_name,
                                                    description: emp.employee_id
                                                }))}
                                                value={formData.employee_id}
                                                onChange={(val) => handleSelectChange(String(val), 'employee_id')}
                                                placeholder={t('select_employee_placeholder')}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('leave_type_label')} <span className="text-rose-500">*</span></Label>
                                            <SearchableSelect
                                                options={leaveTypes.map((type: any) => ({
                                                    value: String(type.id),
                                                    label: type.name,
                                                    color: type.color || '#000000'
                                                }))}
                                                value={formData.leave_type_id}
                                                onChange={(val) => handleSelectChange(String(val), 'leave_type_id')}
                                                placeholder={t('select_leave_type_placeholder')}
                                                searchPlaceholder={t('search_leave_types_placeholder')}
                                                disabled={!!editingBalance}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Block 2: Balance Adjustment */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                            <IconCalculator size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('balance_details_title', 'Balance Adjustment')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('total_accrued_label')} <span className="text-rose-500">*</span></Label>
                                                <div className="relative">
                                                    <IconPlus size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                                                    <Input
                                                        name="total_accrued"
                                                        type="number"
                                                        step="0.5"
                                                        value={formData.total_accrued}
                                                        onChange={handleChange}
                                                        required
                                                        min="0"
                                                        placeholder="0.0"
                                                        className="pl-11 h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-600"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('total_taken_label')} <span className="text-rose-500">*</span></Label>
                                                <div className="relative">
                                                    <IconMinus size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500" />
                                                    <Input
                                                        name="total_taken"
                                                        type="number"
                                                        step="0.5"
                                                        value={formData.total_taken}
                                                        onChange={handleChange}
                                                        required
                                                        min="0"
                                                        placeholder="0.0"
                                                        className="pl-11 h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-rose-600"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('balance_label')}</Label>
                                                <Input
                                                    value={formData.balance}
                                                    readOnly
                                                    className="h-11 font-black bg-slate-100 dark:bg-slate-800 border-primary/20 text-primary text-center text-lg"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-3">
                                            <IconInfoCircle size={16} className="text-primary shrink-0" />
                                            <p className="text-[10px] text-slate-500 font-medium">
                                                {t('balance_auto_calc_help', 'Balance is automatically calculated as Accrued minus Taken.')}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {/* Block 3: Period */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                            <IconCalendarTime size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('period_title', 'Reporting Period')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('year_label')} <span className="text-rose-500">*</span></Label>
                                            <div className="relative">
                                                <IconCalendarStats size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <Input
                                                    name="year"
                                                    type="number"
                                                    value={formData.year}
                                                    readOnly
                                                    className="pl-11 h-11 font-bold bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </form>
                        </PerfectScrollbar>

                        {/* Footer */}
                        <div className="shrink-0 flex items-center justify-between px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-b-xl">
                            <div className="hidden sm:block">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <IconInfoCircle size={12} className="text-primary" />
                                    {t('mandatory_fields_info', 'Fields marked * are mandatory')}
                                </p>
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 sm:flex-none font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 uppercase tracking-widest text-[10px] h-10"
                                >
                                    {t('cancel_btn_label')}
                                </Button>
                                <Button
                                    type="submit"
                                    form="balance-form"
                                    disabled={isSaving}
                                    className="flex-1 sm:flex-none h-10 px-8 gap-2 font-black shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px]"
                                >
                                    {isSaving ? <IconLoader2 className="animate-spin" size={16} /> : <IconDeviceFloppy size={16} />}
                                    {isSaving ? t('saving_dots') : (editingBalance ? t('save_changes_btn') : t('create_balance_btn'))}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LeaveBalanceIndex;
