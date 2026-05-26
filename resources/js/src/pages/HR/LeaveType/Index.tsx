import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/dialog';
import { Checkbox } from '../../../components/ui/checkbox';
import { Badge } from '../../../components/ui/badge';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { Textarea } from '../../../components/ui/textarea';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { 
    IconClipboardHeart, 
    IconCheck, 
    IconPalette,
    IconX,
    IconDeviceFloppy,
    IconLoader2,
    IconInfoCircle,
    IconSettings,
    IconCircleCheck,
    IconCircleX,
    IconColorPicker,
    IconSignature,
    IconAlignLeft,
    IconCalendarStats,
    IconCash,
    IconPower
} from '@tabler/icons-react';
import { Switch } from '../../../components/ui/switch';
import HighlightText from '@/components/ui/HighlightText';
import { PopoverTrigger, PopoverContent, Popover } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { THEME_COLORS } from '@/constants/themeColors';
import { Illustration } from '@/components/illustrations/PremiumIcon';

const LeaveTypeIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingLeaveType, setEditingLeaveType] = useState<any>(null);
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
        max_per_year: 0,
        is_paid: false,
        color: '#000000',
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
        dispatch(setPageTitle(t('leave_types')));
    }, [t, dispatch]);

    const fetchLeaveTypes = () => {
        setLoading(true);
        fetch('/api/hr/leave-types', {
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
                    setLeaveTypes(data);
                } else {
                    setLeaveTypes([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLeaveTypes([]);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    const handleCreate = () => {
        setEditingLeaveType(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (type: any) => {
        setEditingLeaveType(type);
        setFormData({
            name: type.name,
            description: type.description || '',
            max_per_year: type.max_per_year || 0,
            is_paid: type.is_paid == 1 || type.is_paid === true,
            color: type.color || '#000000',
            status: type.status == 1 || type.status === true,
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
            const response = await fetch(`/api/hr/leave-types/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
            });

            if (response.ok) {
                toast.success('Leave Type deleted successfully');
                fetchLeaveTypes();
            } else {
                toast.error('Failed to delete leave type');
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
        const { name, value, type } = e.target;

        let val: any = value;
        if (type === 'checkbox') {
            val = (e.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            val = parseInt(value) || 0;
        }

        setFormData(prev => ({ ...prev, [name]: val } as typeof prev));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const url = editingLeaveType ? `/api/hr/leave-types/${editingLeaveType.id}` : '/api/hr/leave-types';
        const method = editingLeaveType ? 'PUT' : 'POST';

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
                toast.success(`Leave Type ${editingLeaveType ? 'updated' : 'created'} successfully`);
                setModalOpen(false);
                fetchLeaveTypes();
            } else {
                if (response.status === 401) {
                    window.location.href = '/login';
                }
                toast.error(data.message || `Failed to ${editingLeaveType ? 'update' : 'create'} leave type`);

                // Show validation errors if present
                if (data.errors) {
                    Object.values(data.errors).forEach((errArray: any) => {
                        toast.error(errArray[0]);
                    });
                }
            }
        } catch (error) {
            console.error(error);
            toast.error(t('error_occurred'));
        } finally {
            setIsSaving(false);
        }
    };

    // Derived state for table
    const filteredAndSortedLeaveTypes = useMemo(() => {
        let result = [...leaveTypes];

        // Search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(type =>
                type.name?.toLowerCase().includes(q)
            );
        }

        // Sort
        result.sort((a, b) => {
            let valA = a[sortBy] || '';
            let valB = b[sortBy] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [leaveTypes, search, sortBy, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedLeaveTypes.length / itemsPerPage);
    const paginatedLeaveTypes = filteredAndSortedLeaveTypes.slice(
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
                title={t('leave_types_title')}
                description={t('leave_types_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={handleCreate}
                addLabel={t('add_leave_type_btn')}
                onRefresh={fetchLeaveTypes}
                hasActiveFilters={sortBy !== 'name' || sortDirection !== 'asc'}
                onClearFilters={() => {
                    setSortBy('name');
                    setSortDirection('asc');
                }}
            />

            {loading ? (
                <TableSkeleton columns={6} rows={5} />
            ) : leaveTypes.length === 0 ? (
                <EmptyState
                    title={t('no_leave_types_found_title')}
                    description={t('create_first_leave_type_desc')}
                    actionLabel={t('add_leave_type_btn')}
                    onAction={handleCreate}
                />
            ) : filteredAndSortedLeaveTypes.length === 0 ? (
                <EmptyState
                    illustration={<Illustration name="type" />}
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
                    <table className="table-hover w-full table">
                        <thead className='border-b dark:border-gray-600'>
                            <tr>
                                <th>#</th>
                                <SortableHeader label={t('name_label')} value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('max_days_per_year_label')} value="max_per_year" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('paid_label')} value="is_paid" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('color_code_label')} value="color" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('status_label')} value="status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">{t('actions_label')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLeaveTypes.map((type: any, index: number) => (
                                <tr key={type.id}>
                                    <td className="text-start text-gray-400 text-xs font-medium">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="whitespace-nowrap font-medium">
                                        <HighlightText text={type.name} highlight={search} />
                                    </td>
                                    <td>{type.max_per_year || '-'}</td>
                                    <td>
                                        <Badge
                                            size='sm'
                                            variant={type.is_paid ? 'success' : 'warning'}>
                                            {type.is_paid ? t('paid_label') : t('unpaid_label')}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: type.color || '#000000' }}></div>
                                            <span className="font-mono text-xs uppercase">{type.color || 'None'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <Badge
                                            size='sm'
                                            variant={type.status ? 'success' : 'destructive'}>
                                            {type.status ? t('active_label') : t('inactive_label')}
                                        </Badge>
                                    </td>
                                    <td>
                                        <ActionButtons
                                            skipDeleteConfirm={true}
                                            onEdit={() => handleEdit(type)}
                                            onDelete={() => confirmDelete(type.id)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="border-t border-gray-100 dark:border-gray-800">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredAndSortedLeaveTypes.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}

            {/* Leave Type Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent
                    className="sm:max-w-[750px] w-[95vw] max-h-[90vh] h-auto flex flex-col p-2
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
                                        {editingLeaveType ? t('edit_leave_type_title') : t('create_new_leave_type_title')}
                                    </DialogTitle>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                                        {editingLeaveType ? t('update_leave_type_detail_desc') : t('fill_leave_type_detail_desc')}
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
                            <form id="leave-type-form" onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                <div className="space-y-6">
                                    {/* Block 1: Identity */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                <IconSignature size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('basic_information_title', 'Basic Information')}</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-5">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('leave_name_label')} <span className="text-rose-500">*</span></Label>
                                                <Input
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder={t('leave_name_placeholder')}
                                                    className="h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
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
                                                        placeholder={t('leave_desc_placeholder')}
                                                        className="min-h-[100px] pl-11 pt-3 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Block 3: Management */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                                <IconPower size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('status_label', 'Status')}</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-5">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('is_active_label', 'Active Status')}</Label>
                                                    <p className="text-[10px] text-slate-500 font-medium">{t('toggle_availability_desc', 'Toggle availability of this leave type')}</p>
                                                </div>
                                                <Switch
                                                    checked={formData.status}
                                                    onCheckedChange={(v) => setFormData(p => ({ ...p, status: v } as typeof p))}
                                                />
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div className="space-y-6">
                                    {/* Block 2: Leave Configuration */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                                <IconSettings size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('leave_settings_title', 'Leave Settings')}</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-5">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('max_days_per_year_label')}</Label>
                                                <div className="relative">
                                                    <IconCalendarStats size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <Input
                                                        name="max_per_year"
                                                        type="number"
                                                        value={formData.max_per_year}
                                                        onChange={handleChange}
                                                        min="0"
                                                        placeholder="e.g. 20"
                                                        className="pl-11 h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                    />
                                                </div>
                                                <p className="text-[9px] text-slate-500 font-medium px-1 italic">{t('zero_means_unlimited_help')}</p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('color_code_label')}</Label>
                                                <div className="flex items-center gap-2 pt-1">
                                                    {THEME_COLORS.filter(c => ['blue', 'red', 'emerald', 'amber', 'purple'].includes(c.value)).map((themeColor) => {
                                                        const isSelected = formData.color?.toLowerCase() === themeColor.hex.toLowerCase();
                                                        return (
                                                            <button
                                                                key={themeColor.value}
                                                                type="button"
                                                                onClick={() => setFormData(prev => ({ ...prev, color: themeColor.hex }))}
                                                                title={themeColor.label}
                                                                className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none ${
                                                                    isSelected ? "ring-2 ring-primary ring-offset-2 scale-110 shadow-lg" : "hover:scale-110 opacity-80 hover:opacity-100 shadow-sm"
                                                                }`}
                                                                style={{ backgroundColor: themeColor.hex } as React.CSSProperties}
                                                            >
                                                                {isSelected && <IconCheck className="w-4 h-4 text-white drop-shadow-sm" strokeWidth={3} />}
                                                            </button>
                                                        );
                                                    })}

                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <button
                                                                type="button"
                                                                title={t('more_colors_btn') || "More colors"}
                                                                className="w-8 h-8 shrink-0 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                            >
                                                                <IconPalette size={16} />
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-64 p-4 shadow-xl rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                                            <div className="space-y-4">
                                                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('theme_colors_title', 'Theme Colors')}</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {THEME_COLORS.map((themeColor) => {
                                                                        const isSelected = formData.color?.toLowerCase() === themeColor.hex.toLowerCase();
                                                                        return (
                                                                            <button
                                                                                key={themeColor.value}
                                                                                type="button"
                                                                                onClick={() => setFormData(prev => ({ ...prev, color: themeColor.hex }))}
                                                                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                                                                                    isSelected ? "ring-2 ring-primary ring-offset-1" : ""
                                                                                }`}
                                                                                style={{ backgroundColor: themeColor.hex } as React.CSSProperties}
                                                                            >
                                                                                {isSelected && <IconCheck size={14} className="text-white" strokeWidth={3} />}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                                                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{t('custom_hex_label', 'Custom Hex Code')}</Label>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0" style={{ backgroundColor: formData.color || '#e5e7eb' }} />
                                                                        <Input
                                                                            value={formData.color}
                                                                            name="color"
                                                                            onChange={handleChange}
                                                                            placeholder="#000000"
                                                                            className="flex-1 font-mono text-xs uppercase h-9"
                                                                            maxLength={7}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2">
                                                <div className="space-y-0.5">
                                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('is_paid_leave_label')}</Label>
                                                    <p className="text-[10px] text-slate-500 font-medium">{t('paid_leave_desc', 'Whether this leave is financially covered')}</p>
                                                </div>
                                                <Switch
                                                    checked={formData.is_paid}
                                                    onCheckedChange={(v) => setFormData(p => ({ ...p, is_paid: v } as typeof p))}
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
                                    form="leave-type-form"
                                    disabled={isSaving}
                                    className="flex-1 sm:flex-none h-10 px-8 gap-2 font-black shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px]"
                                >
                                    {isSaving ? <IconLoader2 className="animate-spin" size={16} /> : <IconDeviceFloppy size={16} />}
                                    {isSaving ? t('saving_dots') : (editingLeaveType ? t('save_changes_btn') : t('create_leave_type_btn'))}
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
                title={t('delete_leave_type_title')}
                message={t('delete_leave_type_confirm')}
            />
        </div>
    );
};

export default LeaveTypeIndex;