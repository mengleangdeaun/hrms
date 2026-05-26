import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { Label } from '../../../components/ui/label';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { DatePicker } from '../../../components/ui/date-picker';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { Badge } from '../../../components/ui/badge';
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from '@/components/ui/avatar';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { IconUserCheck, IconX, IconUsers } from '@tabler/icons-react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import dayjs from 'dayjs';
import { IconCalendar } from '@tabler/icons-react';
import HighlightText from '@/components/ui/HighlightText';
import { 
    useHRLeaveAllocations, 
    useHRFilterEmployees, 
    useHRLeavePolicies, 
    useHRDepartments, 
    useHRBranches, 
    useHRCreateLeaveAllocation, 
    useHRUpdateLeaveAllocation, 
    useHRDeleteLeaveAllocation 
} from '@/hooks/useHRData';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

const LeaveAllocationIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    // Filter & Sort & Pagination state
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('employee');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingAllocation, setEditingAllocation] = useState<any>(null);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const initialFormState = {
        employee_ids: [] as string[],
        leave_policy_id: '',
        effective_date: dayjs().format('YYYY-MM-DD'),
        expiration_date: '',
        is_active: true,
        approved_by: '',
    };

    const [formData, setFormData] = useState(initialFormState);

    // TanStack Query
    const { data: rawAllocations = [], isLoading: rawLoading } = useHRLeaveAllocations();
    const loading = useDelayedLoading(rawLoading, 500);
    const allocations = rawAllocations;

    const { data: employees = [] } = useHRFilterEmployees();
    const { data: policies = [] } = useHRLeavePolicies();
    const { data: departments = [] } = useHRDepartments();
    const { data: branches = [] } = useHRBranches();

    const createMutation = useHRCreateLeaveAllocation();
    const updateMutation = useHRUpdateLeaveAllocation();
    const deleteMutation = useHRDeleteLeaveAllocation();

    const handleCreate = () => {
        setEditingAllocation(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    useEffect(() => {
        dispatch(setPageTitle(t('leave_allocations_title')));
    }, [t, dispatch]);

    const handleEdit = (allocation: any) => {
        setEditingAllocation(allocation);
        setFormData({
            employee_ids: [String(allocation.employee_id)],
            leave_policy_id: String(allocation.leave_policy_id),
            effective_date: allocation.effective_date ? dayjs(allocation.effective_date).format('YYYY-MM-DD') : '',
            expiration_date: allocation.expiration_date ? dayjs(allocation.expiration_date).format('YYYY-MM-DD') : '',
            is_active: allocation.is_active == 1 || allocation.is_active === true,
            approved_by: allocation.approved_by ? String(allocation.approved_by) : '',
        });
        setModalOpen(true);
    };

    const confirmDelete = (id: number) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;

        deleteMutation.mutate(itemToDelete, {
            onSuccess: () => {
                toast.success(t('doc_deleted'));
                setDeleteModalOpen(false);
                setItemToDelete(null);
            },
            onError: () => {
                toast.error(t('failed_delete_msg'));
            }
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;

        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
        } as typeof prev));
    };

    const handleSelectChange = (value: string, name: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEmployeeAdd = (val: string) => {
        if (!val) return;
        setFormData(prev => {
            if (prev.employee_ids.includes(val)) return prev;
            return { ...prev, employee_ids: [...prev.employee_ids, val] };
        });
    };

    const handleEmployeeRemove = (idToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            employee_ids: prev.employee_ids.filter(id => id !== idToRemove)
        }));
    };

    const handleQuickAssign = (type: 'all' | 'dept' | 'branch', id?: string | number) => {
        let targets: any[] = [];
        if (type === 'all') {
            targets = employees;
        } else if (type === 'dept') {
            targets = employees.filter((emp: any) => String(emp.department_id) === String(id));
        } else if (type === 'branch') {
            targets = employees.filter((emp: any) => String(emp.branch_id) === String(id));
        }

        const newIds = targets.map(emp => String(emp.id));

        setFormData(prev => {
            const combined = new Set([...prev.employee_ids, ...newIds]);
            return { ...prev, employee_ids: Array.from(combined) };
        });
    };

    const handleDateChange = (date: Date | undefined, name: string) => {
        setFormData(prev => ({ ...prev, [name]: date ? dayjs(date).format('YYYY-MM-DD') : '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const mutation = editingAllocation ? updateMutation : createMutation;
        
        // Clean up empty expiration date and approved_by to send as null
        const payload: any = { ...formData };
        if (!payload.expiration_date) delete payload.expiration_date;
        if (!payload.approved_by) delete payload.approved_by;

        // If editing, map it back to singular payload if API expects update on exactly 1 ID.
        if (editingAllocation) {
            payload.employee_id = payload.employee_ids[0];
            payload.id = editingAllocation.id;
        }

        mutation.mutate(payload, {
            onSuccess: (data: any) => {
                toast.success(data.message || `Leave Allocation ${editingAllocation ? 'updated' : 'created'} successfully`);
                setModalOpen(false);
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || 'Failed to save allocation');
            }
        });
    };

    // Derived state for table
    const filteredAndSortedAllocations = useMemo(() => {
        let result = [...allocations];

        // Search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(a =>
                a.employee?.full_name?.toLowerCase().includes(q) ||
                a.leave_policy?.name?.toLowerCase().includes(q)
            );
        }

        // Sort
        result.sort((a, b) => {
            let valA, valB;
            if (sortBy === 'employee') {
                valA = a.employee?.full_name || '';
                valB = b.employee?.full_name || '';
            } else if (sortBy === 'policy') {
                valA = a.leave_policy?.name || '';
                valB = b.leave_policy?.name || '';
            } else {
                valA = a[sortBy] || '';
                valB = b[sortBy] || '';
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [allocations, search, sortBy, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedAllocations.length / itemsPerPage);
    const paginatedAllocations = filteredAndSortedAllocations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page if search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const isSaving = createMutation.isPending || updateMutation.isPending;
    const isDeleting = deleteMutation.isPending;

    return (
        <div>
            <FilterBar
                icon={<IconCalendar className="w-6 h-6 text-primary" />}
                title={t('leave_allocations_title')}
                description={t('leave_allocations_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={handleCreate}
                addLabel={t('assign_leave_policy_btn')}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['hr-leave-allocations'] })}
                hasActiveFilters={sortBy !== 'employee' || sortDirection !== 'asc'}
                onClearFilters={() => {
                    setSortBy('employee');
                    setSortDirection('asc');
                }}
            />

            {loading ? (
                <TableSkeleton columns={6} rows={itemsPerPage} />
            ) : allocations.length === 0 ? (
                <EmptyState
                    title={t('no_allocations_found_title')}
                    description={t('assign_leave_policy_desc')}
                    actionLabel={t('assign_leave_policy_btn')}
                    onAction={handleCreate}
                />
            ) : filteredAndSortedAllocations.length === 0 ? (
                <EmptyState
                    isSearch
                    searchTerm={search}
                    onClearFilter={() => {
                        setSearch('');
                        setSortBy('employee');
                        setSortDirection('asc');
                    }}
                />
            ) : (
                <div className="table-responsive bg-white dark:bg-black rounded-lg border overflow-hidden">
                    <PerfectScrollbar className="table-responsive">
                    <table className="table-hover w-full table">
                        <thead className='border-b dark:border-gray-600' >
                            <tr>
                                <th>#</th>
                                <SortableHeader label={t('employee_sort_label')} value="employee" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('policy_sort_label')} value="policy" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('effective_date_label')} value="effective_date" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('mng_approver_sort_label')} value="approved_by" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('status_label')} value="is_active" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">{t('actions_label')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedAllocations.map((allocation: any, index: number) => (
                                <tr key={allocation.id}>
                                    <td className="text-start text-gray-400 text-xs font-medium">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 rounded-full border shadow-sm">
                                                <AvatarImage src={allocation.employee?.profile_image_url} alt={allocation.employee?.full_name} className="object-cover" />
                                                <AvatarFallback className="rounded-full text-[10px] font-bold bg-muted text-muted-foreground uppercase">
                                                    {allocation.employee?.full_name?.charAt(0) || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="font-semibold text-gray-800 dark:text-gray-200">
                                                <HighlightText text={allocation.employee?.full_name} highlight={search} />
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: allocation.leave_policy?.leave_type?.color || '#000' }}></div>
                                            <span className="font-medium">
                                                <HighlightText text={allocation.leave_policy?.name} highlight={search} />
                                            </span>
                                        </div>
                                    </td>
                                    <td>{dayjs(allocation.effective_date).format('MMM DD, YYYY')}</td>
                                    <td>
                                        {allocation.approver?.full_name ? (
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{allocation.approver.full_name}</span>
                                        ) : allocation.employee?.line_manager?.full_name ? (
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">{allocation.employee.line_manager.full_name}</span>
                                                <span className="text-[10px] text-gray-400 italic uppercase tracking-tighter">Line Manager (Fallback)</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">N/A (System Default)</span>
                                        )}
                                    </td>
                                    <td>
                                        <Badge 
                                          size='sm'
                                          variant={allocation.is_active ? 'success' : 'destructive'}>
                                            {allocation.is_active ? t('active_label') : t('inactive_label')}
                                        </Badge>
                                    </td>
                                    <td>
                                        <ActionButtons
                                            variant='rounded'
                                            skipDeleteConfirm={true}
                                            onEdit={() => handleEdit(allocation)}
                                            onDelete={() => confirmDelete(allocation.id)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </PerfectScrollbar>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredAndSortedAllocations.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}


<Dialog open={modalOpen} onOpenChange={setModalOpen}>
  <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[90vh] h-auto flex flex-col p-2
      !rounded-2xl shadow-xl overflow-hidden
      bg-background/40 dark:bg-dark backdrop-blur-xl [&>button]:hidden">

    {/* Inner container with ring and rounded corners */}
    <div className="flex flex-col h-full rounded-xl overflow-hidden
        bg-white dark:bg-gray-900
        ring-1 ring-white/40 dark:ring-gray-700/50 shadow-lg">
    {/* Header */}
    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
      <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
        <IconUserCheck className="text-primary w-7 h-7" />
      </div>
      <div>
        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
          {editingAllocation ? t('edit_leave_allocation_title') : t('assign_leave_policy_btn')}
        </DialogTitle>
        <p className="text-sm text-gray-500 mt-1">
          {editingAllocation
            ? t('update_allocation_detail_desc')
            : t('select_employees_configure_policy_desc')}
        </p>
      </div>
    </div>

    <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1 min-h-0">
      <form id="allocation-form" onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Employee Selection */}
          <div className="space-y-5">
            {!editingAllocation ? (
              <>
                {/* Build Roster Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    {t('build_roster_title')}
                  </h3>

                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800 space-y-4">
                    {/* Individual Search */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t('search_individuals_label')}
                      </Label>
                      <SearchableSelect
                        options={employees.map((emp: any) => ({ value: String(emp.id), label: emp.full_name }))}
                        value=""
                        onChange={(val) => handleEmployeeAdd(String(val))}
                        placeholder={t('search_add_individual_placeholder')}
                        searchPlaceholder={t('search_employee_name_placeholder')}
                      />
                    </div>

                    {/* Quick Add Departments & Branches */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t('quick_add_groups_label')}
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <SearchableSelect
                          options={departments.map((dept: any) => ({ value: String(dept.id), label: dept.name }))}
                          value=""
                          onChange={(val) => handleQuickAssign('dept', val)}
                           placeholder={t('add_department_placeholder')}
                        />
                        <SearchableSelect
                          options={branches.map((branch: any) => ({ value: String(branch.id), label: branch.name }))}
                          value=""
                          onChange={(val) => handleQuickAssign('branch', val)}
                           placeholder={t('add_branch_placeholder')}
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAssign('all')}
                           className="flex-1 border-primary/20 hover:bg-primary/5 text-primary"
                        >
                          {t('select_all_staff_btn')}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, employee_ids: [] }))}
                           className="w-24"
                        >
                          {t('clear_btn_label')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Employees */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('selected_employees_label')} <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {formData.employee_ids.length} {t('selected_label')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg min-h-[100px] max-h-[200px] overflow-y-auto bg-white dark:bg-black">
                    {formData.employee_ids.length === 0 ? (
                      <div className="w-full flex flex-col items-center justify-center text-sm text-gray-400 py-6">
                        <IconUsers className="w-8 h-8 opacity-20 mb-2" />
                        <p>{t('no_employees_selected_msg')}</p>
                      </div>
                    ) : (
                      formData.employee_ids.map((id: string) => {
                        const emp = employees.find((e: any) => String(e.id) === id);
                        return (
                          <div
                            key={id}
                            className="inline-flex items-center gap-2 bg-primary/10 text-primary pl-1 pr-2.5 py-1 rounded-md text-sm border border-primary/20"
                          >
                            <Avatar className="h-5 w-5 rounded-full">
                                <AvatarImage src={emp?.profile_image_url} alt={emp?.full_name} className="object-cover" />
                                <AvatarFallback className="rounded-full text-[8px] font-bold bg-primary text-white uppercase">
                                    {emp?.full_name?.charAt(0) || '?'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-[120px]">{emp ? emp.full_name : t('unknown_employee_label')}</span>
                            <button
                              type="button"
                              onClick={() => handleEmployeeRemove(id)}
                              className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 text-gray-500 rounded p-0.5 transition-colors"
                            >
                              <IconX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            ) : (
              // Single employee view when editing
              <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-100 dark:border-gray-800 h-full flex flex-col items-center justify-center text-center">
                <Avatar className="h-20 w-20 rounded-full border-4 border-white dark:border-gray-800 shadow-xl mb-4">
                    <AvatarImage src={employees.find((e: any) => String(e.id) === formData.employee_ids[0])?.profile_image_url} alt="profile" className="object-cover" />
                    <AvatarFallback className="rounded-full text-2xl font-black bg-primary/10 text-primary uppercase">
                        {employees.find((e: any) => String(e.id) === formData.employee_ids[0])?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{t('editing_single_allocation_title')}</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-xs">
                  {t('bulk_editing_not_supported_msg')}
                </p>
                <div className="mt-4 w-full">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('target_employee_label')}</Label>
                  <div className="mt-1 p-3 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-md font-medium shadow-sm">
                    {employees.find((e: any) => String(e.id) === formData.employee_ids[0])?.full_name || 'Loading...'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Policy Settings */}
          <div className="space-y-5">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              {t('policy_settings_title')}
            </h3>

            <div className="space-y-4 bg-white dark:bg-black p-5 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="space-y-1.5">
                <Label htmlFor="leave_policy_id" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('leave_policy_label')} <span className="text-red-500">*</span>
                </Label>
                <SearchableSelect
                  options={policies.map((policy: any) => ({ value: String(policy.id), label: policy.name }))}
                  value={formData.leave_policy_id}
                  onChange={(val) => handleSelectChange(String(val), 'leave_policy_id')}
                  placeholder={t('select_leave_policy_placeholder')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="effective_date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('effective_date_label')} <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    value={formData.effective_date}
                    onChange={(date) => handleDateChange(date, 'effective_date')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expiration_date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('expiration_label')} <span className="text-gray-400 font-normal">{t('optional_suffix')}</span>
                  </Label>
                  <DatePicker
                    value={formData.expiration_date}
                    onChange={(date) => handleDateChange(date, 'expiration_date')}
                     placeholder={t('no_expiration_placeholder')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="approved_by" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('specific_approver_label')} <span className="text-gray-400 font-normal">{t('optional_suffix')}</span>
                </Label>
                <SearchableSelect
                  options={employees.map((emp: any) => ({ value: String(emp.id), label: emp.full_name }))}
                  value={formData.approved_by}
                  onChange={(val) => handleSelectChange(String(val), 'approved_by')}
                  placeholder={t('select_manager_default_help')}
                  searchPlaceholder={t('search_approver_name_placeholder')}
                />
                <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1.5 px-1 font-medium">
                  <IconUserCheck className="w-3.5 h-3.5 text-primary/60" />
                  {editingAllocation ? (
                    <>
                      {t('default_fallback_to', 'Default fallback if left empty:')} {' '}
                      <span className="text-primary font-bold">
                        {editingAllocation.employee?.line_manager?.full_name || 'HR Administrator'}
                      </span>
                    </>
                  ) : (
                    t('bulk_fallback_notice', 'If left empty, each employee\'s respective Line Manager will be used.')
                  )}
                </p>
              </div>

              <div className="mt-4 p-4 border border-primary/20 bg-primary/5 rounded-md">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    name="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
                  />
                  <span className="text-sm mb-0 font-medium text-gray-700 dark:text-gray-300 select-none">
                    {t('allocation_is_active_label')}
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1.5 ml-6">
                  {t('inactive_allocation_help')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </PerfectScrollbar>

    {/* Sticky Footer */}
    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
      <Button
        type="button"
        variant="ghost"
        className="px-5"
        onClick={() => setModalOpen(false)}
      >
        {t('cancel_btn_label')}
      </Button>
      <Button
        type="submit"
        form="allocation-form"
        disabled={isSaving}
        className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
      >
        {isSaving ? t('saving_dots') : (editingAllocation ? t('save_changes_btn') : t('create_allocation_btn'))}
      </Button>
    </div>
        </div>

  </DialogContent>
</Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                 title={t('delete_leave_allocation_title')}
                 message={t('delete_leave_allocation_confirm')}
             />
        </div>
    );
};

export default LeaveAllocationIndex;
