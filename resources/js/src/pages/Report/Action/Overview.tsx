import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '@/store/themeConfigSlice';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { 
    IconCalendar, 
    IconUser, 
    IconActivity,
    IconBuildingCommunity,
    IconBadge,
    IconReport,
    IconClock,
    IconMapPin,
    IconSearch,
    IconCheck
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { cn } from '@/lib/utils';
import { 
    useHRActionOverview,
    useHRBranches, 
    useHRDesignations, 
    useHRFilterEmployees,
    exportHRActionOverview
} from '@/hooks/useHRData';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useFormatDate } from '@/hooks/useFormatDate';
import { Card } from '@/components/ui/card';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import TableSkeleton from '@/components/ui/TableSkeleton';
import ActionButtons from '@/components/ui/ActionButtons';
import DateRangePicker from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import HighlightText from '@/components/ui/HighlightText';

dayjs.extend(relativeTime);

const ActionOverview = () => {
    const { t } = useTranslation('report');
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { formatTime, formatDate } = useFormatDate();

    useEffect(() => {
        dispatch(setPageTitle(t('action_log_overview', 'Action Log Overview')));
    }, [dispatch, t]);

    // Filters State
    const [range, setRange] = useState<DateRange | undefined>({
        from: dayjs().startOf('month').toDate(),
        to: dayjs().toDate(),
    });
    const [search, setSearch] = useState('');
    const [branchId, setBranchId] = useState('all');
    const [designationId, setDesignationId] = useState('all');
    const [employeeId, setEmployeeId] = useState('all');
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);

    // Data Fetching
    const { data, isLoading, refetch } = useHRActionOverview({
        start_date: range?.from ? dayjs(range.from).format('YYYY-MM-DD') : '',
        end_date: range?.to ? dayjs(range.to).format('YYYY-MM-DD') : (range?.from ? dayjs(range.from).format('YYYY-MM-DD') : ''),
        search,
        branch_id: branchId === 'all' ? undefined : branchId,
        designation_id: designationId === 'all' ? undefined : designationId,
        employee_id: employeeId === 'all' ? undefined : employeeId,
        page,
        per_page: itemsPerPage,
    });

    const { data: branches } = useHRBranches();
    const { data: designations } = useHRDesignations();
    const { data: filterEmployees } = useHRFilterEmployees(true);

    const actions = data?.data || [];
    const meta = data;

    const handleViewTimeline = (empId: string | number, date: string) => {
        navigate(`/report/action?employee_id=${empId}&date=${date}`);
    };

    const handleExport = () => {
        exportHRActionOverview({
            start_date: range?.from ? dayjs(range.from).format('YYYY-MM-DD') : '',
            end_date: range?.to ? dayjs(range.to).format('YYYY-MM-DD') : (range?.from ? dayjs(range.from).format('YYYY-MM-DD') : ''),
            search,
            branch_id: branchId === 'all' ? undefined : branchId,
            designation_id: designationId === 'all' ? undefined : designationId,
            employee_id: employeeId === 'all' ? undefined : employeeId,
        });
    };

    return (
        <div>
            <FilterBar
                icon={<IconReport className="w-6 h-6 text-primary" />}
                title={t('action_log_overview', 'Action Log Overview')}
                description={t('overview_log_desc', 'Track all employee events and activities in real-time across the organization.')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onRefresh={async () => { await refetch(); }}
                hasActiveFilters={branchId !== 'all' || designationId !== 'all' || employeeId !== 'all' || !!search}
                onClearFilters={() => {
                    setBranchId('all');
                    setDesignationId('all');
                    setEmployeeId('all');
                    setSearch('');
                    setRange({ from: dayjs().startOf('month').toDate(), to: dayjs().toDate() });
                }}
                preActions={
                    <DateRangePicker 
                        value={range}
                        onChange={setRange}
                        className="w-[280px]"
                        align='end'
                    />
                }
                onExport={handleExport}
            >
                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('employee', 'Employee')}</span>
                    <SearchableSelect
                        options={[
                            { value: 'all', label: t('all_employees', 'All Employees') },
                            ...(filterEmployees?.map((e: any) => ({ 
                                value: String(e.id), 
                                label: e.full_name,
                                description: e.employee_id || e.employee_code
                            })) || [])
                        ]}
                        value={employeeId}
                        onChange={(val) => setEmployeeId(String(val))}
                        placeholder={t('select_employee', 'Select Employee')}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('branch', 'Branch')}</span>
                    <SearchableSelect
                        options={[
                            { value: 'all', label: t('all_branches', 'All Branches') },
                            ...(branches?.map((b: any) => ({ value: String(b.id), label: b.name })) || [])
                        ]}
                        value={branchId}
                        onChange={(val) => setBranchId(String(val))}
                        placeholder={t('select_branch', 'Select Branch')}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('position', 'Position')}</span>
                    <SearchableSelect
                        options={[
                            { value: 'all', label: t('all_positions', 'All Positions') },
                            ...(designations?.map((d: any) => ({ value: String(d.id), label: d.name })) || [])
                        ]}
                        value={designationId}
                        onChange={(val) => setDesignationId(String(val))}
                        placeholder={t('select_position', 'Select Position')}
                    />
                </div>
            </FilterBar>

            {isLoading ? (
                    <TableSkeleton rows={itemsPerPage} columns={6} />
            ) : actions.length === 0 ? (
                    <EmptyState 
                        isSearch={!!search}
                        searchTerm={search}
                        onClearFilter={!!search ? () => setSearch('') : undefined}
                        title={!!search ? undefined : t('no_actions_found', 'No Actions Found')} 
                        description={!!search ? undefined : t('no_actions_desc', 'No attendance or activity records found for the selected period.')} 
                        illustration={!!search ? undefined : <IconActivity size={64} className="text-primary/20" />}
                    />
            ) : (
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden rounded-xl">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                            <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                <TableHead className="w-[60px] font-black uppercase text-[10px] tracking-widest text-slate-500 py-4 pl-8">#</TableHead>
                                <TableHead className="w-[250px] font-black uppercase text-xs tracking-wider text-slate-500 py-4 pl-4">{t('employee', 'Employee')}</TableHead>
                                <TableHead className="font-black uppercase text-xs tracking-wider text-slate-500">{t('date_time', 'Date & Time')}</TableHead>
                                <TableHead className="font-black uppercase text-xs tracking-wider text-slate-500">{t('action', 'Action')}</TableHead>
                                <TableHead className="font-black uppercase text-xs tracking-wider text-slate-500">{t('description', 'Description')}</TableHead>
                                <TableHead className="font-black uppercase text-xs tracking-wider text-slate-500">{t('location', 'Location')}</TableHead>
                                <TableHead className="text-center font-black uppercase text-xs tracking-wider text-slate-500 py-4 pr-8">{t('view', 'View')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {actions.map((action: any, index: number) => (
                                <TableRow key={action.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 border-slate-50 dark:border-slate-800/50 transition-colors">
                                    <TableCell className="py-5 pl-8 text-xs font-bold text-slate-400">
                                        {(page - 1) * itemsPerPage + index + 1}
                                    </TableCell>
                                    <TableCell className="py-5 pl-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <Avatar className="w-10 h-10 rounded-full border border-primary/20 ">
                                                    <AvatarImage src={action.employee.profile_image} alt={action.employee.full_name} className="object-cover" />
                                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm uppercase">
                                                        {action.employee.full_name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className={cn(
                                                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-white dark:border-slate-900 flex items-center justify-center shadow-sm",
                                                    action.type === 'attendance' ? "bg-emerald-500" : "bg-amber-500"
                                                )}>
                                                    {action.type === 'attendance' ? <IconClock size={10} className="text-white" /> : <IconActivity size={10} className="text-white" />}
                                                </div>
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-black text-slate-800 dark:text-slate-100 truncate group-hover:text-primary transition-colors">
                                                    <HighlightText text={action.employee.full_name} highlight={search} />
                                                </span>
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                    ID: <HighlightText text={action.employee.employee_id} highlight={search} />
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                {formatDate(action.date)}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-tight">
                                                <IconClock size={10} />
                                                {formatTime(action.time)} • {dayjs(action.time).fromNow()}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={action.type === 'attendance' ? 'success' : 'warning'} 
                                        >
                                            {action.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[200px]">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                                                <HighlightText text={action.description} highlight={search} />
                                            </p>
                                            {action.status && (
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest",
                                                    action.status === 'Late' ? "text-rose-500" : "text-emerald-500"
                                                )}>
                                                    {action.status}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {action.location ? (
                                            <button 
                                                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(action.location)}`, '_blank')}
                                                className="flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-primary transition-all duration-200 truncate max-w-[180px] group/loc text-left"
                                                title={t('view_on_google_maps', 'View on Google Maps')}
                                            >
                                                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover/loc:bg-primary/10 transition-all duration-200">
                                                    <IconMapPin size={12} className="text-primary/70 group-hover/loc:text-primary" />
                                                </div>
                                                <span className="truncate border-b border-dashed border-transparent group-hover/loc:border-primary/30 pb-0.5">
                                                    <HighlightText text={action.location} highlight={search} />
                                                </span>
                                            </button>
                                        ) : (
                                            <span className="text-[11px] font-bold text-slate-400 italic">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <ActionButtons 
                                            onView={() => handleViewTimeline(action.employee.id, action.date)}
                                            viewLabel={t('view_details', 'View Details')}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Pagination 
                        currentPage={page}
                        totalPages={meta?.last_page || 1}
                        totalItems={meta?.total || 0}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setPage}
                    />
                </Card>
            )}
        </div>
    );
};

export default ActionOverview;
