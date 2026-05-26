import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import { 
    IconActivity, 
    IconClock, 
    IconCalendar, 
    IconUser, 
    IconInfoCircle,
    IconPlayerPlay,
    IconPlayerStop,
    IconCoffee,
    IconReport
} from '@tabler/icons-react';
import FilterBar from '@/components/ui/FilterBar';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useHRActionReport, useHRFilterEmployees, exportHRActionReport } from '@/hooks/useHRData';
import { DateRange } from 'react-day-picker';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import EmptyState from '@/components/ui/EmptyState';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { Card } from '@/components/ui/card';

// Sub-components
import StatsCards from './components/StatsCards';
import ActionList from './components/ActionList';
import ActionTimeline from './components/ActionTimeline';
import { ImagePreviewModal } from '@/components/ui/image-preview-modal';

const ActionReport = () => {
    const { t } = useTranslation('report');
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const urlEmployeeId = searchParams.get('employee_id');
    const urlDate = searchParams.get('date');

    useEffect(() => {
        dispatch(setPageTitle(t('action_report', 'Action Report')));
    }, [dispatch, t]);

    // Filters State
    const [range, setRange] = useState<DateRange | undefined>({
        from: urlDate ? dayjs(urlDate).startOf('day').toDate() : dayjs().startOf('month').toDate(),
        to: urlDate ? dayjs(urlDate).endOf('day').toDate() : dayjs().endOf('month').toDate(),
    });
    const [employeeId, setEmployeeId] = useState<string | number>(urlEmployeeId || '');
    const [isExporting, setIsExporting] = useState(false);

    // Selection & Highlighting
    const [activeActionId, setActiveActionId] = useState<string | null>(null);
    const timelineRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Image Preview State
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewSrc, setPreviewSrc] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');

    // Hooks
    const { data: employeesData, isLoading: isLoadingEmployees } = useHRFilterEmployees(true);
    const { data: reportData, isLoading: isLoadingReport, refetch } = useHRActionReport({
        employee_id: String(employeeId),
        start_date: range?.from ? dayjs(range.from).format('YYYY-MM-DD') : '',
        end_date: range?.to ? dayjs(range.to).format('YYYY-MM-DD') : '',
    });

    const scrollToTimelineItem = (id: string) => {
        setActiveActionId(id);
        const element = timelineRefs.current[id];
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const employeeOptions = useMemo(() => {
        const employees = Array.isArray(employeesData) ? employeesData : (employeesData?.data || []);
        return employees.map((emp: any) => ({
            value: emp.id,
            label: emp.full_name,
            description: emp.employee_code || emp.employee_id
        }));
    }, [employeesData]);

    const handleExport = async () => {
        if (!employeeId || !range?.from || !range?.to) {
            toast.error(t('select_employee_and_date_range', 'Please select an employee and date range.'));
            return;
        }

        setIsExporting(true);
        const toastId = toast.loading(t('exporting_report', 'Exporting Report...'));
        try {
            await exportHRActionReport({
                employee_id: String(employeeId),
                start_date: dayjs(range.from).format('YYYY-MM-DD'),
                end_date: dayjs(range.to).format('YYYY-MM-DD'),
            });
            toast.success(t('export_success', 'Report exported successfully!'), { id: toastId });
        } catch (err) {
            toast.error(t('export_failed', 'Export failed'), { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    const getEventIcon = (category: string) => {
        switch (category) {
            case 'clock_in': return <IconPlayerPlay className="w-4 h-4 text-emerald-500" />;
            case 'clock_out': return <IconPlayerStop className="w-4 h-4 text-rose-500" />;
            case 'session_break': return <IconCoffee className="w-4 h-4 text-amber-500" />;
            case 'activity': return <IconActivity className="w-4 h-4 text-primary" />;
            default: return <IconInfoCircle className="w-4 h-4 text-slate-400" />;
        }
    };

    const getEventColor = (category: string) => {
        switch (category) {
            case 'clock_in': return 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900';
            case 'clock_out': return 'bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900';
            case 'session_break': return 'bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900';
            case 'activity': return 'bg-primary/5 border-primary/10 dark:bg-primary/10 dark:border-primary/20';
            default: return 'bg-slate-50 border-slate-100 dark:bg-slate-900 dark:border-slate-800';
        }
    };

    const openPreview = (src: string, title: string) => {
        setPreviewSrc(src);
        setPreviewTitle(title);
        setPreviewOpen(true);
    };

    return (
        <div>
            <FilterBar
                icon={<IconReport className="w-6 h-6 text-primary" />}
                title={t('monthly_action_report', 'Monthly Action Report')}
                description={t('monthly_action_report_desc', 'Consolidated timeline of attendance and activity logs.')}
                search=""
                setSearch={() => {}}
                itemsPerPage={0}
                setItemsPerPage={() => {}}
                hideFilter={false}
                onRefresh={async () => { await refetch(); }}
                onExport={handleExport}
                isExporting={isExporting}
                hasActiveFilters={!!employeeId}
                onClearFilters={() => {
                    setEmployeeId('');
                    setRange({
                        from: dayjs().startOf('month').toDate(),
                        to: dayjs().endOf('month').toDate(),
                    });
                }}
            >
                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('employee', 'Employee')}</span>
                    <SearchableSelect
                        options={employeeOptions}
                        value={employeeId}
                        onChange={setEmployeeId}
                        placeholder={t('select_employee', 'Select Employee')}
                        loading={isLoadingEmployees}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('date_range', 'Date Range')}</span>
                    <DateRangePicker
                        value={range}
                        onChange={setRange}
                        className="w-full"
                    />
                </div>
            </FilterBar>

            {!employeeId ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                    <EmptyState 
                        title={t('select_employee_to_view_report', 'Select Employee')} 
                        description={t('select_employee_desc', 'Please select an employee to view their daily actions.')} 
                        illustration={<IconUser size={64} className="text-primary/20" />}
                    />
                    <div className="w-full max-w-xs px-4">
                        <SearchableSelect
                            options={employeeOptions}
                            value={employeeId}
                            onChange={setEmployeeId}
                            placeholder={t('select_employee', 'Select Employee')}
                            loading={isLoadingEmployees}
                        />
                    </div>
                </div>
            ) : isLoadingReport ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="animate-pulse h-24 bg-slate-100 dark:bg-slate-900" />
                        <Card className="animate-pulse h-24 bg-slate-100 dark:bg-slate-900" />
                        <Card className="animate-pulse h-24 bg-slate-100 dark:bg-slate-900" />
                    </div>
                    <TableSkeleton rows={10} columns={1} />
                </div>
            ) : reportData?.actions?.length === 0 ? (
                <EmptyState 
                    title={t('no_actions_found', 'No Actions Found')} 
                    description={t('no_actions_desc', 'No attendance or activity records found for the selected period.')} 
                    isSearch={true}
                />
            ) : (
                <div className="space-y-6">
                    {/* Stats Header with Employee Info */}
                    <StatsCards 
                        stats={reportData.stats} 
                        employee={reportData.employee} 
                    />

                    {/* 2-Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <ActionList 
                            actions={reportData.actions}
                            activeActionId={activeActionId}
                            onActionClick={scrollToTimelineItem}
                            getEventColor={getEventColor}
                            getEventIcon={getEventIcon}
                        />

                        <ActionTimeline 
                            actions={reportData.actions}
                            activeActionId={activeActionId}
                            timelineRefs={timelineRefs}
                            getEventColor={getEventColor}
                            getEventIcon={getEventIcon}
                            openPreview={openPreview}
                        />
                    </div>
                </div>
            )}

            <ImagePreviewModal 
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                src={previewSrc}
                title={previewTitle}
            />
        </div>
    );
};

export default ActionReport;
