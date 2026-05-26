import { useState, useMemo, useEffect } from 'react';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import ActionButtons from '../../../components/ui/ActionButtons';
import { DateRangePicker } from '../../../components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import dayjs from 'dayjs';
import { IconClockRecord } from '@tabler/icons-react';
import { useAttendanceRecords, useHRFilterEmployees, exportAttendanceRecords, useDeleteAttendanceRecord, useHRBranches, useHRDepartments } from '@/hooks/useHRData';
import { useFormatDate } from '@/hooks/useFormatDate';
import DeleteModal from '@/components/DeleteModal';
import { Badge } from '@/components/ui/badge';
import StatusBadge from './components/StatusBadge';
import AttendanceDetailsDialog from './components/AttendanceDetailsDialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { IconCoffee, IconCoffeeOff } from '@tabler/icons-react';
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from '@/components/ui/avatar';

import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import HighlightText from '@/components/ui/HighlightText';
import { useSearchParams } from 'react-router-dom';

const AttendanceRecordIndex = () => {
    const { t } = useTranslation();
    const { formatDate, formatTime } = useFormatDate();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    
    // Filter & Sort & Pagination state
    const [search, setSearch] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [sortBy, setSortBy] = useState('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [dateFilter, setDateFilter] = useState<DateRange | undefined>({
        from: dayjs().startOf('month').toDate(),
        to: dayjs().endOf('month').toDate()
    });
    const [employeeFilter, setEmployeeFilter] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [inStatusFilter, setInStatusFilter] = useState('');
    const [outStatusFilter, setOutStatusFilter] = useState('');
    const [searchParams] = useSearchParams();
    const [deductBreak, setDeductBreak] = useState(true);

    // Handle URL Parameters for Drill-down
    useEffect(() => {
        const start = searchParams.get('start_date');
        const end = searchParams.get('end_date');
        const inStatus = searchParams.get('in_status');
        const outStatus = searchParams.get('out_status');

        if (start || end || inStatus || outStatus) {
            if (start && end) {
                setDateFilter({
                    from: dayjs(start).toDate(),
                    to: dayjs(end).toDate()
                });
            }
            if (inStatus) setInStatusFilter(inStatus);
            if (outStatus) setOutStatusFilter(outStatus);
        }
    }, [searchParams]);

    // Hooks
    const apiFilters = useMemo(() => ({
        start_date: dateFilter?.from ? dayjs(dateFilter.from).format('YYYY-MM-DD') : undefined,
        end_date: dateFilter?.to ? dayjs(dateFilter.to).format('YYYY-MM-DD') : undefined,
        employee_id: employeeFilter || undefined,
        branch_id: branchFilter || undefined,
        department_id: departmentFilter || undefined,
        in_status: inStatusFilter || undefined,
        out_status: outStatusFilter || undefined,
        search: search || undefined,
        page: currentPage,
        per_page: itemsPerPage,
        sort_by: sortBy,
        sort_direction: sortDirection,
    }), [dateFilter, employeeFilter, branchFilter, departmentFilter, inStatusFilter, outStatusFilter, search, currentPage, itemsPerPage, sortBy, sortDirection]);

    const { data: response, isLoading: loadingRecords, refetch } = useAttendanceRecords(apiFilters);
    const records = response?.data || [];
    const totalItems = response?.total || 0;
    const totalPages = response?.last_page || 0;
    const { data: employees = [], isLoading: loadingEmployees } = useHRFilterEmployees(true);
    const { data: branches = [], isLoading: loadingBranches } = useHRBranches();
    const { data: departments = [], isLoading: loadingDepartments } = useHRDepartments();

    const rawLoading = loadingRecords || loadingEmployees || loadingBranches || loadingDepartments;
    const loading = useDelayedLoading(rawLoading, 500);

    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    // Mutations
    const deleteMutation = useDeleteAttendanceRecord();

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
        queryClient.invalidateQueries({ queryKey: ['hr-employees-filter'] });
    };

    const handleInfo = (record: any) => {
        setSelectedRecord(record);
        setIsInfoModalOpen(true);
    };

    const handleDelete = (record: any) => {
        setSelectedRecord(record);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedRecord) return;
        try {
            await deleteMutation.mutateAsync(selectedRecord.id);
            toast.success('Record deleted successfully');
            setIsDeleteModalOpen(false);
        } catch (e) {
            toast.error('Failed to delete record');
        }
    };

    const handleExport = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            toast.loading(t('exporting', 'Exporting...'), { id: 'export' });
            await exportAttendanceRecords(apiFilters);
            toast.success(t('export_successful', 'Exported successfully'), { id: 'export' });
        } catch (e) {
            toast.error(t('export_failed', 'Export failed'), { id: 'export' });
        } finally {
            setIsExporting(false);
        }
    };

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('asc');
        }
    };

    // Reset page if filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, dateFilter, employeeFilter, branchFilter, departmentFilter, inStatusFilter, outStatusFilter]);

    // Reset page if search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, dateFilter, employeeFilter]);

    useEffect(() => {
        dispatch(setPageTitle(t('attendance_records', 'Attendance Records')));
    }, [dispatch, t]);

    // Real-time listener for new attendance logs
    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.channel('attendance');
            
            channel.listen('.AttendanceLogged', (event: any) => {
                // Silent refetch to update the table while respecting current filters
                refetch();
                
                // Show a subtle notification
                const employeeName = event.record.employee?.full_name || 'Someone';
                toast.info(`${employeeName} ${t('logged_attendance', 'logged attendance')}`, {
                    description: t('refreshing_records_desc', 'Updating records table automatically...'),
                    duration: 3000,
                });
            });

            return () => {
                channel.stopListening('.AttendanceLogged');
            };
        }
    }, [refetch, t]);

    const employeeOptions = useMemo(() => 
        employees.map((emp: any) => ({
            value: String(emp.id),
            label: emp.full_name,
            description: emp.employee_id
        }))
    , [employees]);

    const branchOptions = useMemo(() => 
        branches.map((branch: any) => ({
            value: String(branch.id),
            label: branch.name
        }))
    , [branches]);

    const departmentOptions = useMemo(() => 
        departments.map((dept: any) => ({
            value: String(dept.id),
            label: dept.name
        }))
    , [departments]);

    const inStatusOptions = useMemo(() => [
        { value: 'In-On time', label: 'In-On time', color: '#3b82f6' },
        { value: 'Early', label: 'Early', color: '#10b981' },
        { value: 'Warning', label: 'Warning', color: '#f59e0b' },
        { value: 'Late', label: 'Late', color: '#f97316' },
    ], []);

    const outStatusOptions = useMemo(() => [
        { value: 'Out-On time', label: 'Out-On time', color: '#3b82f6' },
        { value: 'Stay Late', label: 'Stay Late', color: '#6366f1' },
        { value: 'Overtime', label: 'Overtime', color: '#10b981' },
        { value: 'Early Departure', label: 'Early Departure', color: '#f97316' },
    ], []);

    return (
        <div>
            <FilterBar
                icon={<IconClockRecord className="w-6 h-6 text-primary" />}
                title="Attendance Records"
                description="Manage and view employee attendance logs"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onRefresh={handleRefresh}
                onExport={handleExport}
                isExporting={isExporting}
                hasActiveFilters={!!search || !!dateFilter?.from || !!employeeFilter || !!branchFilter || !!departmentFilter || !!inStatusFilter || !!outStatusFilter}

                onClearFilters={() => {
                    setSearch('');
                    setDateFilter({
                        from: dayjs().startOf('month').toDate(),
                        to: dayjs().endOf('month').toDate()
                    });
                    setSortBy('date');
                    setSortDirection('desc');
                    setEmployeeFilter('');
                    setBranchFilter('');
                    setDepartmentFilter('');
                    setInStatusFilter('');
                    setOutStatusFilter('');
                }}
            >
                <DateRangePicker
                    value={dateFilter}
                    onChange={setDateFilter}
                    placeholder="Filter by date range..."
                />

                <SearchableSelect
                    options={branchOptions}
                    value={branchFilter}
                    onChange={(val) => setBranchFilter(String(val))}
                    placeholder="All Branches"
                    searchPlaceholder="Search branches..."
                    loading={loadingBranches}
                />

                <SearchableSelect
                    options={departmentOptions}
                    value={departmentFilter}
                    onChange={(val) => setDepartmentFilter(String(val))}
                    placeholder="All Departments"
                    searchPlaceholder="Search departments..."
                    loading={loadingDepartments}
                />

                <SearchableSelect
                    options={inStatusOptions}
                    value={inStatusFilter}
                    onChange={(val) => setInStatusFilter(String(val))}
                    placeholder="All In Status"
                    searchPlaceholder="Search in status..."
                />

                <SearchableSelect
                    options={outStatusOptions}
                    value={outStatusFilter}
                    onChange={(val) => setOutStatusFilter(String(val))}
                    placeholder="All Out Status"
                    searchPlaceholder="Search out status..."
                />

                <SearchableSelect
                    options={employeeOptions}
                    value={employeeFilter}
                    onChange={(val) => setEmployeeFilter(String(val))}
                    placeholder="All Employees"
                    searchPlaceholder="Search employees..."
                    loading={loadingEmployees}
                />

                <div className="flex items-center gap-2 px-2 h-10 bg-white dark:bg-slate-900
                        hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md border ">
                    {deductBreak ? <IconCoffee className="w-4 h-4 text-amber-500" /> : <IconCoffeeOff className="w-4 h-4 text-gray-400" />}
                    <Label htmlFor="deduct-break" className="text-[11px] mb-0 font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap cursor-pointer">
                        {deductBreak ? t('deduct_break', 'Deduct Break') : t('raw_time', 'Raw Time')}
                    </Label>
                    <Switch 
                        id="deduct-break"
                        checked={deductBreak}
                        onCheckedChange={setDeductBreak}
                    />
                </div>
            </FilterBar>

            {loading ? (
                <TableSkeleton columns={7} rows={5} />
            ) : response?.total === 0 ? (
                <EmptyState
                    isSearch={!!search}
                    searchTerm={search}
                    title={search ? undefined : "No Attendance Records"}
                    description={search ? undefined : "No attendance data found for the selected period."}
                    onClearFilter={() => {
                        setSearch('');
                        setCurrentPage(1);
                    }}
                />
            ) : (
                <>
                    <div className="table-responsive bg-white dark:bg-black rounded-lg border overflow-auto">
                        <table className="table-hover w-full table">
                            <thead className='border-b dark:border-gray-600' >
                                <tr>
                                    <th className="w-12">#</th>
                                     <SortableHeader label="Employee" value="employee" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label="Date" value="date" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label="S1 In" value="check_in" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label="S1 Out" value="session_1_out_time" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label="S2 In" value="session_2_in_time" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label="S2 Out" value="check_out" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label="In Status" value="in_status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label="Out Status" value="out_status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label="Total" value="total_hours" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th className="text-right pr-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record: any, index: number) => (
                                    <tr key={record.id} className="group">
                                        <td className="text-start text-gray-400 text-xs font-medium">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 rounded-full border shadow-sm">
                                                    <AvatarImage src={record.employee?.profile_image_url} alt={record.employee?.full_name} className="object-cover" />
                                                    <AvatarFallback className="rounded-full text-[10px] font-bold bg-muted text-muted-foreground uppercase">
                                                        {record.employee?.full_name?.charAt(0) || '?'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-primary transition-colors">
                                                        <HighlightText text={record.employee?.full_name} highlight={search} />
                                                    </div>
                                                    <div className="text-[10px] text-gray-500">{record.employee?.employee_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">{formatDate(record.date)}</td>
                                        
                                        {/* S1 In */}
                                        <td>
                                            <div className="flex flex-col text-[11px] font-bold text-blue-600">
                                                {formatTime(record.check_in)}
                                            </div>
                                        </td>

                                        {/* S1 Out */}
                                        <td>
                                            <div className="flex flex-col text-[11px] text-amber-600 font-medium">
                                                {formatTime(record.session_1_out_time) || '-'}
                                            </div>
                                        </td>

                                        {/* S2 In */}
                                        <td>
                                            <div className="flex flex-col text-[11px] text-indigo-600 font-medium">
                                                {formatTime(record.session_2_in_time) || '-'}
                                            </div>
                                        </td>

                                        {/* S2 Out */}
                                        <td>
                                            <div className="flex flex-col text-[11px] text-gray-500">
                                                {formatTime(record.check_out) || '-'}
                                            </div>
                                        </td>

                                        <td>
                                            <StatusBadge status={record.in_status} mins={record.late_minutes || record.warning_minutes || record.early_minutes} />
                                        </td>

                                        <td>
                                            <StatusBadge status={record.out_status} mins={(record.early_departure_minutes || 0) + (record.overtime_minutes || 0) + (record.stay_late_minutes || 0)} />
                                        </td>

                                        <td className="text-xs font-semibold whitespace-nowrap">
                                            {(() => {
                                                if (deductBreak) {
                                                    return (
                                                        <>
                                                            {record.total_hours || '-'} hrs
                                                            {record.total_hours && (
                                                                <span className="ml-1 text-[10px] text-gray-400 font-normal italic">
                                                                    ({Math.floor(record.total_hours)}h {Math.round((record.total_hours % 1) * 60)}mn)
                                                                </span>
                                                            )}
                                                        </>
                                                    );
                                                }
                                                // Raw Calculation
                                                const checkIn = record.check_in ? dayjs(record.check_in) : null;
                                                const checkOut = record.check_out ? dayjs(record.check_out) : null;
                                                if (!checkIn || !checkOut) return '-';
                                                
                                                const s1Out = record.session_1_out_time ? dayjs(record.session_1_out_time) : null;
                                                const s2In = record.session_2_in_time ? dayjs(record.session_2_in_time) : null;
                                                
                                                let rawHours = 0;
                                                if (s1Out && s2In) {
                                                    rawHours = Math.abs(s1Out.diff(checkIn, 'hour', true)) + Math.abs(checkOut.diff(s2In, 'hour', true));
                                                } else {
                                                    rawHours = Math.abs(checkOut.diff(checkIn, 'hour', true));
                                                }
                                                
                                                return (
                                                    <span className="text-blue-600 dark:text-blue-400">
                                                        {rawHours.toFixed(2)} hrs
                                                        <span className="ml-1 text-[10px] font-normal italic opacity-70">
                                                            ({Math.floor(rawHours)}h {Math.round((rawHours % 1) * 60)}mn)
                                                        </span>
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="text-right pr-2">
                                            <ActionButtons
                                                variant='rounded'
                                                onView={() => handleInfo(record)}
                                                onDelete={() => handleDelete(record)}
                                                skipDeleteConfirm
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <DeleteModal
                        isOpen={isDeleteModalOpen}
                        setIsOpen={setIsDeleteModalOpen}
                        title="Delete Attendance Record"
                        message={`Are you sure you want to delete the attendance record for ${selectedRecord?.employee?.full_name} on ${selectedRecord?.date}? This action cannot be undone.`}
                        onConfirm={confirmDelete}
                        isLoading={deleteMutation.isPending}
                    />

                    <AttendanceDetailsDialog
                        isOpen={isInfoModalOpen}
                        onOpenChange={setIsInfoModalOpen}
                        record={selectedRecord}
                    />

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </>
            )}
        </div>
    );
};


export default AttendanceRecordIndex;
