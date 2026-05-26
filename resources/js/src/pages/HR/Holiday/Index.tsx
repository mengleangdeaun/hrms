import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { DatePicker } from '../../../components/ui/date-picker';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Checkbox } from '../../../components/ui/checkbox';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import SearchableMultiSelect from '../../../components/ui/SearchableMultiSelect';
import { 
    IconConfetti, 
    IconCalendarEvent, 
    IconInfoCircle, 
    IconMapPin, 
    IconClock,
    IconX,
    IconDeviceFloppy,
    IconLoader2,
    IconCalendarClock,
    IconUsers,
    IconAdjustmentsHorizontal,
    IconFileDescription,
    IconSettings
} from '@tabler/icons-react';
import HighlightText from '@/components/ui/HighlightText';
import { format, parseISO } from 'date-fns';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';

const HOLIDAY_CATEGORIES = [
    'National Holidays',
    'Religious',
    'Company Specific',
    'Regional Events'
];

const toDateStr = (d: Date | undefined) => d ? format(d, 'yyyy-MM-dd') : '';

const HolidayIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [holidays, setHolidays] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('start_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const initialFormState = {
        name: '',
        category: 'National Holidays',
        start_date: toDateStr(new Date()),
        end_date: toDateStr(new Date()),
        description: '',
        is_paid: true,
        is_half_day: false,
        branch_ids: [],
        employee_ids: []
    };
    const [formData, setFormData] = useState<any>(initialFormState);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    useEffect(() => {
        dispatch(setPageTitle(t('holidays')));
    }, [t, dispatch]);

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            fetch('/api/hr/holidays', { headers: { Accept: 'application/json' } }).then(r => r.json()),
            fetch('/api/hr/branches?compact=true', { headers: { Accept: 'application/json' } }).then(r => r.json()),
            fetch('/api/hr/employees?compact=true', { headers: { Accept: 'application/json' } }).then(r => r.json())
        ]).then(([holidayData, branchData, employeeData]) => {
            if (Array.isArray(holidayData)) setHolidays(holidayData);
            if (Array.isArray(branchData)) setBranches(branchData);
            if (Array.isArray(employeeData)) setEmployees(employeeData);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            toast.error(t('failed_load_data_msg'));
            setLoading(false);
        });
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreate = () => {
        setEditingItem(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            category: item.category,
            start_date: item.start_date ? format(parseISO(item.start_date), 'yyyy-MM-dd') : '',
            end_date: item.end_date ? format(parseISO(item.end_date), 'yyyy-MM-dd') : '',
            description: item.description || '',
            is_paid: item.is_paid,
            is_half_day: item.is_half_day,
            branch_ids: item.branches?.map((b: any) => b.id.toString()) || [],
            employee_ids: item.employees?.map((e: any) => e.id.toString()) || []
        });
        setModalOpen(true);
    };

    const confirmDelete = (id: number) => { setItemToDelete(id); setDeleteModalOpen(true); };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/hr/holidays/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || ''
                },
                credentials: 'include',
            });
            if (res.ok) {
                toast.success(t('holiday_deleted_msg'));
                fetchData();
            } else toast.error(t('failed_delete_msg'));
        } catch { toast.error('An error occurred'); }
        finally { setIsDeleting(false); setDeleteModalOpen(false); setItemToDelete(null); }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSelectChange = (value: any, name: string) =>
        setFormData((prev: any) => ({ ...prev, [name]: value }));

    const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.checked }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const url = editingItem ? `/api/hr/holidays/${editingItem.id}` : '/api/hr/holidays';
        const method = editingItem ? 'PUT' : 'POST';
        try {
            await fetch('/sanctum/csrf-cookie');
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || ''
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`${t('holidays')} ${editingItem ? t('updated') : t('created')} ${t('successfully')}`);
                setModalOpen(false);
                fetchData();
            } else {
                const firstError = data.errors ? Object.values(data.errors)[0] : data.message;
                toast.error(Array.isArray(firstError) ? firstError[0] : firstError || t('failed_save_msg'));
            }
        } catch { toast.error('An error occurred'); }
        finally { setIsSaving(false); }
    };

    const handleSort = (column: string) => {
        if (sortBy === column) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortBy(column); setSortDirection('asc'); }
    };

    const filteredItems = useMemo(() => {
        if (!search) return holidays;
        const q = search.toLowerCase();
        return holidays.filter(item =>
            item.name.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
        );
    }, [holidays, search]);

    const sortedItems = useMemo(() => {
        return [...filteredItems].sort((a, b) => {
            let aVal = a[sortBy]; let bVal = b[sortBy];
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredItems, sortBy, sortDirection]);

    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedItems.slice(start, start + itemsPerPage);
    }, [sortedItems, currentPage, itemsPerPage]);

    const branchOptions = useMemo(() =>
        branches.map(b => ({ value: b.id.toString(), label: b.name }))
        , [branches]);

    const employeeOptions = useMemo(() =>
        employees.map(e => ({ value: e.id.toString(), label: e.full_name }))
        , [employees]);

    return (
        <div>
            <FilterBar
                icon={<IconCalendarEvent className="w-6 h-6 text-primary" />}
                title={t('holiday_management_title')}
                description={t('holiday_management_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                onAdd={handleCreate}
                addLabel={t('add_holiday_add')}
                onRefresh={fetchData}
            />

                    {loading ? (
                        <TableSkeleton columns={7} rows={5} />
                    ) : sortedItems.length === 0 ? (
                        <EmptyState
                            isSearch={!!search}
                            searchTerm={search}
                            onClearFilter={() => setSearch('')}
                            title={t('no_holidays_found_title')}
                            description={t('add_holiday_calendar_desc')}
                            actionLabel={t('add_holiday_add')}
                            onAction={handleCreate}
                        />
                    ) : (
            <div className="table-responsive bg-white dark:bg-black rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-gray-500 uppercase border-b dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-4">{t('name_label')}</th>
                                    <SortableHeader label={t('category_label')} value="category" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label={t('start_date_label')} value="start_date" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label={t('end_date_label')} value="end_date" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th className="px-6 py-4">{t('status_label')}</th>
                                    <th className="px-6 py-4">{t('branches_label')}</th>
                                    <th className="px-6 py-4">{t('specific_employees_label', 'Specific Employees')}</th>
                                    <th className="px-6 py-4 text-right">{t('actions_label')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {paginatedItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                                    <IconConfetti size={18} />
                                                </div>
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    <HighlightText text={item.name} highlight={search} />
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                                {t(item.category.toLowerCase().replace(/ /g, '_'))}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.start_date ? format(parseISO(item.start_date), 'MMM dd, yyyy') : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.end_date ? format(parseISO(item.end_date), 'MMM dd, yyyy') : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {item.is_paid && (
                                                    <span className="text-[10px] font-bold text-green-600 uppercase">{t('paid_label')}</span>
                                                )}
                                                {item.is_half_day && (
                                                    <span className="text-[10px] font-bold text-amber-600 uppercase">{t('half_day_label')}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-[200px]">
                                            <div className="flex flex-wrap gap-1">
                                                {item.branches?.map((b: any) => (
                                                    <span key={b.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
                                                        <IconMapPin size={10} /> {b.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-[200px]">
                                            <div className="flex flex-wrap gap-1">
                                                {item.employees?.map((e: any) => (
                                                    <span key={e.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-medium rounded border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400">
                                                        <IconUsers size={10} /> {e.full_name}
                                                    </span>
                                                ))}
                                                {(!item.employees || item.employees.length === 0) && (
                                                    <span className="text-[10px] text-gray-400 italic">{t('none_label', 'None')}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ActionButtons
                                                variant='rounded'
                                                skipDeleteConfirm={true}
                                                onEdit={() => handleEdit(item)}
                                                onDelete={() => confirmDelete(item.id)}
                                            />
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

            {/* Holiday Modal */}
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
                                    <IconCalendarEvent size={24} />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                                        {editingItem ? t('edit_holiday_title') : t('add_holiday_title')}
                                    </DialogTitle>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                                        {t('holiday_config_desc')}
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
                            <form id="holiday-form" onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-8">
                                    {/* Block 1: Holiday Identity */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                <IconConfetti size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('holiday_details_title')}</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-5">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('holiday_name_label')} <span className="text-rose-500">*</span></Label>
                                                <Input
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    placeholder={t('holiday_name_placeholder')}
                                                    required
                                                    className="h-11 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('category_label')} <span className="text-rose-500">*</span></Label>
                                                <Select onValueChange={(val) => handleSelectChange(val, 'category')} value={formData.category}>
                                                    <SelectTrigger className="h-11 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                        <SelectValue placeholder={t('select_category_placeholder')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {HOLIDAY_CATEGORIES.map(c => (
                                                            <SelectItem key={c} value={c}>{t(c.toLowerCase().replace(/ /g, '_'))}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Block 2: Schedule */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                                                <IconCalendarClock size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('dates_title')}</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-5">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('start_date_label')} <span className="text-rose-500">*</span></Label>
                                                <DatePicker
                                                    value={formData.start_date}
                                                    onChange={(d) => handleSelectChange(toDateStr(d), 'start_date')}
                                                    placeholder={t('select_start_date_placeholder')}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('end_date_label')} <span className="text-rose-500">*</span></Label>
                                                <DatePicker
                                                    value={formData.end_date}
                                                    onChange={(d) => handleSelectChange(toDateStr(d), 'end_date')}
                                                    placeholder={t('select_end_date_placeholder')}
                                                />
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div className="space-y-8">
                                    {/* Block 3: Scope */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                                <IconUsers size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('applicable_branches_label')} <span className="text-rose-500">*</span></h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('branches_label')} <span className="text-rose-500">*</span></Label>
                                                <SearchableMultiSelect
                                                    options={branchOptions}
                                                    value={formData.branch_ids}
                                                    onChange={(val) => handleSelectChange(val, 'branch_ids')}
                                                    placeholder={t('select_branches_placeholder')}
                                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('specific_employees_label', 'Specific Employees')}</Label>
                                                <SearchableMultiSelect
                                                    options={employeeOptions}
                                                    value={formData.employee_ids}
                                                    onChange={(val) => handleSelectChange(val, 'employee_ids')}
                                                    placeholder={t('select_employees_placeholder', 'Select specific employees')}
                                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    {/* Block 4: Options */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                                <IconAdjustmentsHorizontal size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('options_label')}</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 grid grid-cols-1 gap-5">
                                            <div className="flex items-center justify-between p-2">
                                                <div className="space-y-0.5">
                                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('paid_holiday_label')}</Label>
                                                    <p className="text-[10px] text-slate-500">{t('paid_holiday_desc')}</p>
                                                </div>
                                                <Switch
                                                    checked={formData.is_paid}
                                                    onCheckedChange={(checked) => handleSelectChange(checked, 'is_paid')}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-2">
                                                <div className="space-y-0.5">
                                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('half_day_label')}</Label>
                                                    <p className="text-[10px] text-slate-500">{t('half_day_off_desc')}</p>
                                                </div>
                                                <Switch
                                                    checked={formData.is_half_day}
                                                    onCheckedChange={(checked) => handleSelectChange(checked, 'is_half_day')}
                                                />
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* Block 5: Additional Details */}
                                <section className="md:col-span-2 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                            <IconFileDescription size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('description_label')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('description_label')}</Label>
                                            <Textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                placeholder={t('holiday_description_placeholder')}
                                                rows={3}
                                                className="min-h-[100px] font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none"
                                            />
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
                                    form="holiday-form"
                                    disabled={isSaving}
                                    className="flex-1 sm:flex-none h-10 px-8 gap-2 font-black shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px]"
                                >
                                    {isSaving ? <IconLoader2 className="animate-spin" size={16} /> : <IconDeviceFloppy size={16} />}
                                    {isSaving ? t('saving_label') : (editingItem ? t('update_holiday_btn') : t('save_holiday_btn'))}
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
                title={t('delete_holiday_title')}
                message={t('delete_holiday_confirm')}
            />
        </div>
    );
};

export default HolidayIndex;
