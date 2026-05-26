import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import { IconChartBar, IconClock, IconInfoCircle } from '@tabler/icons-react';
import FilterBar from '@/components/ui/FilterBar';
import TableSkeleton from '@/components/ui/TableSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import { useAttendanceSummary, useHRBranches, useHRDepartments, exportAttendanceSummary } from '@/hooks/useHRData';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import SortableHeader from '@/components/ui/SortableHeader';
import HighlightText from '@/components/ui/HighlightText';
import { DateRange } from 'react-day-picker';
import dayjs from 'dayjs';
import AttendanceTimelineView from './components/AttendanceTimelineView';
import AttendanceAuditDialog from './components/AttendanceAuditDialog';
import { toast } from 'sonner';


const AttendanceReport = () => {
    const { t } = useTranslation('report');
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        dispatch(setPageTitle(t('attendance_report')));
        
        // Handle deep-link search from other pages
        const s = searchParams.get('search');
        if (s) {
            setSearch(s);
            setPage(1);
        }
    }, [dispatch, t, searchParams]);

    // Filters
    const [range, setRange] = useState<DateRange | undefined>({
        from: dayjs().startOf('month').toDate(),
        to: dayjs().endOf('month').toDate(),
    });

    const [branchId, setBranchId] = useState<string | number>('all');
    const [deptId, setDeptId] = useState<string | number>('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(15);
    const [sortBy, setSortBy] = useState('full_name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [isExporting, setIsExporting] = useState(false);

    // Detail View State
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [selectedAuditEmployee, setSelectedAuditEmployee] = useState<any>(null);

    const { data: summaryData, isLoading, refetch } = useAttendanceSummary({
        start_date: range?.from ? dayjs(range.from).format('YYYY-MM-DD') : '',
        end_date: range?.to ? dayjs(range.to).format('YYYY-MM-DD') : '',
        branch_id: branchId,
        department_id: deptId,
        search,
        page,
        limit,
        sort_by: sortBy,
        sort_dir: sortDir,
    });

    const { data: branches = [] } = useHRBranches();
    const { data: departments = [] } = useHRDepartments();

    const branchOptions = useMemo(() => {
        const opts = branches.map((b: any) => ({ value: b.id, label: b.name }));
        return [{ value: 'all', label: t('all_branches') }, ...opts];
    }, [branches, t]);

    const deptOptions = useMemo(() => {
        const opts = departments.map((d: any) => ({ value: d.id, label: d.name }));
        return [{ value: 'all', label: t('all_departments') }, ...opts];
    }, [departments, t]);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortDir('asc');
        }
        setPage(1);
    };

    const handleExport = async () => {
        if (isExporting) return;
        setIsExporting(true);
        const toastId = toast.loading(t('exporting_msg', 'Exporting Report...'));
        try {
            await exportAttendanceSummary({
                start_date: range?.from ? dayjs(range.from).format('YYYY-MM-DD') : '',
                end_date: range?.to ? dayjs(range.to).format('YYYY-MM-DD') : '',
                branch_id: branchId,
                department_id: deptId,
                search
            });
            toast.success(t('export_success_msg', 'Report exported successfully!'), { id: toastId });
        } catch (err) {
            toast.error(t('export_failed_msg', 'Export failed'), { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    const handleClearFilters = () => {
        setBranchId('all');
        setDeptId('all');
        setSearch('');
        setRange({
            from: dayjs().startOf('month').toDate(),
            to: dayjs().endOf('month').toDate(),
        });
        setSortBy('full_name');
        setSortDir('asc');
    };

    return (
        <div>
            <FilterBar
                icon={<IconChartBar className="w-6 h-6 text-primary" />}
                title={t('attendance_summary_report')}
                description={t('attendance_summary_report_desc', 'Monthly aggregate performance metrics for all employees.')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={limit}
                onRefresh={async () => { await refetch(); }}
                setItemsPerPage={(val) => {
                    setLimit(val);
                    setPage(1);
                }}
                onExport={handleExport}
                isExporting={isExporting}
                onClearFilters={handleClearFilters}
                hasActiveFilters={branchId !== 'all' || deptId !== 'all' || search !== ''}
            >
                <div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('date_range_label')}</span>
                   <DateRangePicker 
                        value={range}
                        onChange={setRange}
                        className="h-10"
                   />
                </div>
                <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('branch')}</span>
                    <SearchableSelect 
                        options={branchOptions}
                        value={branchId}
                        onChange={setBranchId}
                        placeholder={t('select_branch')}
                    />
                </div>
                <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('department')}</span>
                    <SearchableSelect 
                        options={deptOptions}
                        value={deptId}
                        onChange={setDeptId}
                        placeholder={t('select_department')}
                    />
                </div>
            </FilterBar>

            {isLoading ? (
                <TableSkeleton columns={8} rows={10} />
            ) : summaryData?.data?.length === 0 ? (
                <EmptyState title={t('no_report_data')} description={t('no_report_data_desc')} isSearch={!!search} />
            ) : (
                <div className="bg-white dark:bg-black rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="table-hover w-full table-compact">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="whitespace-nowrap w-[50px] text-center">#</th>
                                    <th className="whitespace-nowrap">{t('employee')}</th>
                                    <SortableHeader 
                                        label={t('present_days')} 
                                        value="present_days" 
                                        currentSortBy={sortBy} 
                                        currentDirection={sortDir} 
                                        onSort={handleSort} 
                                        className="text-center"
                                    />
                                    <SortableHeader 
                                        label={t('late_mins')} 
                                        value="total_late" 
                                        currentSortBy={sortBy} 
                                        currentDirection={sortDir} 
                                        onSort={handleSort} 
                                        className="text-center"
                                    />
                                    <SortableHeader 
                                        label={t('early_arrival')} 
                                        value="total_early" 
                                        currentSortBy={sortBy} 
                                        currentDirection={sortDir} 
                                        onSort={handleSort} 
                                        className="text-center"
                                    />
                                    <SortableHeader 
                                        label={t('early_departure')} 
                                        value="total_early_departure" 
                                        currentSortBy={sortBy} 
                                        currentDirection={sortDir} 
                                        onSort={handleSort} 
                                        className="text-center"
                                    />
                                    <SortableHeader 
                                        label={t('stay_late_mins')} 
                                        value="total_stay_late" 
                                        currentSortBy={sortBy} 
                                        currentDirection={sortDir} 
                                        onSort={handleSort} 
                                        className="text-center"
                                    />
                                    <SortableHeader 
                                        label={t('overtime_mins')} 
                                        value="total_overtime" 
                                        currentSortBy={sortBy} 
                                        currentDirection={sortDir} 
                                        onSort={handleSort} 
                                        className="text-center"
                                    />
                                    <SortableHeader 
                                        label={t('total_work_time')} 
                                        value="total_work_hours" 
                                        currentSortBy={sortBy} 
                                        currentDirection={sortDir} 
                                        onSort={handleSort} 
                                        className="text-center"
                                    />
                                    <th className="text-right">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summaryData?.data?.map((emp: any, index: number) => (
                                    <tr key={emp.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                                        <td className="text-center text-slate-400 text-xs font-medium">
                                            {(page - 1) * limit + index + 1}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 rounded-full border border-primary/20">
                                                    <AvatarImage src={emp.profile_image_url} className="object-cover" />
                                                    <AvatarFallback className="rounded-full text-xs font-bold">
                                                        {emp.full_name?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                                                        <HighlightText text={emp.full_name} highlight={search} />
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-medium">
                                                        <HighlightText text={emp.employee_code} highlight={search} /> • {emp.department?.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800">
                                                {emp.present_days}
                                            </Badge>
                                        </td>
                                        <td className="text-center">
                                            <span className={emp.total_late > 0 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-slate-400"}>
                                                {emp.total_late > 0 ? `${emp.total_late}m` : '—'}
                                            </span>
                                        </td>
                                        <td className="text-center text-slate-600 dark:text-slate-400 text-xs">
                                            {emp.total_early > 0 ? `${emp.total_early}m` : '—'}
                                        </td>
                                        <td className="text-center text-slate-600 dark:text-slate-400 text-xs">
                                            {emp.total_early_departure > 0 ? `${emp.total_early_departure}m` : '—'}
                                        </td>
                                        <td className="text-center text-slate-600 dark:text-slate-400 text-xs">
                                            {emp.total_stay_late > 0 ? `${emp.total_stay_late}m` : '—'}
                                        </td>
                                        <td className="text-center">
                                            <span className={emp.total_overtime > 0 ? "text-primary font-bold" : "text-slate-400"}>
                                                {emp.total_overtime > 0 ? `${emp.total_overtime}m` : '—'}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-300">
                                                <IconClock size={12} className="text-primary" />
                                                {emp.formatted_work_time}
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="h-8 w-8 p-0 rounded-lg border text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                    onClick={() => setSelectedAuditEmployee(emp)}
                                                    title={t('daily_audit_logs')}
                                                >
                                                    <IconInfoCircle size={14} />
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="h-8 gap-1.5 rounded-lg border-primary/20 text-primary hover:bg-primary/5"
                                                    onClick={() => setSelectedEmployee(emp)}
                                                >
                                                    <IconChartBar size={14} />
                                                    {t('timeline')}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                        <Pagination 
                            currentPage={page} 
                            totalPages={summaryData?.last_page || 1} 
                            totalItems={summaryData?.total || 0} 
                            itemsPerPage={limit} 
                            onPageChange={setPage} 
                        />
                </div>
            )}

            {/* Detail Views */}
            {selectedEmployee && (
                <AttendanceTimelineView 
                    employee={selectedEmployee} 
                    dateRange={{
                        start_date: range?.from ? dayjs(range.from).format('YYYY-MM-DD') : '',
                        end_date: range?.to ? dayjs(range.to).format('YYYY-MM-DD') : '',
                    }} 
                    onClose={() => setSelectedEmployee(null)} 
                />
            )}

            {selectedAuditEmployee && (
                <AttendanceAuditDialog 
                    employee={selectedAuditEmployee}
                    dateRange={{
                        start_date: range?.from ? dayjs(range.from).format('YYYY-MM-DD') : '',
                        end_date: range?.to ? dayjs(range.to).format('YYYY-MM-DD') : '',
                    }}
                    onClose={() => setSelectedAuditEmployee(null)}
                />
            )}
        </div>
    );
};

export default AttendanceReport;
