import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useFormatDate } from '../../../hooks/useFormatDate';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from '@/components/ui/avatar';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { DatePicker } from '../../../components/ui/date-picker';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { 
    IconArrowUpRight, 
    IconBriefcase, 
    IconFileText, 
    IconX, 
    IconExternalLink, 
    IconPhoto,
    IconDeviceFloppy,
    IconLoader2,
    IconUserCircle,
    IconHierarchy,
    IconCalendarTime,
    IconCash,
    IconFileDescription,
    IconFileUpload,
    IconInfoCircle,
    IconChevronRight
} from '@tabler/icons-react';
import HighlightText from '@/components/ui/HighlightText';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { UniversalFilePicker } from '@/components/ui/universal-file-picker';
import { ImagePreviewModal } from '../../../components/ui/image-preview-modal';
import { PDFPreviewModal } from '../../../components/ui/pdf-preview-modal';
import { Label } from '../../../components/ui/label';

const toDateStr = (d: Date | undefined) => {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const PromotionIndex = () => {
    const { t } = useTranslation();
    const { formatDate } = useFormatDate();
    const dispatch = useDispatch();
    const [promotions, setPromotions] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [designations, setDesignations] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Global Preview state (used for table view)
    const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
    const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('promotion_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const initialFormState = {
        employee_id: '',
        previous_designation_id: '',
        new_designation_id: '',
        promotion_date: new Date().toISOString().split('T')[0],
        effective_date: new Date().toISOString().split('T')[0],
        new_salary: '',
        reason: '',
        document: '',
        status: 'pending',
    };
    const [formData, setFormData] = useState<any>(initialFormState);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    useEffect(() => {
        dispatch(setPageTitle(t('promotions_title')));
    }, [dispatch, t]);

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            fetch('/api/hr/promotions', { headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' }).then(r => r.json()),
            fetch('/api/hr/employees?compact=true', { headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' }).then(r => r.json()),
            fetch('/api/hr/designations?compact=true', { headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' }).then(r => r.json()),
        ]).then(([promotionsData, employeesData, designationsData]) => {
            if (Array.isArray(promotionsData)) setPromotions(promotionsData);
            if (Array.isArray(employeesData)) setEmployees(employeesData);
            if (Array.isArray(designationsData)) setDesignations(designationsData);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    };

    useEffect(() => { fetchData(); }, []);

    // When employee changes, auto-populate previous designation
    const selectedEmployee = useMemo(() => {
        if (!formData.employee_id) return null;
        return employees.find(e => String(e.id) === String(formData.employee_id));
    }, [formData.employee_id, employees]);

    useEffect(() => {
        if (selectedEmployee?.designation_id && !editingItem) {
            setFormData((prev: any) => ({ ...prev, previous_designation_id: String(selectedEmployee.designation_id) }));
        }
    }, [selectedEmployee, editingItem]);

    const handleCreate = () => {
        setEditingItem(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setFormData({
            employee_id: item.employee_id,
            previous_designation_id: item.previous_designation_id,
            new_designation_id: item.new_designation_id,
            promotion_date: item.promotion_date,
            effective_date: item.effective_date,
            new_salary: item.new_salary || '',
            reason: item.reason || '',
            document: item.document || '',
            status: item.status,
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
            const response = await fetch(`/api/hr/promotions/${itemToDelete}`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
            });
            if (response.ok) {
                toast.success(t('promotion_deleted_msg'));
                fetchData();
            } else {
                toast.error(t('failed_delete_promotion_msg'));
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectChange = (value: any, name: string) => {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const url = editingItem ? `/api/hr/promotions/${editingItem.id}` : '/api/hr/promotions';
        
        // Use FormData for multipart/form-data support (for file uploads)
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            const value = formData[key];
            if (value !== null && value !== undefined) {
                // If it's a file, append it directly
                // If it's something else, append as string
                // Note: field name changed to new_salary in DB rename
                data.append(key, value);
            }
        });

        // Laravel requires _method: PUT for multipart/form-data updates
        if (editingItem) {
            data.append('_method', 'PUT');
        }

        try {
            await fetch('/sanctum/csrf-cookie');
            const response = await fetch(url, {
                method: 'POST', // Always POST when using FormData + _method for stability
                headers: { 
                    'Accept': 'application/json', 
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' 
                },
                credentials: 'include',
                body: data,
            });
            
            const responseData = await response.json();
            if (response.ok) {
                toast.success(`${t('promotions_title')} ${editingItem ? t('update') : t('create')} ${t('successfully')}`);
                setModalOpen(false);
                fetchData();
            } else {
                const firstError = responseData.errors ? Object.values(responseData.errors)[0] : responseData.message;
                toast.error(Array.isArray(firstError) ? firstError[0] : firstError || t('failed_save_promotion_msg'));
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSort = (column: string) => {
        if (sortBy === column) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortBy(column); setSortDirection('asc'); }
    };

    const filteredItems = useMemo(() => {
        if (!search) return promotions;
        const q = search.toLowerCase();
        return promotions.filter(item =>
            item.employee?.full_name?.toLowerCase().includes(q) ||
            item.previous_designation?.name?.toLowerCase().includes(q) ||
            item.new_designation?.name?.toLowerCase().includes(q) ||
            item.status?.toLowerCase().includes(q)
        );
    }, [promotions, search]);

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
        employees.map(e => ({ value: e.id, label: `${e.full_name} (${e.employee_id})` }))
        , [employees]);

    const designationOptions = useMemo(() =>
        designations.map(d => ({ value: d.id, label: d.name }))
        , [designations]);

    // Global Media Preview Logic (for Table)
    const handleViewMedia = (url: string, title: string) => {
        if (!url) return;

        // Wrap relative storage paths in the secure media preview proxy
        let finalUrl = url;
        if (url && !url.startsWith('http') && !url.startsWith('/') && !url.includes('?path=')) {
            finalUrl = `/media/preview?path=${encodeURIComponent(url)}`;
        }

        setPreviewUrl(finalUrl);
        setPreviewTitle(title);
        
        const baseUrl = finalUrl.split(/[?#]/)[0].toLowerCase();
        let isPdf = baseUrl.endsWith('.pdf') || baseUrl.includes('/pdf');
        
        if (!isPdf) {
            try {
                const urlObj = new URL(finalUrl, window.location.origin);
                const pathParam = urlObj.searchParams.get('path');
                if (pathParam && pathParam.toLowerCase().endsWith('.pdf')) {
                    isPdf = true;
                }
            } catch (e) {}
        }

        if (isPdf) setPdfPreviewOpen(true);
        else setImagePreviewOpen(true);
    };

    return (
        <div>
            <FilterBar
                icon={<IconBriefcase className="w-6 h-6 text-primary" />}
                title={t('promotions_title')}
                description={t('promotions_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                onAdd={handleCreate}
                addLabel={t('promotions_add')}
                onRefresh={fetchData}
            />

                    {loading ? (
                        <TableSkeleton columns={6} rows={5} />
                    ) : sortedItems.length === 0 ? (
                        <EmptyState
                            isSearch={!!search}
                            searchTerm={search}
                            onClearFilter={() => setSearch('')}
                            title={t('no_promotions_found_title')}
                            description={t('add_promotion_desc')}
                            actionLabel={t('promotions_add')}
                            onAction={handleCreate}
                        />
                    ) : (
            <div className="table-responsive bg-white dark:bg-black rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                        <table className="w-full table-hover text-left">
                            <thead className="border-b dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-4">#</th>
                                    <SortableHeader label={t('employee_label')} value="employee.full_name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th className="px-6 py-4">{t('previous_role_label')}</th>
                                    <th className="px-6 py-4">{t('new_role_label')}</th>
                                    <SortableHeader label={t('promotion_date_label')} value="promotion_date" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label={t('effective_date_label')} value="effective_date" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th className="px-6 py-4">{t('new_salary_label', 'New Salary')}</th>
                                    <th className="px-6 py-4">{t('status_label')}</th>
                                    <th className="px-6 py-4">{t('document_label', 'Document')}</th>
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
                                                        <HighlightText text={item.employee?.employee_id} highlight={search} />
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            <HighlightText text={item.previous_designation?.name} highlight={search} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-primary font-medium">
                                                <IconArrowUpRight size={15} />
                                                <HighlightText text={item.new_designation?.name} highlight={search} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.promotion_date)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.effective_date)}</td>
                                        <td className="px-6 py-4">
                                            {item.new_salary && Number(item.new_salary) !== 0
                                                ? <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{Number(item.new_salary).toLocaleString()}</span>
                                                : <span className="text-gray-400">—</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[item.status]?.className}`}>
                                                {t(item.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.document ? (
                                                <button 
                                                    type="button"
                                                    onClick={() => handleViewMedia(item.document, `${t('promotion_document_label', 'Promotion Document')} - ${item.employee?.full_name}`)}
                                                    className="w-8 h-8 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 dark:bg-rose-900/30 dark:border-rose-800 transition-colors hover:bg-rose-100" 
                                                    title={t('view_document_tooltip', 'View Document')}
                                                >
                                                    <IconFileText size={16} />
                                                </button>
                                            ) : <span className="w-8 h-8 flex items-center justify-center text-gray-300">-</span>}
                                        </td>
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
            {/* Promotion Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent
                    className="sm:max-w-[800px] w-[95vw] max-h-[90vh] h-auto flex flex-col p-2
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
                                    <IconBriefcase size={24} />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                                        {editingItem ? t('edit_promotion_title') : t('record_promotion_title')}
                                    </DialogTitle>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                                        {editingItem ? t('update_promotion_detail_desc') : t('fill_promotion_detail_desc')}
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
                            <form id="promotion-form" onSubmit={handleSubmit} className="p-6 space-y-8">
                                
                                {/* Block 1: Employee & Status */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <IconUserCircle size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('employee_info_title')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row gap-5">
                                        <div className="shrink-0 flex items-center justify-center">
                                            <Avatar className="h-16 w-16 rounded-full border-2 border-white dark:border-gray-800 shadow-lg">
                                                <AvatarImage src={selectedEmployee?.profile_image_url} alt="profile" className="object-cover" />
                                                <AvatarFallback className="rounded-full text-xl font-black bg-primary/10 text-primary uppercase">
                                                    {selectedEmployee?.full_name?.charAt(0) || '?'}
                                                </AvatarFallback>
                                            </Avatar>
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
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('status_label')} <span className="text-rose-500">*</span></Label>
                                                <Select onValueChange={(val) => handleSelectChange(val, 'status')} value={formData.status}>
                                                    <SelectTrigger className="h-11 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                        <SelectValue placeholder={t('select_status_placeholder')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">{t('pending')}</SelectItem>
                                                        <SelectItem value="approved">{t('approved')}</SelectItem>
                                                        <SelectItem value="rejected">{t('rejected')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Block 2: Designation Change */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                                            <IconHierarchy size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('designation_change_title')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row items-center gap-4">
                                        <div className="w-full space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('previous_designation_label')} <span className="text-rose-500">*</span></Label>
                                            <Select onValueChange={(val) => handleSelectChange(val, 'previous_designation_id')} value={String(formData.previous_designation_id)}>
                                                <SelectTrigger className="h-11 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                    <SelectValue placeholder={loading ? t('loading_label') : t('select_designation_placeholder')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {loading ? (
                                                        <SelectItem value="loading" disabled>{t('loading_label')}</SelectItem>
                                                    ) : designations.length === 0 ? (
                                                        <SelectItem value="empty" disabled>{t('no_designations_available_msg')}</SelectItem>
                                                    ) : (
                                                        designations.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        <div className="hidden md:flex items-center justify-center p-2 mt-4 bg-primary/10 text-primary rounded-full">
                                            <IconChevronRight size={18} />
                                        </div>

                                        <div className="w-full space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('new_designation_label')} <span className="text-rose-500">*</span></Label>
                                            <Select onValueChange={(val) => handleSelectChange(val, 'new_designation_id')} value={String(formData.new_designation_id)}>
                                                <SelectTrigger className="h-11 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                    <SelectValue placeholder={loading ? t('loading_label') : t('select_new_designation_placeholder')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {loading ? (
                                                        <SelectItem value="loading" disabled>{t('loading_label')}</SelectItem>
                                                    ) : designations.length === 0 ? (
                                                        <SelectItem value="empty" disabled>{t('no_designations_available_msg')}</SelectItem>
                                                    ) : (
                                                        designations.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </section>

                                {/* Block 3: Schedule & Compensation */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                            <IconCalendarTime size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('schedule_compensation_title')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('promotion_date_label')} <span className="text-rose-500">*</span></Label>
                                            <DatePicker
                                                value={formData.promotion_date}
                                                onChange={(d) => setFormData((prev: any) => ({ ...prev, promotion_date: toDateStr(d) }))}
                                                placeholder={t('select_promotion_date_placeholder')}
                                                className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('effective_date_label')} <span className="text-rose-500">*</span></Label>
                                            <DatePicker
                                                value={formData.effective_date}
                                                onChange={(d) => setFormData((prev: any) => ({ ...prev, effective_date: toDateStr(d) }))}
                                                placeholder={t('select_effective_date_placeholder')}
                                                className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('current_salary_label', 'Current Salary')}</Label>
                                            <div className="h-11 px-4 flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-800 text-slate-500 font-mono font-bold shadow-inner">
                                                <IconCash size={14} className="mr-2 opacity-50" />
                                                {selectedEmployee?.base_salary ? Number(selectedEmployee.base_salary).toLocaleString() : '0'}
                                            </div>
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('new_salary_label', 'New Salary')} <span className="text-rose-500">*</span></Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    name="new_salary"
                                                    value={formData.new_salary}
                                                    onChange={handleChange}
                                                    placeholder={t('new_salary_placeholder', 'Enter new salary')}
                                                    className="h-11 pl-8 font-mono font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                />
                                                <IconCash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            </div>
                                            {formData.new_salary && selectedEmployee?.base_salary && (
                                                <div className="text-[10px] px-1 font-black text-emerald-600 uppercase tracking-tight mt-1 flex items-center gap-1">
                                                    <IconArrowUpRight size={12} />
                                                    {t('increment_label', 'Increment')}: +{(Number(formData.new_salary) - Number(selectedEmployee.base_salary)).toLocaleString()} 
                                                    ({(((Number(formData.new_salary) - Number(selectedEmployee.base_salary)) / Number(selectedEmployee.base_salary)) * 100).toFixed(1)}%)
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                {/* Block 4: Reasoning */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                            <IconFileDescription size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('promotion_reason_label')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('promotion_reason_label')}</Label>
                                            <Textarea
                                                name="reason"
                                                value={formData.reason}
                                                onChange={handleChange}
                                                placeholder={t('promotion_reason_placeholder')}
                                                rows={3}
                                                className="min-h-[100px] font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none"
                                            />
                                        </div>
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

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('promotion_document_label')}</Label>
                                            <UniversalFilePicker
                                                value={formData.document}
                                                onChange={(val) => handleSelectChange(val, 'document')}
                                                accept="image/*,application/pdf"
                                                description={t('upload_select_pdf_image_label')}
                                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
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
                                    form="promotion-form"
                                    disabled={isSaving}
                                    className="flex-1 sm:flex-none h-10 px-8 gap-2 font-black shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px]"
                                >
                                    {isSaving ? <IconLoader2 className="animate-spin" size={16} /> : <IconDeviceFloppy size={16} />}
                                    {isSaving ? t('processing_label') : (editingItem ? t('save_changes_btn_label') : t('record_promotion_btn'))}
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
                title={t('delete_promotion_title')}
                message={t('delete_promotion_confirm')}
            />

            {/* Global Table Preview Modals */}
            <ImagePreviewModal 
                open={imagePreviewOpen} 
                onOpenChange={setImagePreviewOpen} 
                src={previewUrl} 
                title={previewTitle} 
            />
            <PDFPreviewModal 
                open={pdfPreviewOpen} 
                onOpenChange={setPdfPreviewOpen} 
                url={previewUrl} 
                title={previewTitle} 
            />
        </div>
    );
};

export default PromotionIndex;
