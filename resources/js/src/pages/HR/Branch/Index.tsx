import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import PerfectScrollbar from 'react-perfect-scrollbar';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { Badge } from '../../../components/ui/badge';
import { 
    IconBuilding, 
    IconX, 
    IconDeviceFloppy, 
    IconLoader2, 
    IconInfoCircle, 
    IconMapPin, 
    IconPhone, 
    IconMail, 
    IconBrandTelegram, 
    IconSettings, 
    IconHash, 
    IconSignature,
    IconPower,
    IconWorld,
    IconFlag,
    IconSmartHome
} from '@tabler/icons-react';
import { Switch } from '../../../components/ui/switch';
import HighlightText from '@/components/ui/HighlightText';
import { useTranslation } from 'react-i18next';

const BranchIndex = () => {
    const { t } = useTranslation();
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<any>(null);
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
        code: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zip_code: '',
        phone: '',
        email: '',
        telegram_chat_id: '',
        telegram_topic_id: '',
        status: 'active',
    };

    const [formData, setFormData] = useState(initialFormState);

    const fetchBranches = () => {
        setLoading(true);
        fetch('/api/hr/branches', {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
            },
            credentials: 'include',
        })
            .then(res => {
                if (res.status === 401) {
                    window.location.href = '/login';
                    return null;
                }
                return res.json();
            })
            .then(data => {
                if (!data) return; // Handle 401 redirect case
                if (Array.isArray(data)) {
                    setBranches(data);
                } else if (data && Array.isArray(data.data)) {
                    setBranches(data.data);
                } else {
                    console.error('API response is not an array:', data);
                    setBranches([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Fetch error:', err);
                setBranches([]);
                setLoading(false);
            });
    };

    // Helper to get cookie
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const handleCreate = () => {
        setEditingBranch(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (branch: any) => {
        setEditingBranch(branch);
        setFormData({
            name: branch.name,
            code: branch.code,
            address: branch.address,
            city: branch.city,
            state: branch.state || '',
            country: branch.country,
            zip_code: branch.zip_code || '',
            phone: branch.phone || '',
            email: branch.email || '',
            status: branch.status,
            telegram_chat_id: branch.telegram_chat_id || '',
            telegram_topic_id: branch.telegram_topic_id || '',
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
            const response = await fetch(`/api/hr/branches/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
            });

            if (response.ok) {
                toast.success(t('success_delete_branch'));
                fetchBranches();
            } else {
                toast.error(t('failed_delete_branch'));
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

    const handleSelectChange = (value: string, name: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const url = editingBranch ? `/api/hr/branches/${editingBranch.id}` : '/api/hr/branches';
        const method = editingBranch ? 'PUT' : 'POST';

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
                toast.success(editingBranch ? t('success_update_branch') : t('success_create_branch'));
                setModalOpen(false);
                fetchBranches();
            } else {
                if (response.status === 401) {
                    window.location.href = '/login';
                }
                toast.error(data.message || (editingBranch ? t('failed_update_branch') : t('failed_create_branch')));
            }
        } catch (error) {
            console.error(error);
            toast.error(t('error_occurred'));
        } finally {
            setIsSaving(false);
        }
    };

    // Derived state for table
    const filteredAndSortedBranches = useMemo(() => {
        let result = [...branches];

        // Search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(b =>
                b.name?.toLowerCase().includes(q) ||
                b.code?.toLowerCase().includes(q) ||
                b.city?.toLowerCase().includes(q)
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
    }, [branches, search, sortBy, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedBranches.length / itemsPerPage);
    const paginatedBranches = filteredAndSortedBranches.slice(
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
                icon={<IconBuilding className="w-6 h-6 text-primary" />}
                title={t('branch_title')}
                description={t('branch_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={handleCreate}
                addLabel={t('add_branch')}
                onRefresh={fetchBranches}
                hasActiveFilters={sortBy !== 'name' || sortDirection !== 'asc'}
                onClearFilters={() => {
                    setSortBy('name');
                    setSortDirection('asc');
                }}
            />

            {loading ? (
                <TableSkeleton columns={5} rows={5} />
            ) : branches.length === 0 ? (
                <EmptyState
                    title={t('no_branches_found')}
                    description={t('start_adding_branch_desc')}
                    actionLabel={t('add_branch')}
                    onAction={handleCreate}
                />
            ) : filteredAndSortedBranches.length === 0 ? (
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
                            <table className="w-full text-sm table-hover table">
                                <thead className="border-b dark:border-gray-600">
                                    <tr>
                                        <th>#</th>
                                        <SortableHeader label={t('name_label')} value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                        <SortableHeader label={t('code_label')} value="code" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                        <SortableHeader label={t('city_label')} value="city" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                        <SortableHeader label={t('status_label')} value="status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                        <th className="text-right">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedBranches.map((branch: any, index: number) => (
                                        <tr key={branch.id}>
                                            <td className="text-start text-gray-400 text-xs font-medium">
                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                            </td>
                                            <td className="whitespace-nowrap font-medium">
                                                <HighlightText text={branch.name} highlight={search} />
                                            </td>
                                            <td>
                                                <HighlightText text={branch.code} highlight={search} />
                                            </td>
                                            <td>
                                                <HighlightText text={branch.city} highlight={search} />
                                            </td>
                                            <td>
                                                <Badge 
                                                dot={true}
                                                size='sm'
                                                variant={branch.status === 'active' ? 'success' : 'destructive'}>
                                                    {branch.status === 'active' ? t('active') : t('inactive')}
                                                </Badge>
                                            </td>
                                            <td>
                                                <ActionButtons skipDeleteConfirm={true}
                                                    onEdit={() => handleEdit(branch)}
                                                    onDelete={() => confirmDelete(branch.id)}
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
                                    totalItems={filteredAndSortedBranches.length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={setCurrentPage}
                                />
                            
                </div>
            )}

            {/* Branch Modal */}
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
                                    <IconBuilding size={24} />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                                        {editingBranch ? t('edit_branch_title') : t('create_branch_title')}
                                    </DialogTitle>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                                        {editingBranch ? t('update_branch_detail_desc') : t('fill_branch_detail_desc')}
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
                            <form id="branch-form" onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                
                                <div className="space-y-8">
                                    {/* Block 1: Branch Identity */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                <IconSignature size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('basic_info_title', 'Branch Identity')}</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-5">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('branch_name_label')} <span className="text-rose-500">*</span></Label>
                                                <Input
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder={t('branch_name_placeholder')}
                                                    className="h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('branch_code_label')} <span className="text-rose-500">*</span></Label>
                                                <div className="relative">
                                                    <IconHash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <Input
                                                        name="code"
                                                        value={formData.code}
                                                        onChange={handleChange}
                                                        required
                                                        placeholder={t('branch_code_placeholder')}
                                                        className="pl-11 h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 uppercase"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Block 2: Location Details */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                                <IconMapPin size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('location_details_title', 'Location Details')}</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-5">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('address_label')} <span className="text-rose-500">*</span></Label>
                                                <div className="relative">
                                                    <IconSmartHome size={18} className="absolute left-4 top-3 text-slate-400" />
                                                    <Textarea
                                                        name="address"
                                                        value={formData.address}
                                                        onChange={handleChange}
                                                        placeholder={t('street_address_placeholder')}
                                                        required
                                                        className="min-h-[80px] pl-11 pt-3 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('city_label')} <span className="text-rose-500">*</span></Label>
                                                    <Input
                                                        name="city"
                                                        value={formData.city}
                                                        onChange={handleChange}
                                                        required
                                                        placeholder={t('city_placeholder')}
                                                        className="h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('state_province_label')}</Label>
                                                    <Input
                                                        name="state"
                                                        value={formData.state}
                                                        onChange={handleChange}
                                                        placeholder={t('state_placeholder')}
                                                        className="h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('country_label')} <span className="text-rose-500">*</span></Label>
                                                    <div className="relative">
                                                        <IconWorld size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <Input
                                                            name="country"
                                                            value={formData.country}
                                                            onChange={handleChange}
                                                            required
                                                            placeholder={t('country_placeholder')}
                                                            className="pl-11 h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('zip_postal_code_label')}</Label>
                                                    <Input
                                                        name="zip_code"
                                                        value={formData.zip_code}
                                                        onChange={handleChange}
                                                        placeholder={t('zip_placeholder')}
                                                        className="h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div className="space-y-8">
                                    {/* Block 3: Contact Information */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                                <IconPhone size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('contact_info_title', 'Communication')}</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-5">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('phone_number_label')}</Label>
                                                <div className="relative">
                                                    <IconPhone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <Input
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleChange}
                                                        placeholder={t('phone_placeholder')}
                                                        className="pl-11 h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('email_address_label')}</Label>
                                                <div className="relative">
                                                    <IconMail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <Input
                                                        name="email"
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        placeholder={t('email_placeholder')}
                                                        className="pl-11 h-11 font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Block 4: Settings & Integration */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                                <IconSettings size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('status_notifications_title', 'Settings & Integration')}</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-5">
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/50">
                                                <div className="space-y-0.5">
                                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('status_label', 'Branch Status')}</Label>
                                                    <p className="text-[10px] text-slate-500 font-medium">{t('toggle_availability_desc', 'Enable or disable this branch location')}</p>
                                                </div>
                                                <Switch
                                                    checked={formData.status === 'active'}
                                                    onCheckedChange={(v) => handleSelectChange(v ? 'active' : 'inactive', 'status')}
                                                />
                                            </div>

                                            <div className="space-y-4 pt-2">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    <IconBrandTelegram size={14} className="text-blue-500" />
                                                    {t('telegram_integration_label', 'Telegram Integration')}
                                                </div>
                                                
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('telegram_chat_id_label')} <span className="text-gray-400 text-[9px] lowercase font-medium">({t('optional_label')})</span></Label>
                                                        <Input
                                                            name="telegram_chat_id"
                                                            value={formData.telegram_chat_id}
                                                            onChange={handleChange}
                                                            placeholder={t('telegram_chat_id_placeholder')}
                                                            className="h-10 text-xs font-mono bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('telegram_topic_id_label')} <span className="text-gray-400 text-[9px] lowercase font-medium">({t('optional_label')})</span></Label>
                                                        <Input
                                                            name="telegram_topic_id"
                                                            value={formData.telegram_topic_id}
                                                            onChange={handleChange}
                                                            placeholder={t('telegram_topic_id_placeholder')}
                                                            className="h-10 text-xs font-mono bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                        />
                                                    </div>
                                                </div>
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
                                    form="branch-form"
                                    disabled={isSaving}
                                    className="flex-1 sm:flex-none h-10 px-8 gap-2 font-black shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px]"
                                >
                                    {isSaving ? <IconLoader2 className="animate-spin" size={16} /> : <IconDeviceFloppy size={16} />}
                                    {isSaving ? t('saving_dots') : (editingBranch ? t('save_changes_btn_label') : t('create_branch_btn_label'))}
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
                title={t('delete_branch_title')}
                message={t('delete_branch_message')}
            />
        </div>
    );
};

export default BranchIndex;
