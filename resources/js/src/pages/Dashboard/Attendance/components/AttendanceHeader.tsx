import React from 'react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { IconLayoutDashboard, IconRefresh } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import BranchSelector from '@/components/Shared/BranchSelector';

interface AttendanceHeaderProps {
    dateFilter: DateRange | undefined;
    setDateFilter: (val: DateRange) => void;
    onRefresh: () => void;
    isLoading: boolean;
    isRefetching: boolean;
    branchId: number | string | null;
    setBranchId: (id: any) => void;
}

const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({ 
    dateFilter, 
    setDateFilter, 
    onRefresh, 
    isLoading, 
    isRefetching,
    branchId,
    setBranchId
}) => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 sm:p-3 rounded-xl shrink-0 border border-primary/20 shadow-sm">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-primary">
                        <IconLayoutDashboard />
                    </div>
                </div>
                <div>
                    <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 truncate">
                        {t('attendance_analytics', 'Attendance Analytics')}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium tracking-tight">
                        {t('attendance_subtitle', 'Daily workforce oversight and presence tracking')}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="w-[180px]">
                    <BranchSelector 
                        value={branchId || 'all'}
                        onChange={(val) => setBranchId(val === 'all' ? null : val)}
                    />
                </div>

                <DateRangePicker
                    align='end'
                    value={dateFilter}
                    onChange={(val) => setDateFilter(val as DateRange)}
                />
                <Button 
                    variant="outline" 
                    onClick={onRefresh}
                    className="gap-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-10 px-4"
                >
                    <IconRefresh size={18} className={isLoading || isRefetching ? "animate-spin" : ""} />
                    {t('refresh', 'Refresh')}
                </Button>
            </div>
        </div>
    );
};

export default React.memo(AttendanceHeader);
