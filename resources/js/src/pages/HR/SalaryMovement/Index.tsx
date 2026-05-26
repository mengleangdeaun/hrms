import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useFormatDate } from '../../../hooks/useFormatDate';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { IconCash, IconPlus, IconRefresh, IconUser, IconCalendar, IconChartBar, IconCheck, IconX, IconClock, IconUserCircle, IconFileDescription, IconLoader2, IconDeviceFloppy } from '@tabler/icons-react';
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
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import HighlightText from '@/components/ui/HighlightText';
import { Label } from '../../../components/ui/label';
import { motion, Variants } from 'framer-motion';
import { 
    IconTrendingUp, 
    IconSignature, 
    IconAlertCircle, 
    IconArrowUpRight, 
    IconClockHour4,
    IconCurrencyDollar,
    IconHistory,
    IconArrowsDiff,
    IconWallet
} from '@tabler/icons-react';

const toDateStr = (d: Date | undefined) => {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const typeConfig: Record<string, { label: string; className: string }> = {
    increment: { label: 'Increment', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    promotion: { label: 'Promotion', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    initial: { label: 'Initial', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
    adjustment: { label: 'Adjustment', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
};

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: IconClock },
    approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: IconCheck },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: IconX },
};

const SalaryMovementIndex = () => {
    const { t } = useTranslation();
    const { formatDate } = useFormatDate();
    const dispatch = useDispatch();
    const [movements, setMovements] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const initialFormState = {
        employee_id: '',
        new_salary: '',
        effective_date: new Date().toISOString().split('T')[0],
        type: 'increment',
        reason: '',
        status: 'pending',
    };
    const [formData, setFormData] = useState<any>(initialFormState);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    useEffect(() => {
        dispatch(setPageTitle(t('salary_movements_title', 'Salary Movements')));
    }, [dispatch, t]);

    const fetchData = () => {
        setLoading(true);
        const queryParams = new URLSearchParams({
            page: String(currentPage),
            per_page: String(itemsPerPage),
            search: search,
        });

        Promise.all([
            fetch(`/api/hr/salary-movements?${queryParams.toString()}`, { headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' }).then(r => r.json()),
            fetch('/api/hr/employees?compact=true', { headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' }).then(r => r.json()),
        ]).then(([movementsResp, employeesData]) => {
            if (movementsResp && movementsResp.data) {
                setMovements(movementsResp.data);
                setTotalItems(movementsResp.total);
                setTotalPages(movementsResp.last_page);
            }
            if (Array.isArray(employeesData)) setEmployees(employeesData);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    };

    // Fetch data when page or items per page changes
    useEffect(() => {
        fetchData();
    }, [currentPage, itemsPerPage]);

    // Search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1); // Reset to first page on search
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const selectedEmployee = useMemo(() => {
        if (!formData.employee_id) return null;
        return employees.find(e => String(e.id) === String(formData.employee_id));
    }, [formData.employee_id, employees]);

    const handleCreate = () => {
        setEditingItem(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setFormData({
            employee_id: item.employee_id,
            new_salary: item.new_salary,
            effective_date: item.effective_date,
            type: item.type,
            reason: item.reason || '',
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
            const response = await fetch(`/api/hr/salary-movements/${itemToDelete}`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
            });
            if (response.ok) {
                toast.success(t('salary_movement_deleted_msg', 'Salary movement deleted successfully'));
                fetchData();
            } else {
                toast.error(t('failed_delete_salary_movement_msg', 'Failed to delete salary movement'));
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

        const url = editingItem ? `/api/hr/salary-movements/${editingItem.id}` : '/api/hr/salary-movements';
        const method = editingItem ? 'PUT' : 'POST';

        try {
            await fetch('/sanctum/csrf-cookie');
            const response = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json', 
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' 
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });
            
            const responseData = await response.json();
            if (response.ok) {
                toast.success(`Salary movement ${editingItem ? 'updated' : 'recorded'} successfully`);
                setModalOpen(false);
                fetchData();
            } else {
                const firstError = responseData.errors ? Object.values(responseData.errors)[0] : responseData.message;
                toast.error(Array.isArray(firstError) ? firstError[0] : firstError || 'Failed to save salary movement');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const employeeOptions = useMemo(() =>
        employees.map(e => ({ value: e.id, label: `${e.full_name} (${e.employee_id})` }))
        , [employees]);

    // Summary Calculations
    const totalIncrements = useMemo(() => 
        movements.filter(m => m.status === 'approved').reduce((acc, curr) => acc + Number(curr.increment_amount || 0), 0)
    , [movements]);

    const pendingMovements = useMemo(() => 
        movements.filter(m => m.status === 'pending').length
    , [movements]);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const statsData = [
        {
            title: t('total_increments_label', 'Total Increments'),
            value: `$ ${totalIncrements.toLocaleString()}`,
            icon: <IconTrendingUp />,
            color: 'success',
            desc: t('total_increments_desc', 'Total value of all approved salary increases.')
        },
        {
            title: t('pending_movements_label', 'Pending Tasks'),
            value: String(pendingMovements),
            icon: <IconClockHour4 />,
            color: 'warning',
            desc: t('pending_movements_desc', 'Salary movements currently awaiting approval.')
        },
        {
            title: t('total_movements_label', 'Total Movements'),
            value: String(totalItems),
            icon: <IconHistory />,
            color: 'primary',
            desc: t('total_movements_desc', 'Complete history of all compensation records.')
        }
    ];

    return (
        <div className="space-y-6">
            <FilterBar
                icon={<IconCash className="w-6 h-6 text-primary" />}
                title={t('salary_movements_title', 'Salary Movements')}
                description={t('salary_movements_desc', 'Track and manage employee compensation history and adjustments.')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                onAdd={handleCreate}
                addLabel={t('add_movement_btn', 'Add Movement')}
                onRefresh={fetchData}
            />

            {/* Quick Stats */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
                {statsData.map((stat, index) => (
                    <motion.div 
                        key={index}
                        variants={itemVariants}
                        className="panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl bg-${stat.color}/10 text-${stat.color}`}>
                                {stat.icon}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1 truncate">{stat.title}</h4>
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-extrabold text-slate-900 dark:text-white truncate">
                                        {stat.value}
                                    </span>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 font-medium">{stat.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {loading ? (
                <TableSkeleton columns={7} rows={5} />
            ) : movements.length === 0 ? (
                <EmptyState
                    isSearch={!!search}
                    searchTerm={search}
                    onClearFilter={() => setSearch('')}
                    title={t('no_salary_movements_found', 'No movements found')}
                    description={t('add_salary_movement_desc', 'Start recording employee salary changes to keep a clear audit history.')}
                    actionLabel={t('add_movement_btn', 'Add Movement')}
                    onAction={handleCreate}
                />
            ) : (
                <div className="table-responsive bg-white dark:bg-black rounded-lg border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full table-hover text-left">
                            <thead className="border-b dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-4">#</th>
                                    <th className="px-6 py-4">{t('employee_label')}</th>
                                    <th className="px-6 py-4 text-center">{t('type_label', 'Type')}</th>
                                    <th className="px-6 py-4">{t('previous_salary_label', 'Prev Salary')}</th>
                                    <th className="px-6 py-4">{t('new_salary_label', 'New Salary')}</th>
                                    <th className="px-6 py-4">{t('increment_label', 'Increment')}</th>
                                    <th className="px-6 py-4">{t('effective_date_label')}</th>
                                    <th className="px-6 py-4">{t('status_label')}</th>
                                    <th className="px-6 py-4 text-right">{t('actions_label')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {movements.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 text-gray-400 text-xs">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 rounded-full border shadow-sm">
                                                    <AvatarImage src={item.employee?.profile_image_url} alt={item.employee?.full_name} className="object-cover" />
                                                    <AvatarFallback className="rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase">
                                                        {item.employee?.full_name?.charAt(0) || '?'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">
                                                        <HighlightText text={item.employee?.full_name} highlight={search} />
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        <HighlightText text={item.employee?.employee_id} highlight={search} />
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${typeConfig[item.type]?.className}`}>
                                                {t(item.type)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-gray-500 text-sm">
                                            {Number(item.previous_salary).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-gray-900 dark:text-white font-bold text-sm">
                                            {Number(item.new_salary).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-mono font-bold text-xs ${Number(item.increment_amount) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {Number(item.increment_amount) >= 0 ? '+' : ''}{Number(item.increment_amount).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                            {formatDate(item.effective_date)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[item.status]?.className}`}>
                                                {(() => {
                                                    const StatusIcon = statusConfig[item.status]?.icon;
                                                    return StatusIcon ? <StatusIcon size={12} /> : null;
                                                })()}
                                                {t(item.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ActionButtons skipDeleteConfirm={true} onEdit={() => handleEdit(item)} onDelete={() => confirmDelete(item.id)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />

            {/* Create/Edit Movement Dialog */}
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
                                    <IconCash size={24} />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                                        {editingItem ? t('edit_salary_movement', 'Edit Salary Movement') : t('record_salary_movement', 'Record Salary Movement')}
                                    </DialogTitle>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                                        {t('salary_movement_modal_desc', 'Track and manage compensation changes with automated processing.')}
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
                            <form id="movement-form" onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                
                                <div className="space-y-8">
                                    {/* Block 1: Movement Identity */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                <IconUserCircle size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('movement_identity_title', 'Movement Identity')}</h3>
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
                                                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                    />
                                                </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('type_label')} <span className="text-rose-500">*</span></Label>
                                                    <Select onValueChange={(val) => handleSelectChange(val, 'type')} value={formData.type}>
                                                        <SelectTrigger className="h-11 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="increment">{t('increment', 'Increment')}</SelectItem>
                                                            <SelectItem value="adjustment">{t('adjustment', 'Adjustment')}</SelectItem>
                                                            <SelectItem value="promotion">{t('promotion', 'Promotion')}</SelectItem>
                                                            <SelectItem value="initial">{t('initial', 'Initial')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('status_label')} <span className="text-rose-500">*</span></Label>
                                                    <Select onValueChange={(val) => handleSelectChange(val, 'status')} value={formData.status}>
                                                        <SelectTrigger className="h-11 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                            <SelectValue />
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
                                    </div>
                                    </section>

                                    {/* Block 2: Timeline */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                                                <IconCalendar size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('timeline_title', 'Timeline')}</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('effective_date_label')} <span className="text-rose-500">*</span></Label>
                                                <DatePicker
                                                    value={formData.effective_date}
                                                    onChange={(d) => setFormData((prev: any) => ({ ...prev, effective_date: toDateStr(d) }))}
                                                    className="bg-white h-11 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                />
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div className="space-y-8">
                                    {/* Block 3: Compensation Details */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                                <IconCurrencyDollar size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('compensation_details_title', 'Compensation')}</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-5">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('current_salary_label')}</Label>
                                                <div className="relative">
                                                    <IconArrowUpRight size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <Input
                                                        value={selectedEmployee?.base_salary ? Number(selectedEmployee.base_salary).toLocaleString() : '0'}
                                                        readOnly
                                                        className="pl-11 h-11 font-black bg-slate-100/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1">{t('new_salary_label')} <span className="text-rose-500">*</span></Label>
                                                <div className="relative">
                                                    <IconCurrencyDollar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                                                    <Input
                                                        type="number"
                                                        name="new_salary"
                                                        value={formData.new_salary}
                                                        onChange={handleChange}
                                                        placeholder="0.00"
                                                        className="pl-11 h-11 font-black bg-white dark:bg-slate-900 border-primary/30 text-primary text-lg focus-visible:ring-primary/20"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Block 4: Additional Details */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                                <IconFileDescription size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('reason_label')}</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t('reason_label')}</Label>
                                                <Textarea
                                                    name="reason"
                                                    value={formData.reason}
                                                    onChange={handleChange}
                                                    placeholder={t('reason_placeholder')}
                                                    rows={3}
                                                    className="min-h-[100px] font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none pt-3"
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
                                    <IconAlertCircle size={12} className="text-primary" />
                                    {t('mandatory_fields_info')}
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
                                    form="movement-form"
                                    disabled={isSaving}
                                    className="flex-1 sm:flex-none h-10 px-8 gap-2 font-black shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px]"
                                >
                                    {isSaving ? <IconLoader2 className="animate-spin" size={16} /> : <IconDeviceFloppy size={16} />}
                                    {isSaving ? t('saving_dots') : (editingItem ? t('update_record_btn', 'Update Record') : t('record_movement_btn', 'Record Movement'))}
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
                title={t('delete_salary_movement', 'Delete Salary Movement')}
                message={t('delete_salary_movement_confirm', 'Are you sure you want to delete this salary record? This will not affect the employee\'s current salary if it has already been applied.')}
            />
        </div>
    );
};

export default SalaryMovementIndex;
