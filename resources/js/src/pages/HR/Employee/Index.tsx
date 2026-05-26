import { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconUser, IconUpload, IconDownload } from '@tabler/icons-react';
import { Badge } from '../../../components/ui/badge';
import { useHREmployees, useHRDeleteEmployee, exportEmployees, useHRImportEmployees, useHRBranches, useHRDepartments, useHRImportChunk } from '@/hooks/useHRData';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { Progress } from '@/components/ui/progress';
import { useQueryClient } from '@tanstack/react-query';
import HighlightText from '@/components/ui/HighlightText';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { FileIcon } from '@/components/illustrations/FileExtension';
import { useAuth } from '@/hooks/useAuth';

const EmployeeIndex = () => {
    const { t } = useTranslation();
    const { hasPermission } = useAuth();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    useEffect(() => {
        dispatch(setPageTitle(t('hr_employees')));
    }, [dispatch, t]);

    // Filter & Sort & Pagination state
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('full_name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [branchFilter, setBranchFilter] = useState('all');
    const [departmentFilter, setDepartmentFilter] = useState('all');

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | string | null>(null);

    // Import state
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);

    // TanStack Query
    const { data: rawEmployees = [], isLoading: rawLoading } = useHREmployees();
    const loading = useDelayedLoading(rawLoading, 500);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const deleteMutation = useHRDeleteEmployee();
    const importMutation = useHRImportEmployees();
    const importChunkMutation = useHRImportChunk();

    const { data: branches = [] } = useHRBranches();
    const { data: departments = [] } = useHRDepartments();

    const filteredDepartments = useMemo(() => {
        if (branchFilter === 'all') return departments;
        return departments.filter((dept: any) => 
            dept.branches?.some((b: any) => b.id.toString() === branchFilter)
        );
    }, [departments, branchFilter]);

    useEffect(() => {
        if (branchFilter !== 'all' && departmentFilter !== 'all') {
            const currentDept = departments.find((d: any) => d.id.toString() === departmentFilter);
            if (currentDept && !currentDept.branches?.some((b: any) => b.id.toString() === branchFilter)) {
                setDepartmentFilter('all');
            }
        }
    }, [branchFilter, departments, departmentFilter]);

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            setIsImporting(true);
            setImportProgress(0);

            try {
                const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) {
                    toast.error(t('invalid_csv_format', 'Invalid CSV format'));
                    setIsImporting(false);
                    return;
                }

                // Parse headers
                const headers = lines[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim());
                const dataLines = lines.slice(1);
                
                // Convert to objects
                const rows = dataLines.map(line => {
                    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
                    const row: any = {};
                    headers.forEach((header, i) => {
                        row[header] = values[i] || '';
                    });
                    return row;
                });

                const chunkSize = 20;
                const totalChunks = Math.ceil(rows.length / chunkSize);
                let importedCount = 0;

                for (let i = 0; i < totalChunks; i++) {
                    const chunk = rows.slice(i * chunkSize, (i + 1) * chunkSize);
                    const result = await importChunkMutation.mutateAsync(chunk);
                    importedCount += result.imported;
                    setImportProgress(Math.round(((i + 1) / totalChunks) * 100));
                }

                toast.success(t('import_success_msg', 'Successfully imported {{count}} employees', { count: importedCount }));
                queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
                setImportModalOpen(false);
            } catch (err: any) {
                toast.error(err.response?.data?.message || t('import_failed', 'Import failed'));
            } finally {
                setIsImporting(false);
                setImportProgress(0);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };
    
    const handleDownloadSample = () => {
        const headers = 'FullName,EmployeeID,Email,Phone,Gender,Branch,Department,Designation\n';
        const sampleData = 'Sok Sabay,S001,soksabay@gmail.com,012345678,male,Main Branch,IT,Developer\nSao Thida,S002,saothida@yahoo.com,099876543,female,Sub Branch,HR,Manager';
        const blob = new Blob(['\uFEFF' + headers + sampleData], { type: 'text/csv;charset=utf-8;' }); // added BOM for excel compat
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'employee_import_sample.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    };

    const handleExport = async () => {
        try {
            toast.loading(t('exporting', 'Exporting...'), { id: 'export' });
            await exportEmployees({ search }); 
            toast.success(t('export_success', 'Exported successfully'), { id: 'export' });
        } catch (e) {
            toast.error(t('export_error', 'Export failed'), { id: 'export' });
        }
    };

    const employees = Array.isArray(rawEmployees) ? rawEmployees : (rawEmployees.data || []);

    const confirmDelete = (ulid: string) => {
        setItemToDelete(ulid);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        deleteMutation.mutate(itemToDelete, {
            onSuccess: () => {
                toast.success(t('success_delete_employee'));
                setDeleteModalOpen(false);
                setItemToDelete(null);
            },
            onError: () => {
                toast.error(t('failed_delete_employee'));
            }
        });
    };

    // Derived state for table
    const filteredAndSortedEmployees = useMemo(() => {
        let result = [...employees];

        // Search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(e =>
                e.full_name?.toLowerCase().includes(q) ||
                e.employee_id?.toLowerCase().includes(q) ||
                e.branch?.name?.toLowerCase().includes(q) ||
                e.department?.name?.toLowerCase().includes(q) ||
                e.designation?.name?.toLowerCase().includes(q)
            );
        }

        // Branch Filter
        if (branchFilter !== 'all') {
            result = result.filter(e => e.branch?.id?.toString() === branchFilter);
        }

        // Department Filter
        if (departmentFilter !== 'all') {
            result = result.filter(e => e.department?.id?.toString() === departmentFilter);
        }

        // Sort
        result.sort((a, b) => {
            let valA = '';
            let valB = '';

            if (sortBy === 'branch') {
                valA = a.branch?.name || '';
                valB = b.branch?.name || '';
            } else if (sortBy === 'department') {
                valA = a.department?.name || '';
                valB = b.department?.name || '';
            } else if (sortBy === 'designation') {
                valA = a.designation?.name || '';
                valB = b.designation?.name || '';
            } else {
                valA = a[sortBy] || '';
                valB = b[sortBy] || '';
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [employees, search, sortBy, sortDirection, branchFilter, departmentFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedEmployees.length / itemsPerPage);
    const paginatedEmployees = filteredAndSortedEmployees.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page if search or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, branchFilter, departmentFilter]);

    return (
        <div>
            <input type="file" accept=".csv,.txt" className="hidden" ref={fileInputRef} onChange={handleImportFile} />
            <FilterBar
                icon={<IconUser className="w-6 h-6 text-primary" />}
                title={t('hr_employees')}
                description={t('manage_employees_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={hasPermission('create_employees') ? () => navigate('/hr/employees/create') : undefined}
                addLabel={t('add_employee')}
                onExport={handleExport}
                extraActions={
                    hasPermission('create_employees') && (
                        <Button 
                            onClick={() => setImportModalOpen(true)}
                            className="h-9 sm:h-10 w-9 p-0 sm:px-3 sm:w-auto bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-primary border-slate-200 dark:border-slate-800 shadow-sm"
                            variant="outline"
                        >
                            <IconUpload size={18} />
                            <span className="hidden lg:inline ml-2">{t('import', 'Import CSV')}</span>
                        </Button>
                    )
                }
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['hr-employees'] })}
                hasActiveFilters={sortBy !== 'full_name' || sortDirection !== 'asc' || branchFilter !== 'all' || departmentFilter !== 'all'}
                onClearFilters={() => {
                    setSortBy('full_name');
                    setSortDirection('asc');
                    setBranchFilter('all');
                    setDepartmentFilter('all');
                }}
            >
                <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('branch_label', 'Branch')}</span>
                    <Select value={branchFilter} onValueChange={setBranchFilter}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                            <SelectValue placeholder={t('all_branches', 'All Branches')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('all_branches', 'All Branches')}</SelectItem>
                            {branches.map((b: any) => (
                                <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('department_label', 'Department')}</span>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                            <SelectValue placeholder={t('all_departments', 'All Departments')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('all_departments', 'All Departments')}</SelectItem>
                            {filteredDepartments.map((d: any) => (
                                <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>
            {loading ? (
                <TableSkeleton columns={8} rows={itemsPerPage} />
            ) : employees.length === 0 ? (
                <EmptyState
                    title={t('no_employees_found_title')}
                    description={t('start_adding_employee_desc')}
                    actionLabel={hasPermission('create_employees') ? t('add_employee') : undefined}
                    onAction={hasPermission('create_employees') ? () => navigate('/hr/employees/create') : undefined}
                />
            ) : filteredAndSortedEmployees.length === 0 ? (
                <EmptyState
                    isSearch
                    searchTerm={search}
                    onClearFilter={() => {
                        setSearch('');
                        setSortBy('full_name');
                        setSortDirection('asc');
                    }}
                />
            ) : (
    <div className="table-responsive bg-white dark:bg-black rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
                <div className=" table-responsive">
                    <table className="table-hover w-full table">
                        <thead className="border-b dark:border-gray-600">
                            <tr>
                                <th>#</th>
                                <th>{t('photo_label')}</th>
                                <SortableHeader label={t('full_name_label')} value="full_name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('employee_id_label')} value="employee_id" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('branch_label')} value="branch" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('department_label')} value="department" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('designation_label')} value="designation" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('active')} value="is_active" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">{t('action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedEmployees.map((emp: any, index: number) => (
                                <tr key={emp.id}>
                                    <td className="text-start text-gray-400 text-xs font-medium">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td>
                                        {emp.profile_image_url ? (
                                            <img
                                                src={emp.profile_image_url || '/assets/images/user-profile.svg'}
                                                alt={emp.full_name}
                                                className="w-10 h-10 rounded-full object-cover border-2 border-primary/10 shadow-sm"
                                                onError={(e) => {
                                                    e.currentTarget.src = '/assets/images/user-profile.svg';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200 dark:border-gray-700">
                                                {emp.full_name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap font-medium">
                                        <HighlightText text={emp.full_name} highlight={search} />
                                    </td>
                                    <td className="text-xs text-gray-500">
                                        <HighlightText text={emp.employee_id} highlight={search} />
                                    </td>
                                    <td>
                                        <HighlightText text={emp.branch?.name || '—'} highlight={search} />
                                    </td>
                                    <td>
                                        <HighlightText text={emp.department?.name || '—'} highlight={search} />
                                    </td>
                                    <td>
                                        <HighlightText text={emp.designation?.name || '—'} highlight={search} />
                                    </td>
                                    <td>
                                        <Badge 
                                        size='sm'
                                        dot={true}
                                        variant={emp.is_active ? 'success' : 'destructive'}>
                                            {emp.is_active ? t('active') : t('inactive')}
                                        </Badge>
                                    </td>
                                    <td>
                                        <ActionButtons skipDeleteConfirm={true}
                                            onEdit={hasPermission('edit_employees') ? () => navigate(`/hr/employees/${emp.ulid}/edit`) : undefined}
                                            onDelete={hasPermission('delete_employees') ? () => confirmDelete(emp.ulid) : undefined}
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
    </div>
     )}


            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={deleteMutation.isPending}
                title={t('delete_employee_title')}
                message={t('delete_employee_message')}
            />

            <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('import_employees_title', 'Import Employees')}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-6 p-1">
                        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-3">
                            <h4 className="font-bold text-sm text-primary flex items-center gap-2">
                                <IconDownload size={18} />
                                {t('import_instructions_title', 'Instructions')}
                            </h4>
                            <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-400 list-disc pl-4">
                                <li>{t('import_inst_1', 'Download the sample CSV file to see the required format.')}</li>
                                <li>{t('import_inst_2', 'Required columns: FullName, EmployeeID, Email.')}</li>
                                <li>{t('import_inst_3', 'Optional columns: Phone, Gender, Branch, Department, Designation.')}</li>
                                <li>{t('import_inst_4', 'The password will be generated as: Branch Name + Employee ID.')}</li>
                                <li>{t('import_inst_5', 'Ensure the file is saved in .csv format.')}</li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button 
                                variant="outline" 
                                onClick={handleDownloadSample}
                                className="w-full flex items-center justify-center  bg-white shadow dark:bg-dark gap-2 border-dashed border-2 hover:border-primary hover:text-primary transition-all py-10"
                            >
                                <FileIcon type="csv" size={36} />
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-bold">{t('download_sample_csv', 'Download Sample CSV')}</span>
                                    <span className="text-[10px] text-slate-500 font-normal">{t('sample_csv_desc', 'Get the template with example data')}</span>
                                </div>
                            </Button>

                            <Button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isImporting}
                                className="w-full h-12 text-sm font-bold shadow-md"
                            >
                                {isImporting ? (
                                    <span className="animate-pulse">{t('importing', 'Importing...')}</span>
                                ) : (
                                    <>
                                        <IconUpload size={20} className="mr-2" />
                                        {t('select_csv_file', 'Select CSV File to Import')}
                                    </>
                                )}
                            </Button>

                            {isImporting && (
                                <div className="space-y-2 mt-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        <span>{t('import_progress', 'Import Progress')}</span>
                                        <span>{importProgress}%</span>
                                    </div>
                                    <Progress value={importProgress} className="h-2" />
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EmployeeIndex;
