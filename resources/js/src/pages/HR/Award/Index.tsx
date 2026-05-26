import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
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
import { 
    IconTrophy, 
    IconFileText, 
    IconPhoto, 
    IconX, 
    IconDeviceFloppy, 
    IconLoader2, 
    IconInfoCircle, 
    IconUsers, 
    IconCalendarEvent, 
    IconMessage2, 
    IconFiles,
    IconGift
} from '@tabler/icons-react';
import HighlightText from '@/components/ui/HighlightText';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

// Shared Components
import { UniversalFilePicker } from '@/components/ui/universal-file-picker';
import { ImagePreviewModal } from '../../../components/ui/image-preview-modal';
import { PDFPreviewModal } from '../../../components/ui/pdf-preview-modal';

const toDateStr = (d: Date | undefined) => d ? d.toISOString().split('T')[0] : '';

const AwardIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [awards, setAwards] = useState<any[]>([]);
    const [awardTypes, setAwardTypes] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);

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
    const [sortBy, setSortBy] = useState('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const initialFormState = {
        employee_id: '',
        award_type_id: '',
        date: new Date().toISOString().split('T')[0],
        gift: '',
        description: '',
        certificate: null as string | File | null,
        photo: null as string | File | null,
    };
    const [formData, setFormData] = useState<any>(initialFormState);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    useEffect(() => {
        dispatch(setPageTitle(t('awards_title')));
    }, [dispatch, t]);

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            fetch('/api/hr/awards', { headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' }).then(res => res.json()),
            fetch('/api/hr/award-types?compact=true', { headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' }).then(res => res.json()),
            fetch('/api/hr/employees?compact=true', { headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' }).then(res => res.json())
        ]).then(([awardsData, typesData, employeesData]) => {
            if (Array.isArray(awardsData)) setAwards(awardsData);
            if (Array.isArray(typesData)) setAwardTypes(typesData);
            if (Array.isArray(employeesData)) setEmployees(employeesData);
            setLoading(false);
        }).catch(err => {
            console.error(err);
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
            employee_id: item.employee_id,
            award_type_id: item.award_type_id,
            date: item.date,
            gift: item.gift || '',
            description: item.description || '',
            certificate: item.certificate_url || '',
            photo: item.photo_url || '',
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
            const response = await fetch(`/api/hr/awards/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
            });
            if (response.ok) {
                toast.success(t('award_deleted_msg'));
                fetchData();
            } else {
                toast.error(t('failed_delete_award_msg'));
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
        setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectChange = (value: any, name: string) => {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        // Use FormData for multipart support
        const data = new FormData();
        data.append('employee_id', String(formData.employee_id || ''));
        data.append('award_type_id', String(formData.award_type_id || ''));
        data.append('date', formData.date || '');
        data.append('gift', formData.gift || '');
        data.append('description', formData.description || '');
        
        // Handle files/media with clearing support (send empty string for null)
        if (formData.certificate instanceof File) {
            data.append('certificate', formData.certificate);
        } else {
            data.append('certificate', formData.certificate || '');
        }

        if (formData.photo instanceof File) {
            data.append('photo', formData.photo);
        } else {
            data.append('photo', formData.photo || '');
        }

        // Handle PUT method via POST spoofing for multipart compatibility
        const url = editingItem ? `/api/hr/awards/${editingItem.id}` : '/api/hr/awards';
        if (editingItem) {
            data.append('_method', 'PUT');
        }

        try {
            const response = await fetch(url, {
                method: 'POST', // Always POST for FormData with files
                headers: {
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
                body: data,
            });
            const result = await response.json();
            if (response.ok) {
                toast.success(`${t('awards_title')} ${editingItem ? t('update') : t('create')}`);
                setModalOpen(false);
                fetchData();
            } else {
                toast.error(result.message || t('failed_save_award_msg'));
            }
        } catch (error) {
            console.error('Submit Error:', error);
            toast.error('An error occurred while saving the award');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSort = (column: string) => {
        if (sortBy === column) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortBy(column); setSortDirection('asc'); }
    };

    const filteredItem = useMemo(() => {
        if (!search) return awards;
        const lowerSearch = search.toLowerCase();
        return awards.filter(item =>
            item.employee?.full_name?.toLowerCase().includes(lowerSearch) ||
            item.award_type?.name?.toLowerCase().includes(lowerSearch) ||
            (item.gift && item.gift.toLowerCase().includes(lowerSearch))
        );
    }, [awards, search]);

    const sortedItems = useMemo(() => {
        return [...filteredItem].sort((a, b) => {
            let aVal = a[sortBy]; let bVal = b[sortBy];
            if (sortBy === 'employee.full_name') { aVal = a.employee?.full_name; bVal = b.employee?.full_name; }
            if (sortBy === 'award_type.name') { aVal = a.award_type?.name; bVal = b.award_type?.name; }

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

    const employeeOptions = useMemo(() => {
        return employees.map(emp => ({ value: emp.id, label: `${emp.full_name} (${emp.employee_id})` }));
    }, [employees]);

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
        
        // Improved detection: check base URL and query parameters
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

        if (isPdf) {
            setPdfPreviewOpen(true);
        } else {
            setImagePreviewOpen(true);
        }
    };

    return (
        <div>
            <FilterBar
                icon={<IconTrophy className="w-6 h-6 text-primary" />}
                title={t('awards_title')}
                description={t('awards_desc')}
                placeholder={t('search_keywords')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                onAdd={handleCreate}
                addLabel={t('awards_give')}
                onRefresh={fetchData}
            />

                    {loading ? (
                        <TableSkeleton columns={7} rows={5} />
                    ) : sortedItems.length === 0 ? (
                        <EmptyState
                            isSearch={!!search}
                            searchTerm={search}
                            onClearFilter={() => setSearch('')}
                            title={t('no_awards_found_title')}
                            description={t('assign_award_desc')}
                            actionLabel={t('awards_give')}
                            onAction={handleCreate}
                        />
                    ) : (
            <div className="table-responsive bg-white dark:bg-black rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="border-b dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-4">#</th>
                                    <SortableHeader label={t('employee_label')} value="employee.full_name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label={t('award_type_label')} value="award_type.name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label={t('date_label')} value="date" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label={t('gift_label')} value="gift" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th className="px-6 py-4">{t('media_label')}</th>
                                    <th className="px-6 py-4 text-right">{t('actions_label')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-100/10">
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
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                            <HighlightText text={item.award_type?.name || t('unknown_label')} highlight={search} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(item.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 max-w-[150px] truncate">
                                            <HighlightText text={item.gift} highlight={search} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {item.certificate_url ? (
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleViewMedia(item.certificate_url, `${t('certificate_document_label')} - ${item.employee?.full_name}`)}
                                                        className="w-8 h-8 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center border border-rose  -100 dark:bg-rose-900/30 dark:border-rose-800 transition-colors hover:bg-rose-100" 
                                                        title={t('view_certificate_tooltip')}
                                                    >
                                                        <IconFileText size={16} />
                                                    </button>
                                                ) : <span className="w-8 h-8 flex items-center justify-center text-gray-300">-</span>}
                                                {item.photo_url ? (
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleViewMedia(item.photo_url, `${t('event_photo_label')} - ${item.employee?.full_name}`)}
                                                        className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800 transition-colors hover:bg-emerald-100" 
                                                        title={t('view_photo_tooltip')}
                                                    >
                                                        <IconPhoto size={16} />
                                                    </button>
                                                ) : <span className="w-8 h-8 flex items-center justify-center text-gray-300">-</span>}
                                            </div>
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
            {/* Award Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent
                    className="sm:max-w-[800px] w-[95vw] max-h-[95vh] h-auto flex flex-col p-2
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
                                    <IconTrophy size={24} />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                                        {editingItem ? t('edit_award_title') : t('grant_award_title')}
                                    </DialogTitle>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                                        {editingItem ? t('update_award_detail_desc') : t('fill_award_detail_desc')}
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
                            <form id="award-form" onSubmit={handleSubmit} className="p-6 space-y-8">
                                
                                {/* Block 1: Stakeholders */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <IconUsers size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('award_info_title', 'Stakeholders')}</h3>
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
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('award_type_label')} <span className="text-rose-500">*</span></Label>
                                                <Select onValueChange={(val) => handleSelectChange(val, 'award_type_id')} value={String(formData.award_type_id)}>
                                                    <SelectTrigger className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                        <SelectValue placeholder={t('select_award_type_placeholder')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {loading ? (
                                                            <SelectItem value="loading" disabled>{t('loading_label')}</SelectItem>
                                                        ) : awardTypes.length === 0 ? (
                                                            <SelectItem value="empty" disabled>{t('no_award_types_available_msg')}</SelectItem>
                                                        ) : (
                                                            awardTypes.map(type => <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>)
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Block 2: Award Details */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                            <IconCalendarEvent size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('award_details_title', 'Award Details')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-0">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('date_selected_label')} <span className="text-rose-500">*</span></Label>
                                            <DatePicker
                                                value={formData.date}
                                                onChange={(d) => setFormData((prev: any) => ({ ...prev, date: toDateStr(d) }))}
                                                placeholder={t('select_award_date_placeholder')}
                                                className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('gift_item_label')}</Label>
                                            <div className="relative">
                                                <IconGift size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <Input 
                                                    name="gift" 
                                                    value={formData.gift} 
                                                    onChange={handleChange} 
                                                    placeholder={t('gift_placeholder')} 
                                                    className="pl-11 h-11 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Block 3: Citation */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                            <IconMessage2 size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('citation_description_label', 'Citation')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                        <Textarea 
                                            name="description" 
                                            value={formData.description} 
                                            onChange={handleChange} 
                                            placeholder={t('award_reason_placeholder')} 
                                            rows={3} 
                                            className="min-h-[100px] font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none" 
                                        />
                                    </div>
                                </section>

                                {/* Block 4: Media Attachments */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                                            <IconFiles size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('media_attachments_title')}</h3>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('certificate_document_label')}</Label>
                                            <UniversalFilePicker
                                                value={formData.certificate}
                                                onChange={(val) => handleSelectChange(val, 'certificate')}
                                                accept="image/*,application/pdf"
                                                description={t('upload_select_pdf_image_label')}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('event_photo_label')}</Label>
                                            <UniversalFilePicker
                                                value={formData.photo}
                                                onChange={(val) => handleSelectChange(val, 'photo')}
                                                accept="image/*"
                                                description={t('upload_select_image_label')}
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
                                    form="award-form"
                                    disabled={isSaving}
                                    className="flex-1 sm:flex-none h-10 px-8 gap-2 font-black shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px]"
                                >
                                    {isSaving ? <IconLoader2 className="animate-spin" size={16} /> : <IconDeviceFloppy size={16} />}
                                    {isSaving ? t('processing_label') : (editingItem ? t('save_changes_btn_label') : t('grant_award_btn'))}
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
                title={t('delete_award_title')}
                message={t('delete_award_confirm')}
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

export default AwardIndex;
