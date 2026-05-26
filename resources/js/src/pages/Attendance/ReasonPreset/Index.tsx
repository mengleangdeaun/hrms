import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
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
    IconNotes,
    IconX,
    IconDeviceFloppy,
    IconLoader2,
    IconInfoCircle,
    IconSettings,
    IconCircleCheck,
    IconCircleX,
    IconSortAscending,
    IconCategory
} from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';

const ReasonPresetIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [presets, setPresets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPreset, setEditingPreset] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('sort_order');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const initialFormState = {
        reason_text: '',
        type: 'both',
        is_active: true,
        sort_order: 0,
    };

    const [formData, setFormData] = useState(initialFormState);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    useEffect(() => {
        dispatch(setPageTitle(t('reason_presets', 'Attendance Reason Presets')));
    }, [dispatch, t]);

    const fetchPresets = () => {
        setLoading(true);
        fetch('/api/attendance/reason-presets', {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
            credentials: 'include',
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setPresets(data);
                else setPresets([]);
                setLoading(false);
            })
            .catch(err => { console.error(err); setPresets([]); setLoading(false); });
    };

    useEffect(() => { fetchPresets(); }, []);

    const handleCreate = () => { setEditingPreset(null); setFormData(initialFormState); setModalOpen(true); };

    const handleEdit = (preset: any) => {
        setEditingPreset(preset);
        setFormData({
            reason_text: preset.reason_text,
            type: preset.type,
            is_active: preset.is_active,
            sort_order: preset.sort_order || 0,
        });
        setModalOpen(true);
    };

    const confirmDelete = (id: number) => { setItemToDelete(id); setDeleteModalOpen(true); };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/attendance/reason-presets/${itemToDelete}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
            });
            if (response.ok) { toast.success('Preset deleted successfully'); fetchPresets(); }
            else toast.error('Failed to delete preset');
        } catch (error) { toast.error('An error occurred'); }
        finally { setIsDeleting(false); setDeleteModalOpen(false); setItemToDelete(null); }
    };

    const toggleStatus = async (preset: any) => {
        try {
            const response = await fetch(`/api/attendance/reason-presets/${preset.id}/toggle-active`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
            });
            if (response.ok) {
                toast.success('Status updated');
                fetchPresets();
            }
        } catch (error) { toast.error('Failed to update status'); }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    };

    const handleSelectChange = (value: string, name: string) => setFormData(prev => ({ ...prev, [name]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const url = editingPreset ? `/api/attendance/reason-presets/${editingPreset.id}` : '/api/attendance/reason-presets';
        const method = editingPreset ? 'PUT' : 'POST';
        try {
            await fetch('/sanctum/csrf-cookie');
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                toast.success(`Preset ${editingPreset ? 'updated' : 'created'} successfully`);
                setModalOpen(false);
                fetchPresets();
            } else {
                toast.error('Failed to save preset');
            }
        } catch (error) { toast.error('An error occurred'); }
        finally { setIsSaving(false); }
    };

    const handleSort = (column: string) => {
        if (sortBy === column) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        else { setSortBy(column); setSortDirection('asc'); }
    };

    const filteredPresets = useMemo(() => {
        if (!search) return presets;
        const lowerSearch = search.toLowerCase();
        return presets.filter(p => p.reason_text.toLowerCase().includes(lowerSearch));
    }, [presets, search]);

    const sortedPresets = useMemo(() => {
        return [...filteredPresets].sort((a, b) => {
            let aVal = a[sortBy]; let bVal = b[sortBy];
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredPresets, sortBy, sortDirection]);

    const paginatedPresets = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedPresets.slice(start, start + itemsPerPage);
    }, [sortedPresets, currentPage, itemsPerPage]);

    return (
        <div>
            <FilterBar
                icon={<IconNotes className="w-6 h-6 text-primary" />}
                title={t('reason_presets', 'Reason Presets')}
                description={t('reason_presets_desc', 'Manage quick-select reasons for late clock-in or early exit')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val: number) => { setItemsPerPage(val); setCurrentPage(1); }}
                onAdd={handleCreate}
                addLabel={t('add_preset', 'Add Preset')}
                onRefresh={fetchPresets}
            />

            {loading ? (
                <TableSkeleton columns={5} rows={5} />
            ) : sortedPresets.length === 0 ? (
                <EmptyState
                    isSearch={!!search}
                    searchTerm={search}
                    onClearFilter={() => setSearch('')}
                    title="No reason presets yet"
                    description="Add presets to help employees clock in/out faster."
                    actionLabel="Add New Preset"
                    onAction={handleCreate}
                />
            ) : (
                <div className="table-responsive bg-white dark:bg-black rounded-lg border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full table-hover text-left">
                            <thead className="border-b dark:border-gray-600">
                                <tr>
                                    <SortableHeader label="Reason Text" value="reason_text" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label="Type" value="type" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label="Order" value="sort_order" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {paginatedPresets.map((preset: any) => (
                                    <tr key={preset.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="py-4 font-medium">{preset.reason_text}</td>
                                        <td className="py-4 capitalize">
                                            <Badge variant={preset.type === 'both' ? 'secondary' : (preset.type === 'late' ? 'warning' : 'success')}>
                                                {preset.type}
                                            </Badge>
                                        </td>
                                        <td className="py-4">{preset.sort_order}</td>
                                        <td className="py-4">
                                            <button onClick={() => toggleStatus(preset)}>
                                                <Badge variant={preset.is_active ? 'success' : 'destructive'}>
                                                    {preset.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </button>
                                        </td>
                                        <td className="py-4">
                                            <ActionButtons skipDeleteConfirm={true} size="sm" onEdit={() => handleEdit(preset)} onDelete={() => confirmDelete(preset.id)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {!loading && sortedPresets.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(sortedPresets.length / itemsPerPage)}
                            totalItems={sortedPresets.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </div>
            )}

            {/* Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[500px] w-[95vw] !rounded-2xl p-0 overflow-hidden bg-background/30 backdrop-blur-xl [&>button]:hidden">
                    <div className="flex flex-col bg-white dark:bg-gray-900 shadow-lg ring-1 ring-white/40 dark:ring-gray-700/50">
                        {/* Header */}
                        <div className="px-6 py-5 flex items-center justify-between bg-primary/5 dark:bg-primary/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary/20 text-primary border border-primary/10">
                                    <IconNotes size={24} />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold">
                                        {editingPreset ? t('edit_preset', 'Edit Preset') : t('create_preset', 'Create Preset')}
                                    </DialogTitle>
                                    <p className="text-xs text-gray-500 mt-1">{t('preset_desc', 'Define quick reason for employees')}</p>
                                </div>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="p-2 rounded-full border hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                                <IconX size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">{t('reason_text', 'Reason Text')} <span className="text-rose-500">*</span></Label>
                                    <Input
                                        name="reason_text"
                                        value={formData.reason_text}
                                        onChange={handleChange}
                                        required
                                        placeholder={t('e_g_heavy_traffic', 'e.g. Heavy Traffic')}
                                        className="h-11 font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">{t('type', 'Type')}</Label>
                                        <Select onValueChange={(val) => handleSelectChange(val, 'type')} value={formData.type}>
                                            <SelectTrigger className="h-11 font-bold">
                                                <SelectValue placeholder="Select Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="late" className="font-bold">{t('late_clock_in', 'Late Clock In')}</SelectItem>
                                                <SelectItem value="early" className="font-bold">{t('early_departure', 'Early Departure')}</SelectItem>
                                                <SelectItem value="both" className="font-bold">{t('both', 'Both')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">{t('sort_order', 'Sort Order')}</Label>
                                        <Input
                                            type="number"
                                            name="sort_order"
                                            value={formData.sort_order}
                                            onChange={handleChange}
                                            className="h-11 font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">{t('status', 'Status')}</Label>
                                    <Select onValueChange={(val) => handleSelectChange(val === 'true' ? 'true' : 'false', 'is_active')} value={formData.is_active ? 'true' : 'false'}>
                                        <SelectTrigger className="h-11 font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="true" className="font-bold">{t('active', 'Active')}</SelectItem>
                                            <SelectItem value="false" className="font-bold">{t('inactive', 'Inactive')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1 font-black uppercase tracking-widest text-[10px]">
                                    {t('cancel', 'Cancel')}
                                </Button>
                                <Button type="submit" disabled={isSaving} className="flex-1 gap-2 font-black uppercase tracking-widest text-[10px]">
                                    {isSaving ? <IconLoader2 className="animate-spin" size={16} /> : <IconDeviceFloppy size={16} />}
                                    {isSaving ? t('saving', 'Saving...') : t('save_preset', 'Save Preset')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title={t('delete_preset', 'Delete Preset')}
                message={t('delete_preset_confirm', 'Are you sure you want to delete this reason preset?')}
            />
        </div>
    );
};

export default ReasonPresetIndex;
