import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { 
    IconShieldCheck,
    IconX,
    IconDeviceFloppy,
    IconLoader2,
    IconInfoCircle,
    IconSettings,
    IconClockStop,
    IconClockPlay,
    IconClockPlus,
    IconSignature,
    IconAlignLeft,
    IconCircleCheck,
    IconCircleX
} from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';

const AttendancePolicyIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const initialFormState = {
        name: '',
        late_tolerance_minutes: 0,
        early_departure_tolerance_minutes: 0,
        overtime_minimum_minutes: 0,
        description: '',
        status: 'active',
    };

    const [formData, setFormData] = useState(initialFormState);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    useEffect(() => {
        dispatch(setPageTitle(t('attendance_policies', 'Attendance Policies')));
    }, [dispatch, t]);

    const fetchPolicies = () => {
        setLoading(true);
        fetch('/api/attendance/attendance-policies', {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
            credentials: 'include',
        })
            .then(res => {
                if (res.status === 401) { window.location.href = '/login'; return null; }
                return res.json();
            })
            .then(data => {
                if (!data) return;
                if (Array.isArray(data)) setPolicies(data);
                else setPolicies([]);
                setLoading(false);
            })
            .catch(err => { console.error(err); setPolicies([]); setLoading(false); });
    };

    useEffect(() => { fetchPolicies(); }, []);

    const handleCreate = () => { setEditingPolicy(null); setFormData(initialFormState); setModalOpen(true); };

    const handleEdit = (policy: any) => {
        setEditingPolicy(policy);
        setFormData({
            name: policy.name,
            late_tolerance_minutes: policy.late_tolerance_minutes || 0,
            early_departure_tolerance_minutes: policy.early_departure_tolerance_minutes || 0,
            overtime_minimum_minutes: policy.overtime_minimum_minutes || 0,
            description: policy.description || '',
            status: policy.status,
        });
        setModalOpen(true);
    };

    const confirmDelete = (id: number) => { setItemToDelete(id); setDeleteModalOpen(true); };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/attendance/attendance-policies/${itemToDelete}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
            });
            if (response.ok) { toast.success('Policy deleted successfully'); fetchPolicies(); }
            else toast.error('Failed to delete policy');
        } catch (error) { toast.error('An error occurred'); }
        finally { setIsDeleting(false); setDeleteModalOpen(false); setItemToDelete(null); }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value }));
    };

    const handleSelectChange = (value: string, name: string) => setFormData(prev => ({ ...prev, [name]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const url = editingPolicy ? `/api/attendance/attendance-policies/${editingPolicy.id}` : '/api/attendance/attendance-policies';
        const method = editingPolicy ? 'PUT' : 'POST';
        try {
            await fetch('/sanctum/csrf-cookie');
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(`Policy ${editingPolicy ? 'updated' : 'created'} successfully`);
                setModalOpen(false);
                fetchPolicies();
            } else {
                if (response.status === 401) window.location.href = '/login';
                const msg = data.errors ? Object.values(data.errors).flat().join(', ') : data.message || 'Failed to save policy';
                toast.error(msg);
            }
        } catch (error) { toast.error('An error occurred while saving'); }
        finally { setIsSaving(false); }
    };

    const handleSort = (column: string) => {
        if (sortBy === column) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        else { setSortBy(column); setSortDirection('asc'); }
    };

    const filteredPolicies = useMemo(() => {
        if (!search) return policies;
        const lowerSearch = search.toLowerCase();
        return policies.filter(policy =>
            policy.name.toLowerCase().includes(lowerSearch) ||
            (policy.description && policy.description.toLowerCase().includes(lowerSearch))
        );
    }, [policies, search]);

    const sortedPolicies = useMemo(() => {
        return [...filteredPolicies].sort((a, b) => {
            let aVal = a[sortBy]; let bVal = b[sortBy];
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredPolicies, sortBy, sortDirection]);

    const paginatedPolicies = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedPolicies.slice(start, start + itemsPerPage);
    }, [sortedPolicies, currentPage, itemsPerPage]);

    return (
        <div>
            <FilterBar
                icon={<IconShieldCheck className="w-6 h-6 text-primary" />}
                title="Attendance Policies"
                description="Configure complex rules like grace periods and overtime"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val: number) => { setItemsPerPage(val); setCurrentPage(1); }}
                onAdd={handleCreate}
                addLabel="Add New Policy"
                onRefresh={fetchPolicies}
            />

                    {loading ? (
                        <TableSkeleton columns={6} rows={5} />
                    ) : sortedPolicies.length === 0 ? (
                        <EmptyState
                            isSearch={!!search}
                            searchTerm={search}
                            onClearFilter={() => setSearch('')}
                            title="No attendance policies yet"
                            description="Create your first attendance policy to get started."
                            actionLabel="Add New Policy"
                            onAction={handleCreate}
                        />
                    ) : (
            <div className="table-responsive bg-white dark:bg-black rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                        <table className="w-full table-hover text-left">
                            <thead className="border-b dark:border-gray-600">
                                <tr>
                                    <th>#</th>
                                    <SortableHeader label="Name" value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th className="px-6 py-4 font-medium text-center">Late Tolerance</th>
                                    <th className="px-6 py-4 font-medium text-center">Early Departure Tolerance</th>
                                    <th className="px-6 py-4 font-medium text-center">Min. Overtime</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {paginatedPolicies.map((policy: any, index: number) => (
                                    <tr key={policy.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="text-start text-gray-400 text-xs font-medium">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="py-4 font-medium text-gray-900 dark:text-white">{policy.name}</td>
                                        <td className="px-6 py-4 text-center">
                                            {policy.late_tolerance_minutes > 0 ? (
                                                <span className="text-orange-600 dark:text-orange-400 font-medium">{policy.late_tolerance_minutes} mins</span>
                                            ) : <span className="text-gray-400">0</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {policy.early_departure_tolerance_minutes > 0 ? (
                                                <span className="text-blue-600 dark:text-blue-400 font-medium">{policy.early_departure_tolerance_minutes} mins</span>
                                            ) : <span className="text-gray-400">0</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {policy.overtime_minimum_minutes > 0 ? (
                                                <span className="text-purple-600 dark:text-purple-400 font-medium">{policy.overtime_minimum_minutes} mins</span>
                                            ) : <span className="text-gray-400">0</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge 
                                              size='sm'
                                              variant={policy.status === 'active' ? 'success' : 'destructive'}>
                                                {policy.status === 'active' ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <ActionButtons skipDeleteConfirm={true} size="sm" onEdit={() => handleEdit(policy)} onDelete={() => confirmDelete(policy.id)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                   
                </div>

                {!loading && sortedPolicies.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(sortedPolicies.length / itemsPerPage)}
                        totalItems={sortedPolicies.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>
             )}

            {/* Attendance Policy Modal */}
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
                                    <IconShieldCheck size={24} />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                                        {editingPolicy ? t('edit_attendance_policy', 'Edit Attendance Policy') : t('create_attendance_policy', 'Create Attendance Policy')}
                                    </DialogTitle>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                                        {editingPolicy ? t('update_policy_details_desc', 'Update the details for this policy.') : t('configure_policy_desc', 'Configure grace periods and overtime rules.')}
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
                            <form id="policy-form" onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                <div className="space-y-6">
                                    {/* Block 1: Basic Identity */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                <IconSignature size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('policy_identity', 'Policy Identity')}</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-5">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('policy_name', 'Policy Name')} <span className="text-rose-500">*</span></Label>
                                                <Input
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder={t('e_g_standard_policy', 'e.g. Standard Policy')}
                                                    className="h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('status', 'Status')}</Label>
                                                <Select onValueChange={(val) => handleSelectChange(val, 'status')} value={formData.status}>
                                                    <SelectTrigger className="h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                        <SelectValue placeholder={t('select_status', 'Select Status')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active" className="font-bold">
                                                            <div className="flex items-center gap-2">
                                                                <IconCircleCheck size={16} className="text-success" />
                                                                <span>{t('active', 'Active')}</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="inactive" className="font-bold">
                                                            <div className="flex items-center gap-2">
                                                                <IconCircleX size={16} className="text-destructive" />
                                                                <span>{t('inactive', 'Inactive')}</span>
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Block 2: Additional Config */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                                <IconAlignLeft size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('description', 'Description')}</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-5">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('description', 'Description')}</Label>
                                                <Textarea
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleChange}
                                                    placeholder={t('policy_desc_placeholder', 'Details about this policy...')}
                                                    className="min-h-[100px] font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none pt-3"
                                                />
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div className="space-y-6">
                                    {/* Block 3: Tolerance Rules */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                                <IconSettings size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('tolerance_rules', 'Tolerance Rules')}</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-5">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('late_tolerance_minutes', 'Late Tolerance (Minutes)')}</Label>
                                                <div className="relative">
                                                    <IconClockStop size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        name="late_tolerance_minutes"
                                                        value={formData.late_tolerance_minutes}
                                                        onChange={handleChange}
                                                        className="pl-11 h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                    />
                                                </div>
                                                <p className="text-[9px] text-slate-500 font-medium px-1 italic">{t('late_grace_period_desc', 'Grace period before being marked late.')}</p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('early_departure_minutes', 'Early Departure (Minutes)')}</Label>
                                                <div className="relative">
                                                    <IconClockPlay size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        name="early_departure_tolerance_minutes"
                                                        value={formData.early_departure_tolerance_minutes}
                                                        onChange={handleChange}
                                                        className="pl-11 h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                    />
                                                </div>
                                                <p className="text-[9px] text-slate-500 font-medium px-1 italic">{t('early_departure_desc', 'Permitted early leave time.')}</p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('min_overtime_minutes', 'Minimum Overtime (Minutes)')}</Label>
                                                <div className="relative">
                                                    <IconClockPlus size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        name="overtime_minimum_minutes"
                                                        value={formData.overtime_minimum_minutes}
                                                        onChange={handleChange}
                                                        className="pl-11 h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                    />
                                                </div>
                                                <p className="text-[9px] text-slate-500 font-medium px-1 italic">{t('min_overtime_desc', 'Threshold for overtime recognition.')}</p>
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
                                    {t('cancel', 'Cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    form="policy-form"
                                    disabled={isSaving}
                                    className="flex-1 sm:flex-none h-10 px-8 gap-2 font-black shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px]"
                                >
                                    {isSaving ? <IconLoader2 className="animate-spin" size={16} /> : <IconDeviceFloppy size={16} />}
                                    {isSaving ? t('processing', 'Processing...') : t('save_policy', 'Save Policy')}
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
                title="Delete Attendance Policy"
                message="Are you sure you want to delete this policy? This action cannot be undone."
            />
        </div>
    );
};

export default AttendancePolicyIndex;
