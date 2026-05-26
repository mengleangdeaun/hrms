import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { DatePicker } from '../../../components/ui/date-picker';
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from '@/components/ui/avatar';
import PerfectScrollbar from 'react-perfect-scrollbar';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import MediaSelector, { MediaFile } from '../../../components/MediaSelector';
import { 
    IconAlertTriangle, 
    IconFileText, 
    IconX, 
    IconExternalLink, 
    IconPaperclip,
    IconDeviceFloppy,
    IconLoader2,
    IconCalendarEvent,
    IconClock,
    IconFileDescription,
    IconMessageDots,
    IconFileUpload,
    IconInfoCircle,
    IconUserCircle,
    IconTarget,
    IconAlertCircle,
    IconPencil
} from '@tabler/icons-react';
import HighlightText from '@/components/ui/HighlightText';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';

const toDateStr = (d: Date | undefined) => d ? d.toISOString().split('T')[0] : '';

const WARNING_TYPES = ['Verbal', 'Written', 'Final Written', 'Suspension', 'Other'];

const severityConfig: Record<string, { label: string; className: string }> = {
    low: { label: 'Low', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    high: { label: 'High', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const WarningIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch(); 
    const [warnings, setWarnings] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('warning_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const today = new Date().toISOString().split('T')[0];
    const initialFormState = {
        employee_id: '',
        warning_by: '',
        warning_type: '',
        subject: '',
        severity: 'medium',
        warning_date: today,
        description: '',
        document: '',
        expiry_date: '',
        has_improvement_plan: false,
        ip_goal: '',
        ip_start_date: '',
        ip_end_date: '',
    };
    const [formData, setFormData] = useState<any>(initialFormState);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            fetch('/api/hr/warnings', { headers: { Accept: 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' }).then(r => r.json()),
            fetch('/api/hr/employees?compact=true', { headers: { Accept: 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' }).then(r => r.json()),
        ]).then(([warnData, empData]) => {
            if (Array.isArray(warnData)) setWarnings(warnData);
            if (Array.isArray(empData)) setEmployees(empData);
            setLoading(false);
        }).catch(err => { console.error(err); setLoading(false); });
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreate = () => {
        setEditingItem(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    useEffect(() => {
        dispatch(setPageTitle(t('warnings')));
    }, [t, dispatch]);

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setFormData({
            employee_id: item.employee_id,
            warning_by: item.warning_by || '',
            warning_type: item.warning_type || '',
            subject: item.subject || '',
            severity: item.severity || 'medium',
            warning_date: item.warning_date || today,
            description: item.description || '',
            document: item.document || '',
            expiry_date: item.expiry_date || '',
            has_improvement_plan: item.has_improvement_plan || false,
            ip_goal: item.ip_goal || '',
            ip_start_date: item.ip_start_date || '',
            ip_end_date: item.ip_end_date || '',
        });
        setModalOpen(true);
    };

    const confirmDelete = (id: number) => { setItemToDelete(id); setDeleteModalOpen(true); };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/hr/warnings/${itemToDelete}`, {
                method: 'DELETE',
                headers: { Accept: 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
            });
            if (res.ok) { toast.success(t('warning_deleted_msg')); fetchData(); }
            else toast.error(t('failed_delete_msg'));
        } catch { toast.error('An error occurred'); }
        finally { setIsDeleting(false); setDeleteModalOpen(false); setItemToDelete(null); }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSelectChange = (value: string | number | boolean, name: string) =>
        setFormData((prev: any) => ({ ...prev, [name]: value }));

    const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.checked }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const url = editingItem ? `/api/hr/warnings/${editingItem.id}` : '/api/hr/warnings';
        const method = editingItem ? 'PUT' : 'POST';
        try {
            await fetch('/sanctum/csrf-cookie');
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`${t('warnings_title')} ${editingItem ? t('updated') : t('issued')} ${t('successfully')}`);
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
        if (!search) return warnings;
        const q = search.toLowerCase();
        return warnings.filter(item =>
            item.employee?.full_name?.toLowerCase().includes(q) ||
            item.subject?.toLowerCase().includes(q) ||
            item.warning_type?.toLowerCase().includes(q) ||
            item.severity?.toLowerCase().includes(q)
        );
    }, [warnings, search]);

    const sortedItems = useMemo(() => {
        return [...filteredItems].sort((a, b) => {
            let aVal = a[sortBy]; let bVal = b[sortBy];
            if (sortBy === 'employee.full_name') { aVal = a.employee?.full_name; bVal = b.employee?.full_name; }
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

    const employeeOptions = useMemo(() =>
        employees.map(e => ({ value: e.id, label: `${e.full_name} (${e.employee_code})` }))
        , [employees]);

    return (
        <div>
            <FilterBar
                icon={<IconAlertTriangle className="w-6 h-6 text-primary" />}
                title={t('warnings_title')}
                description={t('warnings_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                onAdd={handleCreate}
                addLabel={t('issue_warning_add')}
                onRefresh={fetchData}
            />

                    {loading ? (
                        <TableSkeleton columns={7} rows={5} />
                    ) : sortedItems.length === 0 ? (
                        <EmptyState
                            isSearch={!!search}
                            searchTerm={search}
                            onClearFilter={() => setSearch('')}
                            title={t('no_warnings_found_title')}
                            description={t('issue_warning_desc')}
                            actionLabel={t('issue_warning_add')}
                            onAction={handleCreate}
                        />
                    ) : (
            <div className="table-responsive bg-white dark:bg-black rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                        <table className="w-full table-hover text-left">
                            <thead className="border-b dark:border-gray-600">
                                <tr>
                                    <SortableHeader label={t('employee_label')} value="employee.full_name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label={t('subject_label')} value="subject" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label={t('type_label')} value="warning_type" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label={t('severity_label')} value="severity" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label={t('warning_date_label')} value="warning_date" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label={t('expiry_date_label')} value="expiry_date" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th className="px-6 py-4">{t('imp_short')}</th>
                                    <th className="px-6 py-4">{t('media_label')}</th>
                                    <th className="px-6 py-4 text-right">{t('actions_label')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {paginatedItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        {/* Employee */}
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 rounded-full border shadow-sm">
                                                    <AvatarImage src={item.employee?.profile_image_url} alt={item.employee?.full_name} className="object-cover" />
                                                    <AvatarFallback className="rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase">
                                                        {item.employee?.full_name?.charAt(0) || '?'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-semibold">
                                                        <HighlightText text={item.employee?.full_name} highlight={search} />
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        <HighlightText text={item.employee?.employee_code} highlight={search} />
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Subject */}
                                        <td className="px-6 py-4 max-w-[180px] truncate" title={item.subject}>
                                            <HighlightText text={item.subject} highlight={search} />
                                        </td>
                                        {/* Type */}
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                                {t(item.warning_type.toLowerCase().replace(/ /g, '_'))}
                                            </span>
                                        </td>
                                        {/* Severity */}
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityConfig[item.severity]?.className}`}>
                                                {t(item.severity)}
                                            </span>
                                        </td>
                                        {/* Warning Date */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.warning_date ? new Date(item.warning_date).toLocaleDateString() : '—'}
                                        </td>
                                        {/* Expiry Date */}
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '—'}
                                        </td>
                                        {/* Improvement Plan */}
                                        <td className="px-6 py-4">
                                            {item.has_improvement_plan ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">{t('yes_label')}</span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">—</span>
                                            )}
                                        </td>
                                        {/* Document */}
                                        <td className="px-6 py-4">
                                            {item.document ? (
                                                <a
                                                    href={item.document}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title={t('view_document_tooltip')}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 transition-colors dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/40"
                                                >
                                                    <IconPaperclip size={15} />
                                                </a>
                                            ) : (
                                                <span className="text-gray-300 dark:text-gray-600">—</span>
                                            )}
                                        </td>
                                        {/* Actions */}
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

            {/* Create/Edit Dialog */}
            {/* Warning Modal */}
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
                            bg-primary/5 dark:bg-primary/10 rounded-t-xl border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary/20 text-primary shadow-sm border border-primary/10">
                                    <IconAlertTriangle size={24} />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                                        {editingItem ? t('edit_warning_title') : t('issue_warning_add')}
                                    </DialogTitle>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                                        {editingItem ? t('update_warning_detail_desc') : t('fill_warning_detail_desc')}
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
                            <form id="warning-form" onSubmit={handleSubmit} className="p-6 space-y-8">
                                
                                {/* Block 1: Warning Details */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <IconUserCircle size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('warning_details_title')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row gap-5">
                                        <div className="shrink-0 flex items-center justify-center">
                                            {(() => {
                                                const selectedEmp = employees.find(e => String(e.id) === String(formData.employee_id));
                                                return (
                                                    <Avatar className="h-16 w-16 rounded-full border-2 border-white dark:border-gray-800 shadow-lg">
                                                        <AvatarImage src={selectedEmp?.profile_image_url} alt="profile" className="object-cover" />
                                                        <AvatarFallback className="rounded-full text-xl font-black bg-primary/10 text-primary uppercase">
                                                            {selectedEmp?.full_name?.charAt(0) || '?'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                );
                                            })()}
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div className="space-y-0">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('employee_label')} <span className="text-rose-500">*</span></Label>
                                                <SearchableSelect
                                                    options={employeeOptions}
                                                    value={formData.employee_id}
                                                    onChange={(val) => handleSelectChange(val, 'employee_id')}
                                                    placeholder={t('search_employee_placeholder')}
                                                    searchPlaceholder={t('type_name_search_placeholder')}
                                                    emptyMessage={t('no_employees_found_title')}
                                                    className="bg-white h-11 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                />
                                            </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('warning_by_label')} <span className="text-rose-500">*</span></Label>
                                            <Input
                                                name="warning_by"
                                                value={formData.warning_by}
                                                onChange={handleChange}
                                                placeholder={t('warning_by_placeholder')}
                                                className="h-11 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('warning_type_label')} <span className="text-rose-500">*</span></Label>
                                            <Select onValueChange={(val) => handleSelectChange(val, 'warning_type')} value={formData.warning_type}>
                                                <SelectTrigger className="h-11 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                    <SelectValue placeholder={t('select_type_placeholder')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {WARNING_TYPES.map(t_val => (
                                                        <SelectItem key={t_val} value={t_val}>{t(t_val.toLowerCase().replace(/ /g, '_'))}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('severity_label')} <span className="text-rose-500">*</span></Label>
                                            <Select onValueChange={(val) => handleSelectChange(val, 'severity')} value={formData.severity}>
                                                <SelectTrigger className="h-11 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                    <SelectValue placeholder={t('select_severity_placeholder')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">{t('low')}</SelectItem>
                                                    <SelectItem value="medium">{t('medium')}</SelectItem>
                                                    <SelectItem value="high">{t('high')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                </section>

                                {/* Block 2: Timeline */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                                            <IconCalendarEvent size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('dates_title')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('warning_date_label')} <span className="text-rose-500">*</span></Label>
                                            <DatePicker
                                                value={formData.warning_date}
                                                onChange={(d) => setFormData((prev: any) => ({ ...prev, warning_date: toDateStr(d) }))}
                                                placeholder={t('select_warning_date_placeholder')}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('expiry_date_label')}</Label>
                                            <DatePicker
                                                value={formData.expiry_date}
                                                onChange={(d) => setFormData((prev: any) => ({ ...prev, expiry_date: toDateStr(d) }))}
                                                placeholder={t('select_expiry_date_placeholder')}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Block 3: Warning Content */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                            <IconFileDescription size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('reason_description_title')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-5">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('subject_label')} <span className="text-rose-500">*</span></Label>
                                            <Input
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                placeholder={t('warning_subject_placeholder')}
                                                className="h-11 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('description_label')}</Label>
                                            <Textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                placeholder={t('warning_description_placeholder')}
                                                rows={3}
                                                className="min-h-[100px] font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Block 4: Improvement Plan */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                            <IconTarget size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('improvement_plan_title')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-6">
                                        <div className="flex items-center justify-between p-2">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('has_improvement_plan_label')}</Label>
                                                <p className="text-[10px] text-slate-500">{t('improvement_plan_desc', 'Set specific goals for employee improvement.')}</p>
                                            </div>
                                            <Switch
                                                checked={formData.has_improvement_plan}
                                                onCheckedChange={(checked) => handleSelectChange(checked, 'has_improvement_plan')}
                                            />
                                        </div>

                                        {formData.has_improvement_plan && (
                                            <div className="space-y-5 pt-2 border-t border-slate-100 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('goal_label')}</Label>
                                                    <Textarea
                                                        name="ip_goal"
                                                        value={formData.ip_goal}
                                                        onChange={handleChange}
                                                        placeholder={t('improvement_goal_placeholder')}
                                                        rows={3}
                                                        className="min-h-[100px] font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('start_date_label')}</Label>
                                                        <DatePicker
                                                            value={formData.ip_start_date}
                                                            onChange={(d) => setFormData((prev: any) => ({ ...prev, ip_start_date: toDateStr(d) }))}
                                                            placeholder={t('select_start_date_placeholder')}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('end_date_label')}</Label>
                                                        <DatePicker
                                                            value={formData.ip_end_date}
                                                            onChange={(d) => setFormData((prev: any) => ({ ...prev, ip_end_date: toDateStr(d) }))}
                                                            placeholder={t('select_end_date_placeholder')}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Block 5: Media */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                                            <IconFileUpload size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('supporting_document_title')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 flex flex-col items-center justify-center min-h-[160px] relative group cursor-pointer overflow-hidden transition-all hover:border-primary/50"
                                        onClick={() => setMediaSelectorOpen(true)}>
                                        {formData.document ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                                <div className="p-4 rounded-full bg-primary/10 text-primary mb-3">
                                                    <IconFileText size={32} />
                                                </div>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{t('warning_document_label')}</p>
                                                <p className="text-[10px] text-slate-500 mt-1">{t('click_change_document_label')}</p>
                                                
                                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button type="button" variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-md hover:scale-110 active:scale-95 transition-all" 
                                                        onClick={(e) => { e.stopPropagation(); window.open(formData.document, '_blank'); }}>
                                                        <IconExternalLink size={14} />
                                                    </Button>
                                                    <Button type="button" size="icon" className="h-8 w-8 rounded-full shadow-md bg-rose-100 text-rose-600 hover:bg-rose-200 hover:scale-110 active:scale-95 transition-all" 
                                                        onClick={(e) => { e.stopPropagation(); handleSelectChange('', 'document'); }}>
                                                        <IconX size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                                                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    <IconFileUpload size={32} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">{t('warning_document_label')}</p>
                                                    <p className="text-[10px] text-slate-500 mt-1">{t('upload_select_pdf_image_label')}</p>
                                                </div>
                                            </div>
                                        )}
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
                                    form="warning-form"
                                    disabled={isSaving}
                                    className="flex-1 sm:flex-none h-10 px-8 gap-2 font-black shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px]"
                                >
                                    {isSaving ? <IconLoader2 className="animate-spin" size={16} /> : <IconDeviceFloppy size={16} />}
                                    {isSaving ? t('saving_label') : (editingItem ? t('save_changes_btn_label') : t('issue_warning_add'))}
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
                title={t('delete_warning_title')}
                message={t('delete_warning_confirm')}
            />

            <MediaSelector
                open={mediaSelectorOpen}
                onOpenChange={setMediaSelectorOpen}
                onSelect={(file: MediaFile) => { setFormData((prev: any) => ({ ...prev, document: file.url })); setMediaSelectorOpen(false); }}
                acceptedType="all"
            />
        </div>
    );
};

export default WarningIndex;
