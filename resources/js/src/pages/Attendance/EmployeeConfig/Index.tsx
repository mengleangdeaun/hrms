import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import ActionButtons from '../../../components/ui/ActionButtons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import PerfectScrollbar from 'react-perfect-scrollbar';
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from '@/components/ui/avatar';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import {
    IconCalendarStats,
    IconSettings,
    IconQrcode,
    IconUser,
    IconBrandTelegram,
    IconCopy,
    IconDownload,
    IconFileTypePdf,
    IconCheck,
    IconUserCog,
    IconAlertTriangle,
} from '@tabler/icons-react';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import api from '@/utils/api';
import { 
    useHREmployeeConfigs, 
    useWorkingShifts, 
    useHRAttendancePolicies, 
    useHRAttendanceUpdateEmployeeConfig, 
    useHRAttendanceEmployeeQr,
    useHRFilterEmployees
} from '@/hooks/useHRData';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

const EmployeeConfigIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Filter & Sort & Pagination state
    const [search, setSearch] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | number | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('full_name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Edit Modal States
    const [activeEmployee, setActiveEmployee] = useState<any>(null);
    const [editModalType, setEditModalType] = useState<'shift' | 'policy' | 'status' | 'telegram' | null>(null);
    const [deviceResetModalOpen, setDeviceResetModalOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [lineManagerId, setLineManagerId] = useState<string | number | null>(null);

    // QR Modal State
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrData, setQrData] = useState<any>(null);
    const [isCopying, setIsCopying] = useState(false);
    const [isDownloadingPng, setIsDownloadingPng] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [isBatchDownloading, setIsBatchDownloading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [branding, setBranding] = useState<any>(null);
    const qrRef = useRef<HTMLDivElement>(null);
    const qrCodeOnlyRef = useRef<HTMLDivElement>(null);
    const qrExportRef = useRef<HTMLDivElement>(null);
    const pdfTemplateRef = useRef<HTMLDivElement>(null);

    // TanStack Query Hooks
    const { data: employeeConfigs = [], isLoading: loadingConfigs } = useHREmployeeConfigs();
    const { data: workingShifts = [], isLoading: loadingShifts } = useWorkingShifts();
    const { data: attendancePolicies = [], isLoading: loadingPolicies } = useHRAttendancePolicies();
    
    const updateConfigMutation = useHRAttendanceUpdateEmployeeConfig();
    const generateQrMutation = useHRAttendanceEmployeeQr();
    const { data: allEmployees = [], isLoading: loadingEmployees } = useHRFilterEmployees(true);

    const isUpdating = updateConfigMutation.isPending;
    const loadingQr = generateQrMutation.isPending;
    
    const rawLoading = loadingConfigs || loadingShifts || loadingPolicies;
    const loading = useDelayedLoading(rawLoading, 500);

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['attendance-employee-configs'] });
        queryClient.invalidateQueries({ queryKey: ['attendance-working-shifts'] });
        queryClient.invalidateQueries({ queryKey: ['attendance-policies'] });
    };

    const handleUpdate = async () => {
        if (!activeEmployee || !editModalType) return;

        const payload: any = {};
        if (editModalType === 'shift') payload.working_shift_id = inputValue;
        if (editModalType === 'policy') payload.attendance_policy_id = inputValue;
        if (editModalType === 'status') {
            payload.is_active = inputValue;
            payload.line_manager_id = lineManagerId;
        }
        if (editModalType === 'telegram') payload.telegram_user_id = inputValue;

        updateConfigMutation.mutate({ id: activeEmployee.ulid, ...payload }, {
            onSuccess: () => {
                toast.success('Updated successfully');
                setEditModalType(null);
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || 'Update failed');
            }
        });
    };

    const handleGenerateQr = async (employee: any) => {
        setQrModalOpen(true);
        setQrData(null);
        setActiveEmployee(employee);
        
        generateQrMutation.mutate(employee.ulid, {
            onSuccess: (data) => {
                setQrData(data);
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || 'Error generating QR');
                setQrModalOpen(false);
            }
        });
    };

    const handleDeviceReset = async () => {
        if (!activeEmployee) return;

        try {
            const res = await api.post('/attendance/device-unbind', { employee_id: activeEmployee.ulid });
            toast.success(res.data.message || 'Device binding reset successfully');
            setDeviceResetModalOpen(false);
            handleRefresh();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to reset device binding');
        }
    };

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const res = await api.get('/settings/branding/global');
                setBranding(res.data);
            } catch (err) {
                console.error('Failed to fetch branding', err);
            }
        };
        fetchBranding();
    }, []);

    const handleCopyLink = async () => {
        if (!qrData?.url) return;
        setIsCopying(true);
        try {
            await navigator.clipboard.writeText(qrData.url);
            toast.success('Login link copied to clipboard');
            setTimeout(() => setIsCopying(false), 2000);
        } catch (err) {
            toast.error('Failed to copy link');
            setIsCopying(false);
        }
    };

    const handleDownloadPng = async () => {
        if (!qrExportRef.current || !qrData) return;

        setIsDownloadingPng(true);
        try {
            // High quality capture of ONLY the QR code from the hidden 1024px version
            const dataUrl = await toPng(qrExportRef.current, {
                quality: 1.0,
                pixelRatio: 4, // Higher resolution for maximum clarity
                backgroundColor: '#ffffff',
                cacheBust: true,
            });

            const safeName = qrData.employee.replace(/[^a-z0-9]/gi, '_').toUpperCase();
            const safeCode = (activeEmployee?.employee_id || 'CODE').replace(/[^a-z0-9]/gi, '_').toUpperCase();
            const fileName = `${safeCode}_${safeName}_LOGIN_CREDENTIAL.png`;
            saveAs(dataUrl, fileName);
            toast.success('High-quality PNG downloaded');
        } catch (err) {
            console.error('PNG Export Error:', err);
            toast.error('Failed to download PNG');
        } finally {
            setIsDownloadingPng(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!pdfTemplateRef.current || !qrData) return;

        setIsDownloadingPdf(true);
        try {
            // Wait a moment for fonts to be ready
            await new Promise(resolve => setTimeout(resolve, 300));

            const dataUrl = await toPng(pdfTemplateRef.current, {
                quality: 0.95,
                pixelRatio: 2, 
                backgroundColor: '#ffffff',
                cacheBust: true,
            });

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'MEDIUM');

            const safeName = qrData.employee.replace(/[^a-z0-9]/gi, '_').toUpperCase();
            const safeCode = (activeEmployee?.employee_id || 'CODE').replace(/[^a-z0-9]/gi, '_').toUpperCase();
            const fileName = `${safeCode}_${safeName}_LOGIN_CREDENTIAL.pdf`;
            pdf.save(fileName);
            toast.success('Login Credential PDF downloaded');
        } catch (err) {
            console.error('PDF Export Error:', err);
            toast.error('Failed to download PDF');
        } finally {
            setIsDownloadingPdf(false);
        }
    };


    const handleBatchDownloadPdf = async () => {
        if (selectedIds.size === 0) return;

        setIsBatchDownloading(true);
        const selectedList = filteredAndSortedEmployees.filter(emp => selectedIds.has(emp.ulid));
        
        try {
            for (let i = 0; i < selectedList.length; i++) {
                const emp = selectedList[i];
                toast.loading(`Processing ${i + 1} of ${selectedList.length}...`, { id: 'batch-qr' });

                // 1. Fetch QR data
                const data = await generateQrMutation.mutateAsync(emp.ulid);
                
                // 2. Update hidden template
                setQrData(data);
                setActiveEmployee(emp);

                // 3. Wait for render
                await new Promise(resolve => setTimeout(resolve, 600));

                // 4. Capture
                const dataUrl = await toPng(pdfTemplateRef.current!, {
                    quality: 0.95,
                    pixelRatio: 2, 
                    backgroundColor: '#ffffff',
                });

                // 5. Create Individual PDF
                const individualPdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                const imgProps = individualPdf.getImageProperties(dataUrl);
                const pdfWidth = individualPdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                individualPdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'MEDIUM');

                const safeName = data.employee.replace(/[^a-z0-9]/gi, '_').toUpperCase();
                const safeCode = (emp?.employee_id || 'CODE').replace(/[^a-z0-9]/gi, '_').toUpperCase();
                const fileName = `${safeCode}_${safeName}_LOGIN_CREDENTIAL.pdf`;
                
                individualPdf.save(fileName);

                // 6. Brief pause to help browser handle multiple downloads
                if (i < selectedList.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            toast.success(`${selectedList.length} files downloaded successfully`, { id: 'batch-qr' });
            setSelectedIds(new Set()); // Clear selection after success
        } catch (err) {
            console.error('Batch Export Error:', err);
            toast.error('Failed to generate batch PDF', { id: 'batch-qr' });
        } finally {
            setIsBatchDownloading(false);
            setQrData(null);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredAndSortedEmployees.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredAndSortedEmployees.map(emp => emp.ulid)));
        }
    };

    const toggleSelectEmployee = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const openEditModal = (employee: any, type: 'shift' | 'policy' | 'status' | 'telegram') => {
        setActiveEmployee(employee);
        setEditModalType(type);
        if (type === 'shift') setInputValue(employee.working_shift_id?.toString() || '');
        else if (type === 'policy') setInputValue(employee.attendance_policy_id?.toString() || '');
        else if (type === 'status') {
            setInputValue(employee.is_active ? '1' : '0');
            setLineManagerId(employee.line_manager_id || null);
        }
        else if (type === 'telegram') setInputValue(employee.telegram_user_id || '');
    };

    const managerOptions = useMemo(() => {
        return allEmployees.map((emp: any) => ({
            value: emp.id,
            label: emp.full_name,
            description: `${emp.employee_id} • ${emp.designation?.name || 'No Designation'}`,
        }));
    }, [allEmployees]);

    const filteredAndSortedEmployees = useMemo(() => {
        let result = [...employeeConfigs];

        if (selectedEmployeeId) {
            result = result.filter(e => e.ulid === selectedEmployeeId);
        } else if (search) {
            const q = search.toLowerCase();
            result = result.filter(e =>
                e.full_name?.toLowerCase().includes(q) ||
                e.employee_id?.toLowerCase().includes(q)
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter(e => (e.is_active ? 'active' : 'inactive') === statusFilter);
        }

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
    }, [employeeConfigs, search, selectedEmployeeId, statusFilter, sortBy, sortDirection]);

    const totalPages = Math.ceil(filteredAndSortedEmployees.length / itemsPerPage);
    const paginatedEmployees = filteredAndSortedEmployees.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        dispatch(setPageTitle(t('employee_config', 'Employee Config')));
    }, [dispatch, t]);

    useEffect(() => { setCurrentPage(1); }, [search, selectedEmployeeId, statusFilter]);

    const employeeOptions = useMemo(() => {
        return employeeConfigs.map((emp: any) => ({
            value: emp.ulid,
            label: `${emp.full_name} (${emp.employee_id})`,
            description: emp.designation?.name
        }));
    }, [employeeConfigs]);

    return (
        <div>
            <FilterBar
                icon={<IconUserCog className="w-6 h-6 text-primary" />}
                title={t('employee_config', 'Employee Config')}
                description="Configure attendance settings for your employees"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onRefresh={handleRefresh}
                hasActiveFilters={statusFilter !== 'all' || selectedEmployeeId !== null || !!search}
                onClearFilters={() => {
                    setStatusFilter('all');
                    setSelectedEmployeeId(null);
                    setSearch('');
                }}
                preActions={
                    selectedIds.size > 0 && (
                        <button
                            type="button"
                            className="btn btn-primary shadow-none gap-2 animate-fade-in"
                            onClick={handleBatchDownloadPdf}
                            disabled={isBatchDownloading}
                        >
                            {isBatchDownloading ? (
                                <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-4 h-4" />
                            ) : (
                                <IconFileTypePdf className="w-4 h-4" />
                            )}
                            Download PDF ({selectedIds.size})
                        </button>
                    )
                }
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Employee</span>
                    <SearchableSelect
                        options={employeeOptions}
                        value={selectedEmployeeId}
                        onChange={(val) => setSelectedEmployeeId(val)}
                        placeholder="Employee Filter"
                        searchPlaceholder="Search employee..."
                    />
                </div>
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Status</span>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                            <SelectValue placeholder="Status Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-medium">All Status</SelectItem>
                            <SelectItem value="active" className="font-medium">Active</SelectItem>
                            <SelectItem value="inactive" className="font-medium">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>

                    {loading ? (
                        <TableSkeleton columns={8} rows={itemsPerPage} />
                    ) : (employeeConfigs.length === 0 && !loadingConfigs) ? (
                        <EmptyState title="No Employees Found" description="Start by adding employees in HR module." />
                    ) : filteredAndSortedEmployees.length === 0 ? (
                        <EmptyState isSearch searchTerm={search} onClearFilter={() => { setSearch(''); setStatusFilter('all'); setSelectedEmployeeId(null); }} />
                    ) : (
                    <div className="table-responsive bg-white dark:bg-black rounded-lg border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="table-hover w-full table">
                                <thead className="border-b dark:border-gray-600">
                                    <tr>
                                        <th className="w-10">
                                            <Checkbox 
                                                checked={selectedIds.size > 0 && selectedIds.size === filteredAndSortedEmployees.length}
                                                onCheckedChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th>#</th>
                                        <th>Photo</th>
                                        <SortableHeader label="Employee" value="full_name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                        <th>Line Manager</th>
                                        <th>Branch</th>
                                        <th>Department / Designation</th>
                                        <th>Working Shift</th>
                                        <th>Attendance Policy</th>
                                        <th className="text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedEmployees.map((emp: any, index: number) => (
                                        <tr key={emp.ulid} className={selectedIds.has(emp.ulid) ? 'bg-primary/5' : ''}>
                                            <td>
                                                <Checkbox 
                                                    checked={selectedIds.has(emp.ulid)}
                                                    onCheckedChange={() => toggleSelectEmployee(emp.ulid)}
                                                />
                                            </td>
                                            <td className="text-start text-gray-400 text-xs font-medium">
                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                            </td>
                                             <td>
                                                <div className="relative w-10 h-10 group">
                                                    <Avatar className="h-10 w-10 rounded-full border shadow-sm transition-transform duration-200 group-hover:scale-105">
                                                        <AvatarImage src={emp.profile_image_url} alt={emp.full_name} className="object-cover" />
                                                        <AvatarFallback className="rounded-full text-xs font-bold bg-primary/10 text-primary uppercase">
                                                            {emp.full_name?.charAt(0) || '?'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span 
                                                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${emp.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                        title={emp.is_active ? 'Active' : 'Inactive'}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <div className="font-bold text-sm text-gray-900 dark:text-gray-100">{emp.full_name}</div>
                                                <div className="text-xs text-primary font-medium">{emp.employee_id}</div>
                                            </td>
                                            <td>
                                                <div className="font-bold text-sm text-gray-900 dark:text-gray-100">{emp.line_manager?.full_name}</div>
                                                <div className="text-xs text-primary font-medium">{emp.line_manager?.employee_id}</div>
                                            </td>
                                            <td className="text-sm">{emp.branch?.name || '—'}</td>
                                            <td>
                                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{emp.department?.name || '—'}</div>
                                                <div className="text-xs text-gray-500">{emp.designation?.name || '—'}</div>
                                            </td>

                                            <td>
                                                <div
                                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200 border border-blue-100 dark:border-blue-800 cursor-pointer hover:bg-blue-100 transition-colors"
                                                    onClick={() => openEditModal(emp, 'shift')}
                                                >
                                                    <IconCalendarStats size={14} className="mr-1" />
                                                    {emp.working_shift?.name || 'Unassigned'}
                                                </div>
                                            </td>
                                            <td>
                                                <div
                                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-800 cursor-pointer hover:bg-emerald-100 transition-colors"
                                                    onClick={() => openEditModal(emp, 'policy')}
                                                >
                                                    <IconSettings size={14} className="mr-1" />
                                                    {emp.attendance_policy?.name || 'Unassigned'}
                                                </div>
                                            </td>
                                            <td>
                                                <ActionButtons
                                                    onQr={() => handleGenerateQr(emp)}
                                                    onStatus={() => openEditModal(emp, 'status')}
                                                    onTelegram={() => openEditModal(emp, 'telegram')}
                                                    onDeviceReset={() => {
                                                        setActiveEmployee(emp);
                                                        setDeviceResetModalOpen(true);
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filteredAndSortedEmployees.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                </div>
            )}

            {/* Edit Modals */}
            <Dialog open={editModalType !== null} onOpenChange={(open) => !open && setEditModalType(null)}>
                <DialogContent className="max-w-md ">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {editModalType === 'shift' && <><IconCalendarStats className="text-blue-500" /> Edit Working Shift</>}
                            {editModalType === 'policy' && <><IconSettings className="text-emerald-500" /> Edit Attendance Policy</>}
                            {editModalType === 'status' && <><IconUser className="text-amber-500" /> Edit Staff Status</>}
                            {editModalType === 'telegram' && <><IconBrandTelegram className="text-sky-500" /> Edit Telegram User ID</>}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                            <Avatar className="h-12 w-12 rounded-full border-2 border-white dark:border-gray-800 shadow-md">
                                <AvatarImage src={activeEmployee?.profile_image_url} alt="profile" className="object-cover" />
                                <AvatarFallback className="rounded-full text-lg font-black bg-primary/10 text-primary uppercase">
                                    {activeEmployee?.full_name?.charAt(0) || '?'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-bold text-gray-900 dark:text-gray-100">{activeEmployee?.full_name}</div>
                                <div className="text-sm text-gray-500">{activeEmployee?.employee_id} • {activeEmployee?.designation?.name}</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">
                                {editModalType === 'shift' && 'Select Working Shift'}
                                {editModalType === 'policy' && 'Select Attendance Policy'}
                                {editModalType === 'status' && 'Staff Employment Status'}
                                {editModalType === 'telegram' && 'Telegram User ID (Integration)'}
                            </Label>

                            {editModalType === 'shift' && (
                                <Select value={inputValue} onValueChange={setInputValue}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Choose shift..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {workingShifts.map((s: any) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {editModalType === 'policy' && (
                                <Select value={inputValue} onValueChange={setInputValue}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Choose policy..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {attendancePolicies.map((p: any) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {editModalType === 'status' && (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Employment Status</Label>
                                        <Select value={inputValue} onValueChange={setInputValue}>
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Choose status..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Active</SelectItem>
                                                <SelectItem value="0">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Line Manager</Label>
                                        <SearchableSelect
                                            options={managerOptions}
                                            value={lineManagerId}
                                            onChange={(val) => setLineManagerId(val)}
                                            placeholder="Select Line Manager"
                                            searchPlaceholder="Search manager name or ID..."
                                            loading={loadingEmployees}
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1 px-1 text-start italic">Responsible for approving leave and day-off requests.</p>
                                    </div>
                                </div>
                            )}
                            {editModalType === 'telegram' && (
                                <div>
                                    <Input
                                        placeholder="Enter Telegram User ID..."
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-2 px-1 text-start italic">Used for automated attendance notifications via Telegram Bot.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setEditModalType(null)} className="flex-1 sm:flex-none">Cancel</Button>
                        <Button onClick={handleUpdate} isLoading={isUpdating} className="flex-1 sm:flex-none">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* QR Modal */}
            <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] h-auto p-0 gap-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 print:hidden">
                        <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
                            <IconQrcode className="text-primary w-6 h-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                Employee Login QR
                            </DialogTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                Scan this code with the mobile app to log in securely.
                            </p>
                        </div>
                    </div>

                    <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1 min-h-0">
                        {loadingQr ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative w-36 h-36">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-2 border-primary rounded-sm opacity-50" />
                                        <div className="absolute top-0 left-0 w-4 h-4 m-2 bg-primary rounded-[2px] animate-pulse" />
                                        <div className="absolute top-0 right-0 w-8 h-8 border-2 border-primary rounded-sm opacity-50" />
                                        <div className="absolute top-0 right-0 w-4 h-4 m-2 bg-primary rounded-[2px] animate-pulse" />
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-2 border-primary rounded-sm opacity-50" />
                                        <div className="absolute bottom-0 left-0 w-4 h-4 m-2 bg-primary rounded-[2px] animate-pulse" />
                                        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-0.5 p-1">
                                            {Array.from({ length: 36 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="rounded-[2px] bg-primary animate-[appear_0.3s_ease-out_forwards] opacity-0"
                                                    style={{
                                                        animationDelay: `${Math.floor(Math.random() * 900)}ms`,
                                                        animationIterationCount: "infinite",
                                                        animationDuration: `${900 + (i * 37) % 600}ms`,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-sm font-medium text-foreground">Generating secure payload</p>
                                        <p className="text-xs text-muted-foreground">Building your QR code...</p>
                                    </div>
                                </div>
                            </div>
                        ) : qrData ? (
                            <div ref={qrRef} className="p-6 space-y-6 bg-white dark:bg-black">
                                <div className="text-center flex flex-col items-center">
                                    <Avatar className="h-20 w-20 rounded-full border-4 border-white dark:border-gray-800 shadow-xl mb-4 transition-transform duration-300 hover:scale-105">
                                        <AvatarImage src={activeEmployee?.profile_image_url} alt="profile" className="object-cover" />
                                        <AvatarFallback className="rounded-full text-2xl font-black bg-primary/10 text-primary uppercase">
                                            {qrData?.employee?.charAt(0) || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {qrData.employee}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">Scan to log in to our app</p>
                                </div>

                                <div className="flex justify-center">
                                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 inline-block">
                                        <QRCode value={qrData.url} size={220} level="H" />
                                    </div>
                                </div>

                                <div className="space-y-2 print:hidden">
                                    <Label htmlFor="qr-url" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Login Link
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="qr-url"
                                            value={qrData.url}
                                            readOnly
                                            className="bg-gray-50 dark:bg-gray-800 font-mono text-sm"
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={handleCopyLink}
                                            className="shrink-0 h-10 w-10 border-gray-200 dark:border-gray-700"
                                            title="Copy link"
                                            disabled={isCopying}
                                        >
                                            {isCopying ? <IconCheck size={18} className="text-green-500" /> : <IconCopy size={18} />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full print:hidden">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 border-gray-200 dark:border-gray-700"
                                        onClick={handleDownloadPng}
                                        disabled={isDownloadingPng}
                                    >
                                        <IconDownload size={16} />
                                        {isDownloadingPng ? 'Downloading...' : 'PNG (HD)'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 border-gray-200 dark:border-gray-700"
                                        onClick={handleDownloadPdf}
                                        disabled={isDownloadingPdf}
                                    >
                                        <IconFileTypePdf size={16} />
                                        {isDownloadingPdf ? 'Downloading...' : 'PDF'}
                                    </Button>
                                </div>

                                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                                    <div className="flex gap-2 items-start">
                                        <IconAlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
                                            SECURITY WARNING: This QR code contains sensitive session credentials. Do not share or leave it unattended.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </PerfectScrollbar>

                    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background print:hidden">
                        <Button variant="ghost" onClick={() => setQrModalOpen(false)} className="h-9 px-4 rounded-lg">
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Device Reset Confirmation Modal */}
            <Dialog open={deviceResetModalOpen} onOpenChange={setDeviceResetModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-orange-600">
                            <IconAlertTriangle /> Reset Device Binding
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/50 rounded-xl">
                            <div className="flex items-center gap-4 mb-3">
                                <Avatar className="h-12 w-12 rounded-full border-2 border-white dark:border-gray-800 shadow-md">
                                    <AvatarImage src={activeEmployee?.profile_image_url} alt="profile" className="object-cover" />
                                    <AvatarFallback className="rounded-full text-lg font-black bg-primary/10 text-primary uppercase">
                                        {activeEmployee?.full_name?.charAt(0) || '?'}
                                    </AvatarFallback>
                                </Avatar>
                                <p className="text-sm text-orange-800 dark:text-orange-300 font-medium leading-relaxed">
                                    Are you sure you want to reset the device binding for <strong>{activeEmployee?.full_name}</strong>?
                                </p>
                            </div>
                            <p className="text-xs text-orange-700/70 dark:text-orange-400/70 mt-2">
                                This will allow the employee to link a new device to their account on their next login/clock-in attempt.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeviceResetModalOpen(false)} className="flex-1 sm:flex-none">Cancel</Button>
                        <Button variant="destructive" onClick={handleDeviceReset} className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700">Reset Binding</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Hidden PDF Template for Export */}
            <div className="fixed top-0 left-0 pointer-events-none opacity-0 -z-[100]" aria-hidden="true">
                {/* PNG Export High-Res QR */}
                <div ref={qrExportRef} className="bg-white p-8 inline-block">
                    {qrData && <QRCode value={qrData.url} size={1024} level="H" />}
                </div>

                <div 
                    ref={pdfTemplateRef} 
                    className="w-[794px] bg-white text-slate-900 p-12 font-google-sans relative overflow-hidden"
                    style={{ minHeight: '1123px' }}
                >
                    {/* Header: Title & Date */}
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-3xl font-bold">Login Credential</h1>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Generated on</p>
                            <p className="text-sm font-bold text-slate-600">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                    </div>

                    {/* Red Divider */}
                    <div className="h-[2px] bg-red-600 mb-8" />

                    {/* Employee Info (Now Centered under the line) */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold uppercase tracking-tight">{qrData?.employee}</h2>
                        <p className="text-slate-500 font-medium">ID: {activeEmployee?.employee_id}</p>
                    </div>

                    {/* QR Code Section */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="bg-white p-6 border border-slate-100 shadow-sm mb-6">
                            {qrData && <QRCode value={qrData.url} size={380} level="H" />}
                        </div>
                        <h3 className="text-lg font-bold">Use Phone Camera to Scan this QR Code</h3>
                        <p className="text-slate-500">You will be logged into the system automatically.</p>
                    </div>

                    {/* PWA Section */}
                    <div className="bg-slate-50 p-8 rounded-xl mb-12">
                        <h4 className="text-lg font-bold mb-4">How to Install our Web App (PWA)</h4>
                        <p className="text-slate-600 mb-6 text-sm">After logging in, follow these steps to add the app to your home screen:</p>
                        
                        <div className="space-y-4">
                            <div className="flex gap-2 text-sm">
                                <span className="font-bold shrink-0">Android:</span>
                                <span className="text-slate-600">Tap the browser menu (three dots) and select "Install app" or "Add to Home Screen".</span>
                            </div>
                            <div className="flex gap-2 text-sm">
                                <span className="font-bold shrink-0">iOS:</span>
                                <span className="text-slate-600">Tap the "Share" button and select "Add to Home Screen" from the menu.</span>
                            </div>
                        </div>
                    </div>

                    {/* Security Note */}
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-center mb-12">
                        <p className="text-red-700 font-bold text-sm">
                            SECURITY NOTE: This document contains sensitive credentials. Keep it safe and do not share.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-12 left-12 right-12 text-center text-slate-400 text-[10px]">
                        <p>© {new Date().getFullYear()} {branding?.company_name || 'SCCG'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeConfigIndex;
