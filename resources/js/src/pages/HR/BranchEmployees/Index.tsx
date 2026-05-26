import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IconUser, IconTools, IconClock, IconCheck, IconX, IconBriefcase, IconArrowRight, IconSearch, IconInfoCircle } from '@tabler/icons-react';
import { toast } from 'sonner';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import { Badge } from '../../../components/ui/badge';
import { useBranchEmployees, useUpdateBranchEmployee } from '@/hooks/useJobCardData';
import { useHRBranches } from '@/hooks/useHRData';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from '@/components/ui/avatar';
import { IconBuildingStore, IconPackage, IconUsers } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFormatDate } from '@/hooks/useFormatDate';
import HighlightText from '@/components/ui/HighlightText';

const BranchEmployeeIndex = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { formatDate } = useFormatDate();
    const { data: branches = [], isLoading: loadingBranches } = useHRBranches();
    const [selectedBranchId, setSelectedBranchId] = useState<string | number | null>(null);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [roleFilter, setRoleFilter] = useState<'all' | 'technician' | 'qc_person'>('all');

    const { data: employees = [], isLoading: loadingEmployees, refetch } = useBranchEmployees(selectedBranchId ? Number(selectedBranchId) : undefined);
    const updateMutation = useUpdateBranchEmployee();

    // Set initial branch
    useEffect(() => {
        if (branches.length > 0 && !selectedBranchId) {
            setSelectedBranchId(branches[0].id);
        }
    }, [branches, selectedBranchId]);

    const isLoading = loadingBranches || loadingEmployees;

    // Reset pagination when search or branch changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedBranchId]);

    const handleToggleTechnician = (id: number, ulid: string, isTechnician: boolean) => {
        updateMutation.mutate({ id, ulid, updates: { is_technician: isTechnician } });
    };

    const handleToggleQCPerson = (id: number, ulid: string, isQCPerson: boolean) => {
        updateMutation.mutate({ id, ulid, updates: { is_qc_person: isQCPerson } });
    };

    const handleToggleActive = (id: number, ulid: string, isActive: boolean) => {
        updateMutation.mutate({ id, ulid, updates: { is_active: isActive } });
    };

    const filteredEmployees = useMemo(() => {
        let result = employees;
        if (roleFilter === 'technician') {
            result = result.filter((e: any) => e.is_technician);
        } else if (roleFilter === 'qc_person') {
            result = result.filter((e: any) => e.is_qc_person);
        }

        if (!search) return result;
        const q = search.toLowerCase();
        return result.filter((e: any) => 
            e.full_name?.toLowerCase().includes(q) ||
            e.employee_id?.toLowerCase().includes(q) ||
            e.designation?.name?.toLowerCase().includes(q)
        );
    }, [employees, search]);

    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const paginatedEmployees = filteredEmployees.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const branchOptions = useMemo(() => 
        branches.map((b: any) => ({ value: b.id, label: b.name, description: b.code })),
    [branches]);

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['hr-branches'] });
        if (selectedBranchId) {
            queryClient.invalidateQueries({ queryKey: ['branch-employees', Number(selectedBranchId)] });
        }
    };

    return (
        <div className="space-y-6">


            <FilterBar
                icon={<IconBriefcase className="w-6 h-6 text-primary" />}
                title={t('branch_employees_title')}
                description={t('branch_employees_desc')}
                search={search}
                setSearch={setSearch}
                onRefresh={handleRefresh}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                hasActiveFilters={roleFilter !== 'all' || selectedBranchId !== null}
                onClearFilters={() => {
                    setRoleFilter('all');
                    setSelectedBranchId(null);
                }}
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('branch_label')}</span>
                    <SearchableSelect
                        options={branchOptions}
                        value={selectedBranchId}
                        onChange={(val) => setSelectedBranchId(val)}
                        placeholder={t('select_branch_placeholder')}
                        loading={loadingBranches}
                    />
                </div>
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('role_filter_label', 'Specialized Role')}</span>
                    <SearchableSelect
                        options={[
                            { label: t('all_roles', 'All Roles'), value: 'all' },
                            { label: t('technician_only', 'Technicians Only'), value: 'technician' },
                            { label: t('qc_personnel_only', 'QC Personnel Only'), value: 'qc_person' }
                        ]}
                        value={roleFilter}
                        onChange={(val) => setRoleFilter(val as any)}
                        placeholder={t('select_role_filter', 'Filter by Role')}
                    />
                </div>
            </FilterBar>

                        {/* Quick Summary Top Bar */}
            {selectedBranchId && employees.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/50">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('total_staff_label')}</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{employees.length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <IconUsers size={24} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/50">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{t('technicians_label')}</p>
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                    {employees.filter((e: any) => e.is_technician).length}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <IconTools size={24} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/50">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">{t('qc_personnel_label', 'QC Personnel')}</p>
                                <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                                    {employees.filter((e: any) => e.is_qc_person).length}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                                <IconCheck size={24} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div>
                {isLoading ? (
                                <TableSkeleton columns={5} rows={10} />
                            ) : !selectedBranchId ? (
                                <div className="p-20 text-center">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                        <IconBuildingStore size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('select_branch_first')}</h3>
                                    <p className="text-gray-500 text-sm max-w-xs mx-auto mt-2">{t('select_branch_sidebar_desc')}</p>
                                </div>
                            ) : filteredEmployees.length === 0 ? (
                                <EmptyState 
                                    isSearch={!!search} 
                                    searchTerm={search} 
                                    onClearFilter={() => setSearch('')}
                                    title={t('no_employees_found_title')}
                                    description={search ? t('adjust_search_filters') : t('no_employees_branch_desc')}
                                />
                            ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b dark:border-gray-800">
                                            <th className="font-black uppercase tracking-wide text-gray-400">#</th>
                                            <th className="font-black uppercase tracking-wide text-gray-400">{t('employee_details_table_header')}</th>
                                            <th className="font-black uppercase tracking-wide text-gray-400">{t('designation_label')}</th>
                                            <th className="font-black uppercase tracking-wide text-gray-400 text-center">
                                                <div className="flex items-center justify-center gap-1.5 cursor-help group">
                                                    {t('technician_label', 'Technician')}
                                                    <Popover>
                                                        <PopoverTrigger asChild title={t('about_tech_role_title')}>
                                                            <IconInfoCircle size={14} className="text-gray-300 group-hover:text-primary transition-colors cursor-pointer" />
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-80 p-5 rounded-xl border-gray-100 dark:border-gray-800 shadow-2xl z-[100]">
                                                            <div className="space-y-4 text-left">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                                        <IconTools size={18} />
                                                                    </div>
                                                                    <h4 className="font-black text-xs uppercase tracking-widest">{t('active_tech_role_title')}</h4>
                                                                </div>
                                                                <p className="text-[11px] leading-relaxed text-gray-500 font-medium normal-case">
                                                                    {t('active_tech_role_desc')}
                                                                </p>
                                                                <div className="pt-3 border-t dark:border-gray-800 flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
                                                                    <IconCheck size={12} />
                                                                    {t('enables_task_assignment_label')}
                                                                </div>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </th>
                                            <th className="font-black uppercase tracking-wide text-gray-400 text-center">
                                                <div className="flex items-center justify-center gap-1.5 cursor-help group">
                                                    {t('qc_person_label', 'QC Person')}
                                                    <Popover>
                                                        <PopoverTrigger asChild title={t('about_qc_role_title')}>
                                                            <IconInfoCircle size={14} className="text-gray-300 group-hover:text-amber-500 transition-colors cursor-pointer" />
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-80 p-5 rounded-xl border-gray-100 dark:border-gray-800 shadow-2xl z-[100]">
                                                            <div className="space-y-4 text-left">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                                                        <IconCheck size={18} />
                                                                    </div>
                                                                    <h4 className="font-black text-xs uppercase tracking-widest">{t('qc_role_title', 'Quality Control Inspector')}</h4>
                                                                </div>
                                                                <p className="text-[11px] leading-relaxed text-gray-500 font-medium normal-case">
                                                                    {t('qc_role_desc', 'Grants the employee the authority to perform Quality Control audits and sign off on completed Job Cards across all branches.')}
                                                                </p>
                                                                <div className="pt-3 border-t dark:border-gray-800 flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
                                                                    <IconCheck size={12} />
                                                                    {t('cross_branch_access', 'Cross-Branch Auditing Enabled')}
                                                                </div>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </th>
                                            <th className="font-black uppercase tracking-wide text-gray-400">
                                                <div className="flex items-center gap-1.5 cursor-help group">
                                                    {t('status_label')}
                                                    <Popover>
                                                        <PopoverTrigger asChild title={t('about_status_title')}>
                                                            <IconInfoCircle size={14} className="text-gray-300 group-hover:text-primary transition-colors cursor-pointer" />
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-80 p-5 rounded-xl border-gray-100 dark:border-gray-800 shadow-2xl z-[100]">
                                                            <div className="space-y-4 text-left">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                                        <IconUser size={18} />
                                                                    </div>
                                                                    <h4 className="font-black text-xs uppercase tracking-widest">{t('employee_active_status_title')}</h4>
                                                                </div>
                                                                <p className="text-[11px] leading-relaxed text-gray-500 font-medium normal-case">
                                                                    {t('employee_active_status_desc')}
                                                                </p>
                                                                <div className="pt-3 border-t dark:border-gray-800 flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
                                                                    <IconCheck size={12} />
                                                                    {t('system_wide_visibility_control_label')}
                                                                </div>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </th>
                                            <th className="font-black uppercase tracking-wide text-gray-400 text-right">{t('updated_at_label')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                        {paginatedEmployees.map((emp: any, index: number) => (
                                            <tr key={emp.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/20 transition-colors group">
                                                <td className="text-start text-gray-400 text-xs font-medium">
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar className="w-12 h-12 rounded-full shadow-inner border border-primary/10">
                                                            <AvatarImage src={emp.profile_image_url} alt={emp.full_name} className="object-cover" />
                                                            <AvatarFallback className="rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-black">
                                                                {emp.full_name?.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-black text-gray-900 dark:text-gray-100">
                                                                <HighlightText text={emp.full_name} highlight={search} />
                                                            </div>
                                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                                <HighlightText text={emp.employee_id} highlight={search} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <Badge variant="outline" className="rounded-lg border-gray-100 dark:border-gray-800 text-[10px] font-bold uppercase tracking-widest px-3">
                                                        <HighlightText text={emp.designation?.name || 'Staff'} highlight={search} />
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-center flex-col items-center gap-2">
                                                        <Switch 
                                                            checked={!!emp.is_technician} 
                                                            onCheckedChange={(val) => handleToggleTechnician(emp.id, emp.ulid, val)}
                                                            disabled={updateMutation.isPending}
                                                        />
                                                        <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${emp.is_technician ? 'text-primary' : 'text-gray-300'}`}>
                                                            {emp.is_technician ? t('yes') : t('no')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-center flex-col items-center gap-2">
                                                        <Switch 
                                                            checked={!!emp.is_qc_person} 
                                                            onCheckedChange={(val) => handleToggleQCPerson(emp.id, emp.ulid, val)}
                                                            disabled={updateMutation.isPending}
                                                            className={emp.is_qc_person ? 'data-[state=checked]:bg-amber-500' : ''}
                                                        />
                                                        <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${emp.is_qc_person ? 'text-amber-500' : 'text-gray-300'}`}>
                                                            {emp.is_qc_person ? t('yes') : t('no')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <Switch 
                                                            checked={!!emp.is_active} 
                                                            onCheckedChange={(val) => handleToggleActive(emp.id, emp.ulid, val)}
                                                            disabled={updateMutation.isPending}
                                                        />
                                                        <Badge 
                                                        size='sm'
                                                        variant={emp.is_active ? 'success' : 'destructive'}>
                                                            {emp.is_active ? t('active') : t('inactive')}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                        {formatDate(emp.updated_at)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                        </div>
                           

                        {filteredEmployees.length > itemsPerPage && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={filteredEmployees.length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={setCurrentPage}
                                />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BranchEmployeeIndex;
