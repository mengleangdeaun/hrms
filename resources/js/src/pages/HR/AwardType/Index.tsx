import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { 
    IconAward, 
    IconX, 
    IconDeviceFloppy, 
    IconLoader2, 
    IconSignature, 
    IconFileDescription, 
    IconSettings,
    IconInfoCircle
} from '@tabler/icons-react';
import HighlightText from '@/components/ui/HighlightText';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Switch } from '../../../components/ui/switch';
import { Label } from '../../../components/ui/label';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { Badge } from '../../../components/ui/badge';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

const AwardTypeIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [awardTypes, setAwardTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
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
        status: 'active',
        description: '',
    };
    const [formData, setFormData] = useState(initialFormState);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    useEffect(() => {
        dispatch(setPageTitle(t('award_types_title')));
    }, [dispatch, t]);

    const fetchAwardTypes = () => {
        setLoading(true);
        fetch('/api/hr/award-types', {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
            },
            credentials: 'include',
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAwardTypes(data);
                else setAwardTypes([]);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setAwardTypes([]);
                setLoading(false);
            });
    };

    useEffect(() => { fetchAwardTypes(); }, []);

    const handleCreate = () => {
        setEditingItem(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            status: item.status,
            description: item.description || '',
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
            const response = await fetch(`/api/hr/award-types/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
            });
            if (response.ok) {
                toast.success(t('award_type_deleted_msg'));
                fetchAwardTypes();
            } else {
                toast.error(t('failed_delete_award_type_msg'));
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectChange = (value: string, name: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const url = editingItem ? `/api/hr/award-types/${editingItem.id}` : '/api/hr/award-types';
        const method = editingItem ? 'PUT' : 'POST';

        try {
            await fetch('/sanctum/csrf-cookie');
            const response = await fetch(url, {
                method,
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
                toast.success(`${t('award_types_title')} ${editingItem ? t('update') : t('create')}`);
                setModalOpen(false);
                fetchAwardTypes();
            } else {
                toast.error(data.message || t('failed_save_award_type_msg'));
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSort = (column: string) => {
        if (sortBy === column) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortBy(column); setSortDirection('asc'); }
    };

    const filteredItem = useMemo(() => {
        if (!search) return awardTypes;
        const lowerSearch = search.toLowerCase();
        return awardTypes.filter(item =>
            item.name.toLowerCase().includes(lowerSearch) ||
            (item.description && item.description.toLowerCase().includes(lowerSearch))
        );
    }, [awardTypes, search]);

    const sortedItems = useMemo(() => {
        return [...filteredItem].sort((a, b) => {
            let aVal = a[sortBy]; let bVal = b[sortBy];
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredItem, sortBy, sortDirection]);

    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedItems.slice(start, start + itemsPerPage);
    }, [sortedItems, currentPage, itemsPerPage]);

    return (
        <div>
            <FilterBar
                icon={<IconAward className="w-6 h-6 text-primary" />}
                title={t('award_types_title')}
                description={t('award_types_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                onAdd={handleCreate}
                addLabel={t('award_types_add')}
                onRefresh={fetchAwardTypes}
            />

                    {loading ? (
                        <TableSkeleton columns={4} rows={5} />
                    ) : sortedItems.length === 0 ? (
                        <EmptyState
                            isSearch={!!search}
                            searchTerm={search}
                            onClearFilter={() => setSearch('')}
                            title={t('no_award_types_found_title')}
                            description={t('create_award_type_desc')}
                            actionLabel={t('award_types_add')}
                            onAction={handleCreate}
                        />
                    ) : (
            <div className="table-responsive bg-white dark:bg-black rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                        <table className="w-full table-hover text-left">
                            <thead className="border-b dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-4">#</th>
                                    <SortableHeader label={t('name_label')} value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th className="px-6 py-4">{t('status_label')}</th>
                                    <th className="px-6 py-4">{t('description_label')}</th>
                                    <th className="px-6 py-4 text-right">{t('actions_label')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {paginatedItems.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="text-start text-gray-400 text-xs font-medium">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            <HighlightText text={item.name} highlight={search} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge 
                                            size='sm'
                                            variant={item.status === 'active' ? 'success' : 'destructive'}>
                                                {item.status === 'active' ? t('active') : t('inactive')}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{item.description || '-'}</td>
                                        <td className="px-6 py-4">
                                            <ActionButtons skipDeleteConfirm={true} onEdit={() => handleEdit(item)} onDelete={() => confirmDelete(item.id)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    
                </div>
                {!loading && sortedItems.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(sortedItems.length / itemsPerPage)}
                        totalItems={sortedItems.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>
            )}

            {/* Award Type Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent
                    className="sm:max-w-[600px] w-[95vw] max-h-[90vh] h-auto flex flex-col p-2
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
                                    <IconAward size={24} />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                                        {editingItem ? t('edit_award_type_title') : t('create_award_type_title')}
                                    </DialogTitle>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                                        {editingItem ? t('update_award_type_detail_desc') : t('fill_award_type_detail_desc')}
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
                            <form id="award-type-form" onSubmit={handleSubmit} className="p-6 space-y-8">
                                
                                {/* Block 1: Award Identity */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <IconSignature size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('award_type_identity_title', 'Award Identity')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('award_type_name_label')} <span className="text-rose-500">*</span></Label>
                                            <Input
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="e.g. Employee of the Month"
                                                required
                                                className="h-11 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
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
                                                rows={4}
                                                placeholder={t('award_type_desc_placeholder')}
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
                                                <p className="text-xs text-slate-500">{t('award_type_status_desc', 'Determine if this award type is currently active.')}</p>
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
                                    form="award-type-form"
                                    disabled={isSaving}
                                    className="flex-1 sm:flex-none h-10 px-8 gap-2 font-black shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px]"
                                >
                                    {isSaving ? <IconLoader2 className="animate-spin" size={16} /> : <IconDeviceFloppy size={16} />}
                                    {isSaving ? t('saving_label') : (editingItem ? t('save_changes_btn_label') : t('create_award_type_btn'))}
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
                title={t('delete_award_type_title')}
                message={t('delete_award_type_confirm')}
            />
        </div>
    );
};

export default AwardTypeIndex;
