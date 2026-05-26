import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import PerfectScrollbar from 'react-perfect-scrollbar';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import SearchableMultiSelect from '../../../components/ui/SearchableMultiSelect';
import { Badge } from '../../../components/ui/badge';
import { 
    IconBadge, 
    IconX, 
    IconDeviceFloppy, 
    IconLoader2, 
    IconSignature, 
    IconHierarchy, 
    IconFileDescription, 
    IconSettings, 
    IconInfoCircle 
} from '@tabler/icons-react';
import HighlightText from '@/components/ui/HighlightText';
import { useTranslation } from 'react-i18next';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';

const DesignationIndex = () => {
    const { t } = useTranslation();
    const [designations, setDesignations] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDesignation, setEditingDesignation] = useState<any>(null);
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
        department_ids: [] as string[],
        description: '',
        status: 'active',
    };

    const [formData, setFormData] = useState<{ name: string, department_ids: string[], description: string, status: string }>(initialFormState);

    // Helper to get cookie
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchDesignations = () => {
        setLoading(true);
        fetch('/api/hr/designations', {
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
                    setDesignations(data);
                } else {
                    setDesignations([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setDesignations([]);
                setLoading(false);
            });
    };

    const fetchDepartments = () => {
        fetch('/api/hr/departments', {
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
                    setDepartments(data);
                }
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchDesignations();
        fetchDepartments();
    }, []);

    const handleCreate = () => {
        setEditingDesignation(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (desig: any) => {
        setEditingDesignation(desig);
        setFormData({
            name: desig.name,
            department_ids: desig.departments ? desig.departments.map((d: any) => String(d.id)) : [],
            description: desig.description || '',
            status: desig.status,
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
            const response = await fetch(`/api/hr/designations/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
            });

            if (response.ok) {
                toast.success(t('success_delete_desig'));
                fetchDesignations();
            } else {
                toast.error(t('failed_delete_desig'));
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

        const url = editingDesignation ? `/api/hr/designations/${editingDesignation.id}` : '/api/hr/designations';
        const method = editingDesignation ? 'PUT' : 'POST';

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
                toast.success(editingDesignation ? t('success_update_desig') : t('success_create_desig'));
                setModalOpen(false);
                fetchDesignations();
            } else {
                if (response.status === 401) {
                    window.location.href = '/login';
                }
                toast.error(data.message || (editingDesignation ? t('failed_update_desig') : t('failed_create_desig')));
            }
        } catch (error) {
            console.error(error);
            toast.error(t('error_occurred'));
        } finally {
            setIsSaving(false);
        }
    };

    // Derived state for table
    const filteredAndSortedDesignations = useMemo(() => {
        let result = [...designations];

        // Search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(d =>
                d.name?.toLowerCase().includes(q) ||
                d.departments?.some((dept: any) =>
                    dept.name?.toLowerCase().includes(q) ||
                    dept.branches?.some((branch: any) => branch.name?.toLowerCase().includes(q))
                )
            );
        }

        // Sort
        result.sort((a, b) => {
            let valA = '';
            let valB = '';

            if (sortBy === 'department') {
                valA = a.departments?.[0]?.name || '';
                valB = b.departments?.[0]?.name || '';
            } else if (sortBy === 'branch') {
                valA = a.departments?.[0]?.branches?.[0]?.name || '';
                valB = b.departments?.[0]?.branches?.[0]?.name || '';
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
    }, [designations, search, sortBy, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedDesignations.length / itemsPerPage);
    const paginatedDesignations = filteredAndSortedDesignations.slice(
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
                icon={<IconBadge className="w-6 h-6 text-primary" />}
                title={t('desig_title')}
                description={t('desig_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={handleCreate}
                addLabel={t('add_desig')}
                onRefresh={fetchDesignations}
                hasActiveFilters={sortBy !== 'name' || sortDirection !== 'asc'}
                onClearFilters={() => {
                    setSortBy('name');
                    setSortDirection('asc');
                }}
            />

            {loading ? (
                <TableSkeleton columns={5} rows={5} />
            ) : designations.length === 0 ? (
                <EmptyState
                    title={t('no_desigs_found')}
                    description={t('start_adding_desig_desc')}
                    actionLabel={t('add_desig')}
                    onAction={handleCreate}
                />
            ) : filteredAndSortedDesignations.length === 0 ? (
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
                                <SortableHeader label={t('department_label')} value="department" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('branch_label')} value="branch" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('status_label')} value="status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedDesignations.map((desig: any, index: number) => (
                                <tr key={desig.id}>
                                    <td className="text-start text-gray-400 text-xs font-medium">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="whitespace-nowrap font-medium">
                                        <HighlightText text={desig.name} highlight={search} />
                                    </td>
                                    <td>
                                        <div className="flex flex-wrap gap-1">
                                            {desig.departments && desig.departments.length > 0 ? (
                                                desig.departments.map((dept: any) => (
                                                    <span key={dept.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary whitespace-nowrap">
                                                        <HighlightText text={dept.name} highlight={search} />
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-400 italic text-sm">{t('no_depts_italics')}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-wrap gap-1">
                                            {desig.departments && desig.departments.length > 0 ? (
                                                desig.departments.map((dept: any) => (
                                                    <span key={`branch-${dept.id}`} className="text-xs text-gray-500 whitespace-nowrap">
                                                        <HighlightText text={dept.branches?.map((b: any) => b.name).join(', ')} highlight={search} />{desig.departments.length > 1 ? ' | ' : ''}
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
                                        variant={desig.status === 'active' ? 'success' : 'destructive'}>
                                            {desig.status === 'active' ? t('active') : t('inactive')}
                                        </Badge>
                                    </td>
                                    <td>
                                        <ActionButtons skipDeleteConfirm={true}
                                            onEdit={() => handleEdit(desig)}
                                            onDelete={() => confirmDelete(desig.id)}
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
                            totalItems={filteredAndSortedDesignations.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                </div>
            )}

            {/* Designation Modal */}
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
                                    <IconBadge size={24} />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                                        {editingDesignation ? t('edit_desig_title') : t('create_desig_title')}
                                    </DialogTitle>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                                        {editingDesignation ? t('update_desig_detail_desc') : t('fill_desig_detail_desc')}
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
                            <form id="designation-form" onSubmit={handleSubmit} className="p-6 space-y-8">
                                
                                {/* Block 1: Designation Identity */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <IconSignature size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('designation_identity_title', 'Designation Identity')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('desig_name_label')} <span className="text-rose-500">*</span></Label>
                                            <Input
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder={t('desig_name_placeholder')}
                                                required
                                                className="h-11 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('departments_label')}</Label>
                                            <SearchableMultiSelect
                                                options={departments.map((dept: any) => ({
                                                    value: String(dept.id),
                                                    label: dept.name
                                                }))}
                                                value={formData.department_ids}
                                                onChange={(val) => handleSelectChange(val, 'department_ids')}
                                                placeholder={t('select_depts_placeholder')}
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
                                                placeholder={t('desig_desc_placeholder')}
                                                rows={4}
                                                className="min-h-[120px] font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Block 3: Settings */}
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
                                                <p className="text-xs text-slate-500">{t('designation_status_desc', 'Determine if this designation is currently active in the organization.')}</p>
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
                                    form="designation-form"
                                    disabled={isSaving}
                                    className="flex-1 sm:flex-none h-10 px-8 gap-2 font-black shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px]"
                                >
                                    {isSaving ? <IconLoader2 className="animate-spin" size={16} /> : <IconDeviceFloppy size={16} />}
                                    {isSaving ? t('saving_dots') : (editingDesignation ? t('save_changes_btn_label') : t('create_desig_btn_label'))}
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
                title={t('delete_desig_title')}
                message={t('delete_desig_message')}
            />
        </div>
    );
};

export default DesignationIndex;
