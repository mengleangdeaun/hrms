import { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Button } from '../../../components/ui/button';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import SearchableMultiSelect from '../../../components/ui/SearchableMultiSelect';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { 
    IconHierarchy, 
    IconX, 
    IconDeviceFloppy, 
    IconLoader2, 
    IconSignature, 
    IconBuilding, 
    IconFileDescription, 
    IconBrandTelegram, 
    IconSettings, 
    IconInfoCircle 
} from '@tabler/icons-react';
import HighlightText from '@/components/ui/HighlightText';
import { useTranslation } from 'react-i18next';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';

const DepartmentIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [departments, setDepartments] = useState<any[]>([]);

    useEffect(() => {
        dispatch(setPageTitle(t('dept_title')));
    }, [dispatch, t]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<any>(null);
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
        branch_ids: [] as string[],
        description: '',
        status: 'active',
        telegram_chat_id: '',
        telegram_topic_id: '',
    };

    const [formData, setFormData] = useState<{ name: string, branch_ids: string[], description: string, status: string, telegram_chat_id: string, telegram_topic_id: string }>(initialFormState);

    // Helper to get cookie
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchDepartments = () => {
        setLoading(true);
        fetch('/api/hr/departments', {
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
                    setDepartments(data);
                } else if (data && Array.isArray(data.data)) {
                    setDepartments(data.data);
                } else {
                    setDepartments([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setDepartments([]);
                setLoading(false);
            });
    };

    const fetchBranches = () => {
        fetch('/api/hr/branches', {
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
                    setBranches(data);
                }
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchDepartments();
        fetchBranches();
    }, []);

    const handleCreate = () => {
        setEditingDepartment(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (dept: any) => {
        setEditingDepartment(dept);
        setFormData({
            name: dept.name,
            branch_ids: dept.branches ? dept.branches.map((b: any) => String(b.id)) : [],
            description: dept.description || '',
            status: dept.status,
            telegram_chat_id: dept.telegram_chat_id || '',
            telegram_topic_id: dept.telegram_topic_id || '',
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
            const response = await fetch(`/api/hr/departments/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
            });

            if (response.ok) {
                toast.success(t('success_delete_dept'));
                fetchDepartments();
            } else {
                toast.error(t('failed_delete_dept'));
            }
        } catch (error) {
            console.error(error);
            toast.error(t('error_occurred'));
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSelectChange = (value: any, name: string) => {
        setFormData(prev => ({ ...prev, [name]: value } as typeof prev));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const url = editingDepartment ? `/api/hr/departments/${editingDepartment.id}` : '/api/hr/departments';
        const method = editingDepartment ? 'PUT' : 'POST';

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
                toast.success(editingDepartment ? t('success_update_dept') : t('success_create_dept'));
                setModalOpen(false);
                fetchDepartments();
            } else {
                if (response.status === 401) {
                    window.location.href = '/login';
                }
                toast.error(data.message || (editingDepartment ? t('failed_update_dept') : t('failed_create_dept')));
            }
        } catch (error) {
            console.error(error);
            toast.error(t('error_occurred'));
        } finally {
            setIsSaving(false);
        }
    };

    // Derived state for table
    const filteredAndSortedDepartments = useMemo(() => {
        let result = [...departments];

        // Search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(d =>
                d.name?.toLowerCase().includes(q) ||
                d.branches?.some((branch: any) => branch.name?.toLowerCase().includes(q))
            );
        }

        // Sort
        result.sort((a, b) => {
            let valA = sortBy === 'branch' ? (a.branches?.[0]?.name || '') : (a[sortBy] || '');
            let valB = sortBy === 'branch' ? (b.branches?.[0]?.name || '') : (b[sortBy] || '');
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [departments, search, sortBy, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedDepartments.length / itemsPerPage);
    const paginatedDepartments = filteredAndSortedDepartments.slice(
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
                icon={<IconHierarchy className="w-6 h-6 text-primary" />}
                title={t('dept_title')}
                description={t('dept_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={handleCreate}
                addLabel={t('add_dept')}
                onRefresh={fetchDepartments}
                hasActiveFilters={sortBy !== 'name' || sortDirection !== 'asc'}
                onClearFilters={() => {
                    setSortBy('name');
                    setSortDirection('asc');
                }}
            />

            {loading ? (
                <TableSkeleton columns={4} rows={5} />
            ) : departments.length === 0 ? (
                <EmptyState
                    title={t('no_depts_found')}
                    description={t('start_adding_dept_desc')}
                    actionLabel={t('add_dept')}
                    onAction={handleCreate}
                />
            ) : filteredAndSortedDepartments.length === 0 ? (
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
                    <div className="overflow-x-auto">
                    <table className="table-hover w-full table">
                        <thead className="border-b dark:border-gray-600" >
                            <tr>
                                <th>#</th>
                                <SortableHeader label={t('name_label')} value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('branch_label')} value="branch" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('status_label')} value="status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedDepartments.map((dept: any, index: number) => (
                                <tr key={dept.id}>
                                    <td className="text-start text-gray-400 text-xs font-medium">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="whitespace-nowrap font-medium">
                                        <HighlightText text={dept.name} highlight={search} />
                                    </td>
                                    <td>
                                        <div className="flex flex-wrap gap-1">
                                            {dept.branches && dept.branches.length > 0 ? (
                                                dept.branches.map((b: any) => (
                                                    <span key={`branch-${dept.id}-${b.id}`} className="text-xs text-gray-500 whitespace-nowrap">
                                                        <HighlightText text={b.name} highlight={search} />{dept.branches.length > 1 ? ',' : ''}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <Badge 
                                        dot={true}
                                        size='sm'
                                        variant={dept.status === 'active' ? 'success' : 'destructive'}>
                                            {dept.status === 'active' ? t('active') : t('inactive')}
                                        </Badge>
                                    </td>
                                    <td>
                                        <ActionButtons skipDeleteConfirm={true}
                                            onEdit={() => handleEdit(dept)}
                                            onDelete={() => confirmDelete(dept.id)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredAndSortedDepartments.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                </div>
            )}

            {/* Department Modal */}
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
                            bg-primary/5 dark:bg-primary/10 rounded-t-xl border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary/20 text-primary shadow-sm border border-primary/10">
                                    <IconHierarchy size={24} />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                                        {editingDepartment ? t('edit_dept_title') : t('create_dept_title')}
                                    </DialogTitle>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                                        {editingDepartment ? t('update_dept_detail_desc') : t('fill_dept_detail_desc')}
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
                            <form id="department-form" onSubmit={handleSubmit} className="p-6 space-y-8">
                                
                                {/* Block 1: Department Identity */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <IconSignature size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('department_identity_title', 'Department Identity')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('dept_name_label')} <span className="text-rose-500">*</span></Label>
                                            <Input
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder={t('dept_name_placeholder')}
                                                required
                                                className="h-11 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('branches_label')}</Label>
                                            <SearchableMultiSelect
                                                options={branches.map((b: any) => ({
                                                    value: String(b.id),
                                                    label: b.name
                                                }))}
                                                value={formData.branch_ids}
                                                onChange={(val) => handleSelectChange(val, 'branch_ids')}
                                                placeholder={t('select_branches_placeholder')}
                                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Block 2: Additional Details */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                            <IconFileDescription size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('additional_details_title')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('description_label')}</Label>
                                            <Textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                placeholder={t('dept_desc_placeholder')}
                                                rows={4}
                                                className="min-h-[120px] font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Block 3: Telegram Integration */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
                                            <IconBrandTelegram size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('telegram_notifications_title')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('telegram_chat_id_label')}</Label>
                                            <Input
                                                name="telegram_chat_id"
                                                value={formData.telegram_chat_id}
                                                onChange={handleChange}
                                                placeholder="e.g. -100123456789"
                                                className="h-11 font-mono text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('telegram_topic_id_label')}</Label>
                                            <Input
                                                name="telegram_topic_id"
                                                value={formData.telegram_topic_id}
                                                onChange={handleChange}
                                                placeholder="e.g. 123"
                                                className="h-11 font-mono text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Block 4: Settings */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                            <IconSettings size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('settings_title', 'Settings')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                        <div className="flex items-center justify-between p-2">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('status_label')}</Label>
                                                <p className="text-xs text-slate-500">{t('department_status_desc', 'Determine if this department is currently operational.')}</p>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${formData.status === 'active' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                    {formData.status === 'active' ? t('active') : t('inactive')}
                                                </span>
                                                <Switch
                                                    checked={formData.status === 'active'}
                                                    onCheckedChange={(checked) => handleSelectChange(checked ? 'active' : 'inactive', 'status')}
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
                                    form="department-form"
                                    disabled={isSaving}
                                    className="flex-1 sm:flex-none h-10 px-8 gap-2 font-black shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px]"
                                >
                                    {isSaving ? <IconLoader2 className="animate-spin" size={16} /> : <IconDeviceFloppy size={16} />}
                                    {isSaving ? t('saving_dots') : (editingDepartment ? t('save_changes_btn_label') : t('create_dept_btn_label'))}
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
                title={t('delete_dept_title')}
                message={t('delete_dept_message')}
            />
        </div>
    );
};

export default DepartmentIndex;
