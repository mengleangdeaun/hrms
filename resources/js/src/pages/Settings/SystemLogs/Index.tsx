import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormatDate } from '@/hooks/useFormatDate';
import FilterBar from '@/components/ui/FilterBar';
import TableSkeleton from '@/components/ui/TableSkeleton';
import Pagination from '@/components/ui/Pagination';
import DateRangePicker from '@/components/ui/date-range-picker';
import EmptyState from '@/components/ui/EmptyState';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import DeleteModal from '@/components/DeleteModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconHistory, IconBox, IconClock, IconTrash, IconEraser, IconArrowRight, IconRefresh } from '@tabler/icons-react';
import { DateRange } from "react-day-picker";
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSystemLogs, useSystemLogsDelete, useSystemLogsClear } from '@/hooks/useSystemLogData';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

const SystemLogsIndex = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { formatDateTime } = useFormatDate();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('System Logs'));
    }, [dispatch]);

    // Mapping for Event Types: Label, Color, Type
    const EVENT_METADATA: Record<string, { label: string; color: string }> = {
        'created':     { label: 'event_created',      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
        'updated':     { label: 'event_updated',      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        'deleted':     { label: 'event_deleted',      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
        'post':        { label: 'event_post',         color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
        'put':         { label: 'event_put',          color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
        'patch':       { label: 'event_patch',        color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
        'delete':      { label: 'event_delete',       color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
        'login':       { label: 'event_login',        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
        'login_failed':{ label: 'event_login_failed', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
    };

    const MODULE_MAPPING: Record<string, string> = {
        // Model mappings
        'User':                       'module_hr',
        'Customer':                   'module_crm',
        'SalesOrder':                 'module_sales',
        'InventoryProduct':           'module_inventory',
        'InventoryPurchaseOrder':     'module_inventory',
        'InventoryCategory':          'module_inventory',
        'InventoryTag':               'module_inventory',
        'InventoryUom':               'module_inventory',
        'inventorypurchasereceiving': 'module_inventory',
        'inventorypurchasereturn':    'module_inventory',
        'inventorysalesorder':        'module_sales',
        'inventorysalesreturn':       'module_sales',
        'inventoryadjustment':        'module_inventory',
        'inventorytransfer':          'module_inventory',
        'inventorywarehouse':         'module_inventory',
        
        // Path/Segment mappings
        'hr':                         'module_hr',
        'inventory':                  'module_inventory',
        'stock':                      'module_inventory',
        'procurement':                'module_inventory',
        'sales':                      'module_sales',
        'customers':                  'module_crm',
        'crm':                        'module_crm',
        'settings':                   'module_settings',
        'reports':                    'module_reports',
        'report':                     'module_reports',
        'export':                     'module_reports',
        'auth':                       'module_auth',
        'profile':                    'module_profile',
        'attendance':                 'module_attendance',
        'finance':                    'module_finance',
        'job-cards':                  'module_workshop',
        'workshop':                   'module_workshop',
        'services':                   'module_workshop',
        'qualitycontrol':             'module_workshop',
        'login':                      'module_auth',
        'auth-token':                 'module_auth',
        'system':                     'system_activity',
        'media':                      'system_activity',
        'access-control':             'system_activity',
        'notifications':              'system_activity',
        'backups':                    'system_activity',
        'system-logs':                'system_activity',
        'activity-logs':              'system_activity',
    };


    const getModuleLabel = (log: any) => {
        // 1. Prioritize explicit module metadata from properties (backend-detected)
        const explicitModule = log.properties?.module;
        if (explicitModule) {
            // Check if it's a known module key or needs mapping
            const key = explicitModule.toLowerCase();
            if (MODULE_MAPPING[key]) return t(MODULE_MAPPING[key]);
            
            // If the backend sent a raw module name, try mapping it
            const possibleKey = `module_${key}`;
            // Check if i18next has this key (rough check)
            return t(possibleKey) !== possibleKey ? t(possibleKey) : (t(MODULE_MAPPING[explicitModule]) || explicitModule);
        }

        // 2. Try subject_type mapping (Eloquent fallback)
        if (log.subject_type) {
            const baseClass = log.subject_type.split('\\').pop();
            // Handle User specifically if no properties module
            if (baseClass === 'User' && (log.event === 'login' || log.event === 'login_failed')) {
                return t('module_auth');
            }
            if (baseClass && MODULE_MAPPING[baseClass]) return t(MODULE_MAPPING[baseClass]);
            return baseClass;
        }

        // 3. Try URL path mapping from properties (Frontend-detected fallback)
        const url = (log.properties?.url || '').toLowerCase();
        if (url) {
            // Special cases for login/auth
            if (url.includes('/login') || url.includes('/auth')) return t('module_auth');
            if (url.includes('/user/preferences')) return t('module_profile');

            // Check segments/paths for matches
            for (const [key, label] of Object.entries(MODULE_MAPPING)) {
                if (url.includes(`/${key.toLowerCase()}/`) || url.endsWith(`/${key.toLowerCase()}`)) {
                    return t(label);
                }
            }
        }

        // 4. Fallback based on log_name or general context
        if (log.log_name === 'auth' || log.event?.includes('login')) return t('module_auth');
        
        return t('system_activity');
    };

    // Helper to format log description for readability
    const formatLogDescription = (desc: string) => {
        if (!desc) return '';
        
        // Replace underscores with spaces for readability (e.g. user_logged_in -> user logged in)
        let formatted = desc.toLowerCase().replace(/_/g, ' ').trim();
        
        // Mapping for specific concatenated model names
        const modelMapping: { [key: string]: string } = {
            'inventoryproduct': 'Inventory Product',
            'inventorycategory': 'Inventory Category',
            'inventorytag': 'Inventory Tag',
            'inventoryuom': 'Inventory UOM',
            'inventorypurchaseorder': 'Inventory Purchase Order',
            'inventorypurchasereceiving': 'Inventory Purchase Receiving',
            'customervehicle': 'Customer Vehicle',
            'customertype': 'Customer Type',
            'leaverecord': 'Leave Record',
            'leavebalance': 'Leave Balance',
            'leaveallocation': 'Leave Allocation',
            'attendancepolicy': 'Attendance Policy',
            'workingshift': 'Working Shift',
            'branchqr': 'Branch QR',
            'medialibrary': 'Media Library',
            'salesorder': 'Sales Order',
            'jobcard': 'Job Card',
        };

        const parts = formatted.split(/\s+/);
        
        return parts.map(part => {
            // Check for model name mapping first
            if (modelMapping[part]) return modelMapping[part];
            
            // Mapping for event verbs
            if (part === 'updated') return 'Update';
            if (part === 'created') return 'Create';
            if (part === 'deleted') return 'Delete';
            if (part === 'restored') return 'Restore';
            
            // Default capitalization
            return part.charAt(0).toUpperCase() + part.slice(1);
        }).join(' ');
    };

    const renderDataDiff = (properties: any) => {
        const attributes = properties?.attributes || {};
        const old = properties?.old || {};
        
        const changedKeys = Object.keys(attributes).filter(key => 
            !['updated_at', 'created_at', 'id'].includes(key)
        );

        if (changedKeys.length === 0) return null;

        return (
            <div className="flex flex-col gap-2 mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                {changedKeys.map(key => {
                    const newVal = attributes[key];
                    const oldVal = old[key];
                    
                    // Format values for display (handle null, boolean, nested)
                    const formatVal = (v: any) => {
                        if (v === null) return <span className="text-slate-400 italic text-[10px]">null</span>;
                        if (typeof v === 'boolean') return v ? 'true' : 'false';
                        if (typeof v === 'object') return JSON.stringify(v);
                        return String(v);
                    };

                    return (
                        <div key={key} className="flex flex-col gap-1 group/item">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter w-36 truncate" title={key.replace(/_/g, ' ')}>
                                    {key.replace(/_/g, ' ')}
                                </span>
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {oldVal !== undefined && (
                                        <>
                                            <div className="px-2 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 line-through text-[11px] truncate max-w-[150px]">
                                                {formatVal(oldVal)}
                                            </div>
                                            <IconArrowRight size={12} className="text-slate-300 flex-shrink-0" />
                                        </>
                                    )}
                                    <div className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] truncate flex-1">
                                        {formatVal(newVal)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderInputData = (input: any) => {
        if (!input || typeof input !== 'object') return null;

        const keys = Object.keys(input).filter(k => 
            !['id', 'created_at', 'updated_at', '_token', '_method'].includes(k) && input[k] !== null
        );

        if (keys.length === 0) return null;

        return (
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-4 gap-y-2 mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                {keys.map(key => (
                    <div key={key} className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                            {key.replace(/_/g, ' ')}
                        </span>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded truncate border border-slate-100 dark:border-slate-800" title={String(input[key])}>
                            {String(input[key])}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Filters state
    const [search, setSearch] = useState('');
    const [eventFilter, setEventFilter] = useState('all');
    const [moduleFilter, setModuleFilter] = useState('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);

    // Selection & Modal state
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfig, setDeleteConfig] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        title: '',
        message: '',
        onConfirm: () => {}
    });

    // Filters for Query
    const filters = useMemo(() => {
        const f: any = {};
        if (eventFilter !== 'all') f.event = eventFilter;
        if (moduleFilter !== 'all') f.module = moduleFilter;
        if (search) f.subject_type = search;
        if (dateRange?.from) f.start_date = format(dateRange.from, 'yyyy-MM-dd');
        if (dateRange?.to) f.end_date = format(dateRange.to, 'yyyy-MM-dd');
        return f;
    }, [eventFilter, moduleFilter, search, dateRange]);

    // Queries
    const { data: logsData, isLoading: logsLoading } = useSystemLogs(currentPage, itemsPerPage, filters);
    const logs = logsData?.data || [];
    const total = logsData?.total || 0;

    // Mutations
    const deleteMutation = useSystemLogsDelete();
    const clearMutation = useSystemLogsClear();

    // Loading State
    const loading = useDelayedLoading(logsLoading);

    const handleClearFilters = () => {
        setSearch('');
        setEventFilter('all');
        setModuleFilter('all');
        setDateRange(undefined);
        setCurrentPage(1);
    };

    useEffect(() => {
        setSelectedIds([]);
    }, [currentPage, itemsPerPage, eventFilter, moduleFilter, dateRange, search]);

    // Selection Handlers
    const toggleSelectAll = () => {
        if (selectedIds.length === logs.length && logs.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(logs.map(log => log.id));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Delete Handlers
    const confirmDeleteSelected = () => {
        if (!selectedIds.length) return;
        
        setDeleteConfig({
            title: t('delete_selected_logs', 'Delete Selected Logs'),
            message: t('delete_logs_confirm', 'Are you sure you want to delete {{count}} selected activity logs? This action is permanent and cannot be undone.', { count: selectedIds.length }),
            onConfirm: async () => {
                try {
                    await deleteMutation.mutateAsync(selectedIds);
                    toast.success(t('logs_deleted_successfully', 'Selected logs deleted successfully'));
                    setSelectedIds([]);
                    setIsDeleteModalOpen(false);
                } catch (error) {
                    toast.error(t('failed_delete_logs', 'Failed to delete selected logs'));
                }
            }
        });
        setIsDeleteModalOpen(true);
    };

    const confirmClearAll = () => {
        setDeleteConfig({
            title: t('clear_all_logs', 'Clear All System Logs'),
            message: t('clear_all_logs_confirm', 'CRITICAL: This will permanently delete EVERY activity log in the database. This action is extremely destructive and cannot be reversed.'),
            onConfirm: async () => {
                try {
                    await clearMutation.mutateAsync();
                    toast.success(t('logs_cleared_successfully', 'All system logs have been cleared'));
                    setIsDeleteModalOpen(false);
                } catch (error) {
                    toast.error(t('failed_clear_logs', 'Failed to clear system logs'));
                }
            }
        });
        setIsDeleteModalOpen(true);
    };

    return (
        <div>
            <FilterBar
                icon={<IconHistory className="w-6 h-6 text-primary" />}
                title={t('system_logs')}
                description={t('system_logs_desc', 'Audit trail of all data changes and user actions in the system.')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['system_logs'] })}
                hasActiveFilters={eventFilter !== 'all' || moduleFilter !== 'all' || !!dateRange || !!search}
                onClearFilters={handleClearFilters}
                extraActions={
                    <div className="flex items-center gap-2">
                         {selectedIds.length > 0 && (
                            <Button 
                                variant="soft-destructive" 
                                onClick={confirmDeleteSelected}
                                className="font-bold h-9 sm:h-10 text-xs sm:text-sm"
                            >
                                <IconTrash size={16} className="sm:mr-2" />
                                <span className="hidden xs:inline">{t('delete')} ({selectedIds.length})</span>
                                <span className="xs:hidden">({selectedIds.length})</span>
                            </Button>
                        )}

                        <Button 
                            variant="soft-destructive" 
                            onClick={confirmClearAll}
                            className="h-9 sm:h-10 text-xs sm:text-sm"
                        >
                            <IconEraser size={18} className="sm:mr-2" />
                            <span className="hidden sm:inline">{t('clear_all', 'Clear All')}</span>
                        </Button>
                    </div>
                }
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('date_range')}</span>
                    <DateRangePicker 
                        value={dateRange} 
                        onChange={setDateRange} 
                        placeholder={t('filter_date_range', 'Filter by Date Range')}
                    />
                </div>
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('event_type', 'Event Type')}</span>
                    <Select value={eventFilter} onValueChange={(val) => { setEventFilter(val); setCurrentPage(1); }}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                            <SelectValue placeholder={t('all_events', 'All Events')} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            <SelectItem value="all" className="font-medium">{t('all_events', 'All Events')}</SelectItem>
                            
                            <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/30">{t('data_changes')}</div>
                            <SelectItem value="created">{t('event_created')}</SelectItem>
                            <SelectItem value="updated">{t('event_updated')}</SelectItem>
                            <SelectItem value="deleted">{t('event_deleted')}</SelectItem>

                            <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/30 mt-1">{t('system_requests')}</div>
                            <SelectItem value="post">{t('event_post')}</SelectItem>
                            <SelectItem value="put">{t('event_put')}</SelectItem>
                            <SelectItem value="delete">{t('event_delete')}</SelectItem>

                            <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/30 mt-1">{t('security_events')}</div>
                            <SelectItem value="login">{t('event_login')}</SelectItem>
                            <SelectItem value="login_failed">{t('event_login_failed')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('module', 'Module')}</span>
                    <Select value={moduleFilter} onValueChange={(val) => { setModuleFilter(val); setCurrentPage(1); }}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                            <SelectValue placeholder={t('all_modules', 'All Modules')} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            <SelectItem value="all" className="font-medium">{t('all_modules', 'All Modules')}</SelectItem>
                            <SelectItem value="hr">{t('module_hr')}</SelectItem>
                            <SelectItem value="inventory">{t('module_inventory')}</SelectItem>
                            <SelectItem value="sales">{t('module_sales')}</SelectItem>
                            <SelectItem value="customers">{t('module_crm')}</SelectItem>
                            <SelectItem value="workshop">{t('module_workshop')}</SelectItem>
                            <SelectItem value="finance">{t('module_finance')}</SelectItem>
                            <SelectItem value="profile">{t('module_profile')}</SelectItem>
                            <SelectItem value="attendance">{t('module_attendance')}</SelectItem>
                            <SelectItem value="settings">{t('module_settings')}</SelectItem>
                            <SelectItem value="auth">{t('module_auth')}</SelectItem>
                            <SelectItem value="reports">{t('module_reports')}</SelectItem>
                            <SelectItem value="system">{t('system_activity')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>

                    {loading ? (
                        <TableSkeleton columns={6} rows={10} />
                    ) : (
            <div className="bg-white dark:bg-slate-900 overflow-hidden rounded-xl border shadow-sm">
                <div className="overflow-x-auto">
                        <>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                                    <tr>
                                        <th className="px-6 py-4 w-10 text-center">
                                            <Checkbox 
                                                checked={logs.length > 0 && selectedIds.length === logs.length}
                                                onCheckedChange={toggleSelectAll}
                                                aria-label="Select all"
                                            />
                                        </th>
                                        <th className="px-6 py-4">{t('timestamp')}</th>
                                        <th className="px-6 py-4">{t('causer', 'Causer')}</th>
                                        <th className="px-6 py-4">{t('event')}</th>
                                        <th className="px-6 py-4">{t('module_id', 'Module / ID')}</th>
                                        <th className="px-6 py-4">{t('details_changes', 'Details & Changes')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                                <EmptyState 
                                                    isSearch={!!search || eventFilter !== 'all' || !!dateRange}
                                                    searchTerm={search}
                                                    onClearFilter={handleClearFilters}
                                                    title={t('no_logs_found', 'No activity logs found')}
                                                    description={t('no_logs_desc', "We couldn't find any log entries matching your current filters.")}
                                                />
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log: any) => (
                                            <tr key={log.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${selectedIds.includes(log.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                                                <td className="px-6 py-4 text-center">
                                                    <Checkbox 
                                                        checked={selectedIds.includes(log.id)}
                                                        onCheckedChange={() => toggleSelect(log.id)}
                                                        aria-label={`Select log ${log.id}`}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-900 dark:text-slate-200">
                                                            {formatDateTime(log.created_at)}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            #{log.id}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {log.causer ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative">
                                                                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs overflow-hidden">
                                                                    {log.causer.profile_image_url || log.causer.avatar_url ? (
                                                                        <img src={log.causer.profile_image_url || log.causer.avatar_url} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span>{log.causer.name?.charAt(0) || log.causer.full_name?.charAt(0)}</span>
                                                                    )}
                                                                </div>
                                                                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs ${log.causer_type?.includes('Employee') ? 'bg-amber-500' : 'bg-primary'}`}>
                                                                    {log.causer_type?.includes('Employee') ? <IconClock size={8} className="text-white" /> : <IconHistory size={8} className="text-white" />}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px] leading-tight" title={log.causer.name || log.causer.full_name}>
                                                                    {log.causer.name || log.causer.full_name}
                                                                </span>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                                                        log.causer_type?.includes('Employee') 
                                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                                                                            : 'bg-primary/10 text-primary dark:bg-primary/20'
                                                                    }`}>
                                                                        {log.causer_type?.includes('Employee') ? t('employee') : t('user')}
                                                                    </span>
                                                                    {log.causer.employee_id && (
                                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                                            #{log.causer.employee_id}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-slate-400 italic text-[11px]">
                                                            <IconClock size={14} />
                                                            {t('system_process', 'System Process')}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider 
                                                        ${EVENT_METADATA[log.event]?.color || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'}
                                                    `}>
                                                        {EVENT_METADATA[log.event] ? t(EVENT_METADATA[log.event].label) : log.event}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-1.5 font-bold text-[11px] bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg w-fit border border-slate-200 dark:border-slate-700">
                                                            <IconBox size={14} className="text-primary/60" />
                                                            <span className="text-slate-900 dark:text-slate-100">
                                                                {getModuleLabel(log)}
                                                            </span>
                                                        </div>
                                                        {log.subject_id && (
                                                            <span className="text-[10px] text-slate-400 ml-1">
                                                                Subject ID: {log.subject_id}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 max-w-md">
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                                        {formatLogDescription(log.description)}
                                                    </p>
                                                    
                                                    {/* Smart Data Diff for Model Changes */}
                                                    {log.properties?.attributes && renderDataDiff(log.properties)}

                                                    {/* Clean Input Summary for Creation (POST) logs */}
                                                    {!log.subject_type && log.properties?.input && renderInputData(log.properties.input)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            
                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(total / itemsPerPage)}
                                totalItems={total}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </>
                   
                </div>
            </div>
 )}
            <DeleteModal 
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
                title={deleteConfig.title}
                message={deleteConfig.message}
                onConfirm={deleteConfig.onConfirm}
                isLoading={deleteMutation.isPending || clearMutation.isPending}
            />
        </div>
    );
};

export default SystemLogsIndex;
