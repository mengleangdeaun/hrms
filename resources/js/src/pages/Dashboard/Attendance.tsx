import { useState, useMemo, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import { DateRange } from 'react-day-picker';
import dayjs from 'dayjs';
import { useAttendanceDashboardData } from '@/hooks/useHRData';
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { IRootState } from '@/store';

// Sub-components
import AttendanceHeader from './Attendance/components/AttendanceHeader';
import AttendanceStats from './Attendance/components/AttendanceStats';
import AttendanceTrends from './Attendance/components/AttendanceTrends';
import AttendanceDistribution from './Attendance/components/AttendanceDistribution';
import AttendanceWorkHealth from './Attendance/components/AttendanceWorkHealth';
import AttendanceChampions from './Attendance/components/AttendanceChampions';
import StatInspectorModal from './Attendance/components/StatInspectorModal';
import { containerVariants } from './Attendance/components/constants';

const AttendanceDashboard = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const isDark = themeConfig.theme === 'dark' || (themeConfig.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const [dateFilter, setDateFilter] = useState<DateRange | undefined>({
        from: dayjs().toDate(),
        to: dayjs().toDate()
    });

    const [branchId, setBranchId] = useState<number | string | null>(null);
    const [inspectorType, setInspectorType] = useState<string | null>(null);

    useEffect(() => {
        dispatch(setPageTitle(t('attendance_dashboard', 'Attendance Dashboard')));
    }, [dispatch, t]);

    const apiFilters = useMemo(() => ({
        start_date: dateFilter?.from ? dayjs(dateFilter.from).format('YYYY-MM-DD') : undefined,
        end_date: dateFilter?.to ? dayjs(dateFilter.to).format('YYYY-MM-DD') : undefined,
        branch_id: branchId === 'all' ? undefined : branchId
    }), [dateFilter, branchId]);

    const { data, isLoading, refetch, isRefetching } = useAttendanceDashboardData(apiFilters);

    const handleRefresh = useCallback(async () => {
        try {
            await queryClient.invalidateQueries({ queryKey: ['attendance-dashboard'], exact: false });
            await refetch();
        } catch (error) {
            console.error('Refresh failed:', error);
        }
    }, [queryClient, refetch]);

    const isTodayOnly = useMemo(() => {
        if (!dateFilter?.from || !dateFilter?.to) return true;
        return dayjs(dateFilter.from).isSame(dateFilter.to, 'day');
    }, [dateFilter]);

    const handleInspect = useCallback((type: string) => {
        setInspectorType(type);
    }, []);

    const handleCloseInspector = useCallback(() => {
        setInspectorType(null);
    }, []);

    if (isLoading && !data) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-64" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="md:col-span-2 h-96 rounded-xl" />
                    <Skeleton className="h-96 rounded-xl" />
                </div>
                <Skeleton className="h-72 rounded-xl" />
            </div>
        );
    }

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6 pb-8"
        >
            <AttendanceHeader 
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                onRefresh={handleRefresh}
                isLoading={isLoading}
                isRefetching={isRefetching}
                branchId={branchId}
                setBranchId={setBranchId}
            />

            <AttendanceStats 
                data={data}
                isTodayOnly={isTodayOnly}
                onInspect={handleInspect}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <AttendanceTrends data={data} isDark={isDark} />
                <AttendanceDistribution data={data} isDark={isDark} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <AttendanceWorkHealth 
                    data={data} 
                    isDark={isDark} 
                    apiFilters={apiFilters} 
                    onInspect={handleInspect} 
                />
                <AttendanceChampions data={data} />
            </div>

            <StatInspectorModal 
                type={inspectorType}
                date={apiFilters.start_date}
                branchId={apiFilters.branch_id}
                onClose={handleCloseInspector}
            />
        </motion.div>
    );
};

export default AttendanceDashboard;
