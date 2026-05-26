import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Label } from '../../../components/ui/label';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Checkbox } from '../../../components/ui/checkbox';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { 
    IconClipboardHeart, 
    IconX, 
    IconDeviceFloppy, 
    IconLoader2, 
    IconInfoCircle, 
    IconSettings, 
    IconSignature, 
    IconAlignLeft, 
    IconCalendarStats, 
    IconRefresh,
    IconClockEdit,
    IconChecklist,
    IconPower,
    IconTrendingUp,
    IconArrowsMoveHorizontal
} from '@tabler/icons-react';
import { Switch } from '../../../components/ui/switch';
import HighlightText from '@/components/ui/HighlightText';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

const LeavePolicyIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [leavePolicies, setLeavePolicies] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingLeavePolicy, setEditingLeavePolicy] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Filter & Sort & Pagination state
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const initialFormState = {
        name: '',
        description: '',
        leave_type_id: '',
        accrual_type: 'yearly',
        accrual_rate: 0,
        carry_forward_limit: 0,
        min_days_per_app: 1,
        max_days_per_app: 0,
        allow_half_day: false,
        allow_hourly: false,
        require_approval: true,
        status: true,
    };

    const [formData, setFormData] = useState(initialFormState);

    // Helper to get cookie
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    useEffect(() => {
        dispatch(setPageTitle(t('leave_policies_title')));
    }, [t, dispatch]);

    const fetchLeavePolicies = () => {
        setLoading(true);
        fetch('/api/hr/leave-policies', {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
            },
            credentials: 'include',
        })
            .then(res => {
                if (res.status === 401) {
                    window.location.href = 'auth/login';
                    return null;
                }
                return res.json();
            })
            .then(data => {
                if (!data) return;
                if (Array.isArray(data)) {
                    setLeavePolicies(data);
                } else {
                    setLeavePolicies([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLeavePolicies([]);
                setLoading(false);
            });
    };

    const fetchLeaveTypes = () => {
        fetch('/api/hr/leave-types', {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
            },
            credentials: 'include',
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setLeaveTypes(data);
                }
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchLeavePolicies();
        fetchLeaveTypes();
    }, []);

    const handleCreate = () => {
        setEditingLeavePolicy(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (policy: any) => {
        setEditingLeavePolicy(policy);
        setFormData({
            name: policy.name,
            description: policy.description || '',
            leave_type_id: String(policy.leave_type_id),
            accrual_type: policy.accrual_type,
            accrual_rate: policy.accrual_rate,
            carry_forward_limit: policy.carry_forward_limit,
            min_days_per_app: policy.min_days_per_app,
            max_days_per_app: policy.max_days_per_app,
            allow_half_day: policy.allow_half_day == 1 || policy.allow_half_day === true,
            allow_hourly: policy.allow_hourly == 1 || policy.allow_hourly === true,
            require_approval: policy.require_approval == 1 || policy.require_approval === true,
            status: policy.status == 1 || policy.status === true,
        });
        setModalOpen(true);
    };

    const confirmDelete = (id: number) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);

        try {
            const response = await fetch(`/api/hr/leave-policies/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
            });

            if (response.ok) {
                toast.success(t('doc_deleted'));
                fetchLeavePolicies();
            } else {
                toast.error(t('failed_delete_msg'));
            }
        } catch (error) {
            console.error(error);
            toast.error(t('error_label'));
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        let val: any = value;
        if (type === 'checkbox') {
            val = (e.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            val = parseFloat(value) || 0;
        }

        setFormData(prev => ({ ...prev, [name]: val } as typeof prev));
    };

    const handleSelectChange = (value: string, name: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const url = editingLeavePolicy ? `/api/hr/leave-policies/${editingLeavePolicy.id}` : '/api/hr/leave-policies';
        const method = editingLeavePolicy ? 'PUT' : 'POST';

        try {
            // Ensure CSRF cookie is set
            await fetch('/sanctum/csrf-cookie');

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(t('doc_updated'));
                setModalOpen(false);
                fetchLeavePolicies();
            } else {
                if (response.status === 401) {
                    window.location.href = '/login';
                }
                toast.error(data.message || `Failed to ${editingLeavePolicy ? 'update' : 'create'} leave policy`);

                // Show validation errors if present
                if (data.errors) {
                    Object.values(data.errors).forEach((errArray: any) => {
                        toast.error(errArray[0]);
                    });
                }
            }
        } catch (error) {
            console.error(error);
            toast.error(t('error_label'));
        } finally {
            setIsSaving(false);
        }
    };

    // Derived state for table
    const filteredAndSortedLeavePolicies = useMemo(() => {
        let result = [...leavePolicies];

        // Search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(policy =>
                policy.name?.toLowerCase().includes(q) ||
                policy.leave_type?.name?.toLowerCase().includes(q)
            );
        }

        // Sort
        result.sort((a, b) => {
            let valA = sortBy === 'leave_type' ? (a.leave_type?.name || '') : (a[sortBy] || '');
            let valB = sortBy === 'leave_type' ? (b.leave_type?.name || '') : (b[sortBy] || '');
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [leavePolicies, search, sortBy, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedLeavePolicies.length / itemsPerPage);
    const paginatedLeavePolicies = filteredAndSortedLeavePolicies.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page if search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    return (
        <div>
            <FilterBar
                icon={<IconClipboardHeart className="w-6 h-6 text-primary" />}
                title={t('leave_policies_title')}
                description={t('leave_policies_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={handleCreate}
                addLabel={t('add_policy_btn')}
                onRefresh={fetchLeavePolicies}
                hasActiveFilters={sortBy !== 'name' || sortDirection !== 'asc'}
                onClearFilters={() => {
                    setSortBy('name');
                    setSortDirection('asc');
                }}
            />

            {loading ? (
                <TableSkeleton columns={7} rows={5} />
            ) : leavePolicies.length === 0 ? (
                <EmptyState
                    title={t('no_leave_policies_found_title')}
                    description={t('create_first_leave_policy_desc')}
                    actionLabel={t('add_leave_policy_btn')}
                    onAction={handleCreate}
                />
            ) : filteredAndSortedLeavePolicies.length === 0 ? (
                <EmptyState
                    isSearch
                    searchTerm={search}
                    onClearFilter={() => {
                        setSearch('');
                        setSortBy('name');
                        setSortDirection('asc');
                    }}
                />
            ) : (
                <div className="table-responsive bg-white dark:bg-black rounded-lg border overflow-hidden">
                    <PerfectScrollbar className="table-responsive">
                    <table className="table-hover w-full table">
                        <thead className='border-b dark:border-gray-600'>
                            <tr>
                                <th>#</th>
                                <SortableHeader label={t('policy_name_label')} value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('leave_type_label')} value="leave_type" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('accrual_label')} value="accrual_type" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('rate_label')} value="accrual_rate" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('limit_label')} value="max_days_per_app" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('status_label')} value="status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">{t('actions_label')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLeavePolicies.map((policy: any, index: number) => (
                                <tr key={policy.id}>
                                    <td className="text-start text-gray-400 text-xs font-medium">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="whitespace-nowrap font-medium">
                                        <HighlightText text={policy.name} highlight={search} />
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            {policy.leave_type && (
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: policy.leave_type?.color || '#000000' }}></div>
                                            )}
                                            <HighlightText text={policy.leave_type?.name || 'N/A'} highlight={search} />
                                        </div>
                                    </td>
                                     <td className="capitalize">{t(policy.accrual_type + '_label')}</td>
                                    <td>{parseFloat(policy.accrual_rate)} {t('days')}</td>
                                    <td>{policy.max_days_per_app > 0 ? `${policy.max_days_per_app} ${t('max')}` : t('no_limit_label')}</td>
                                    <td>
                                         <Badge 
                                          size='sm'
                                          variant={policy.status ? 'success' : 'destructive'}>
                                            {policy.status ? t('active_label') : t('inactive_label')}
                                        </Badge>
                                    </td>
                                    <td>
                                        <ActionButtons
                                            variant="inline"
                                            size="sm"
                                            skipDeleteConfirm={true}
                                            onEdit={() => handleEdit(policy)}
                                            onDelete={() => confirmDelete(policy.id)}
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
                            totalItems={filteredAndSortedLeavePolicies.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}


            {/* Leave Policy Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent
                    className="sm:max-w-[850px] w-[95vw] max-h-[90vh] h-auto flex flex-col p-2
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
                                    <IconClipboardHeart size={24} />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                                        {editingLeavePolicy ? t('edit_leave_policy_title') : t('create_new_leave_policy_title')}
                                    </DialogTitle>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                                        {editingLeavePolicy ? t('update_leave_policy_detail_desc') : t('fill_leave_policy_detail_desc')}
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
                            <form id="leave-policy-form" onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                
                                <div className="space-y-8">
                                    {/* Block 1: Policy Identity */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                <IconSignature size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('basic_information_title', 'Policy Identity')}</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-5">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('policy_name_label')} <span className="text-rose-500">*</span></Label>
                                                <Input
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder={t('standard_annual_leave_placeholder')}
                                                    className="h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
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
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('description_label')}</Label>
                                                <div className="relative">
                                                    <IconAlignLeft size={18} className="absolute left-4 top-3 text-slate-400" />
                                                    <Textarea
                                                        name="description"
                                                        value={formData.description}
                                                        onChange={handleChange}
                                                        placeholder={t('policy_details_conditions_placeholder')}
                                                        className="min-h-[80px] pl-11 pt-3 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Block 2: Usage Constraints */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                                <IconClockEdit size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('application_limits_title', 'Usage Constraints')}</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-5">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('min_days_per_app_label')}</Label>
                                                    <Input
                                                        name="min_days_per_app"
                                                        type="number"
                                                        step="0.1"
                                                        value={formData.min_days_per_app}
                                                        onChange={handleChange}
                                                        min="0"
                                                        placeholder="e.g. 0.5"
                                                        className="h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('max_days_per_app_label')}</Label>
                                                    <Input
                                                        name="max_days_per_app"
                                                        type="number"
                                                        value={formData.max_days_per_app}
                                                        onChange={handleChange}
                                                        min="0"
                                                        placeholder="e.g. 10"
                                                        className="h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[9px] text-slate-500 font-medium px-1 italic">{t('zero_means_unlimited_help')}</p>
                                        </div>
                                    </section>
                                </div>

                                <div className="space-y-8">
                                    {/* Block 3: Accrual Configuration */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                                <IconTrendingUp size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('accrual_settings_title', 'Accrual Config')}</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-5">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('accrual_type_label')}</Label>
                                                <Select onValueChange={(v) => handleSelectChange(v, 'accrual_type')} value={formData.accrual_type}>
                                                    <SelectTrigger className="h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                        <SelectValue placeholder={t('select_type_placeholder')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="fixed" className="font-bold">{t('fixed_label')}</SelectItem>
                                                        <SelectItem value="monthly" className="font-bold">{t('monthly_label')}</SelectItem>
                                                        <SelectItem value="yearly" className="font-bold">{t('yearly_label')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('accrual_rate_days_label')} <span className="text-rose-500">*</span></Label>
                                                    <div className="relative">
                                                        <IconRefresh size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <Input
                                                            name="accrual_rate"
                                                            type="number"
                                                            step="0.01"
                                                            value={formData.accrual_rate}
                                                            onChange={handleChange}
                                                            required
                                                            min="0"
                                                            className="pl-11 h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('carry_forward_limit_label')}</Label>
                                                    <div className="relative">
                                                        <IconArrowsMoveHorizontal size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <Input
                                                            name="carry_forward_limit"
                                                            type="number"
                                                            value={formData.carry_forward_limit}
                                                            onChange={handleChange}
                                                            min="0"
                                                            className="pl-11 h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Block 4: Advanced Controls */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                                <IconSettings size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('additional_options_title', 'Advanced Controls')}</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 grid grid-cols-1 gap-4">
                                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/50">
                                                <div className="space-y-0.5">
                                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('requires_approval_label')}</Label>
                                                    <p className="text-[10px] text-slate-500 font-medium">{t('approval_needed_desc', 'Requires manager authorization')}</p>
                                                </div>
                                                <Switch
                                                    checked={formData.require_approval}
                                                    onCheckedChange={(v) => setFormData(p => ({ ...p, require_approval: v } as typeof p))}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/50">
                                                <div className="space-y-0.5">
                                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('allow_half_day_label', 'Allow Half Day')}</Label>
                                                    <p className="text-[10px] text-slate-500 font-medium">{t('half_day_desc', 'Permit 0.5 day leave increments')}</p>
                                                </div>
                                                <Switch
                                                    checked={formData.allow_half_day}
                                                    onCheckedChange={(v) => setFormData(p => ({ ...p, allow_half_day: v } as typeof p))}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/50">
                                                <div className="space-y-0.5">
                                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('allow_hourly_label', 'Allow Hourly / Custom')}</Label>
                                                    <p className="text-[10px] text-slate-500 font-medium">{t('hourly_desc', 'Permit custom hour-based leave')}</p>
                                                </div>
                                                <Switch
                                                    checked={formData.allow_hourly}
                                                    onCheckedChange={(v) => setFormData(p => ({ ...p, allow_hourly: v } as typeof p))}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('status_active_label', 'Policy Status')}</Label>
                                                    <p className="text-[10px] text-slate-500 font-medium">{t('status_desc', 'Enable or disable this policy')}</p>
                                                </div>
                                                <Switch
                                                    checked={formData.status}
                                                    onCheckedChange={(v) => setFormData(p => ({ ...p, status: v } as typeof p))}
                                                />
                                            </div>
                                        </div>
                                    </section>
                                </div>
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
                                    form="leave-policy-form"
                                    disabled={isSaving}
                                    className="flex-1 sm:flex-none h-10 px-8 gap-2 font-black shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px]"
                                >
                                    {isSaving ? <IconLoader2 className="animate-spin" size={16} /> : <IconDeviceFloppy size={16} />}
                                    {isSaving ? t('saving_dots') : (editingLeavePolicy ? t('save_changes_btn') : t('create_policy_btn'))}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                 onConfirm={executeDelete}
                isLoading={isDeleting}
                title={t('delete_leave_policy_title')}
                message={t('delete_leave_policy_confirm')}
            />

        </div>
    );
};

export default LeavePolicyIndex;
