import React, { useState, useEffect, useCallback, useRef } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/EmptyState';
import {
    IconUsers,
    IconCalendarCheck,
    IconUserMinus,
    IconDownload,
    IconBrandTelegram,
    IconLoader2,
    IconCheck,
    IconPlaneDeparture,
    IconConfetti,
    IconClock,
    IconBuilding,
    IconBriefcase,
    IconX
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface StatInspectorModalProps {
    type: string | null;
    date: string | undefined;
    branchId?: number | string | null;
    onClose: () => void;
}

const StatInspectorModal: React.FC<StatInspectorModalProps> = ({ type, date, branchId, onClose }) => {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isNotifying, setIsNotifying] = useState(false);
    const scrollContainerRef = useRef<PerfectScrollbar>(null);

    useEffect(() => {
        if (type && date) {
            fetchData();
        }
    }, [type, date, branchId]);

    useEffect(() => {
        if (scrollContainerRef.current && !isLoading) {
            setTimeout(() => {
                scrollContainerRef.current?.updateScroll();
            }, 100);
        }
    }, [data, isLoading]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ type: type!, date: date! });
            if (branchId) params.append('branch_id', String(branchId));
            const response = await fetch(`/api/attendance/dashboard-stat-drilldown?${params.toString()}`);
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch drill-down:', error);
            toast.error('Failed to fetch data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportCSV = useCallback(() => {
        if (data.length === 0) return;
        setIsExporting(true);
        try {
            const headers = ['Employee ID', 'Full Name', 'Department', 'Branch', 'Status Detail'];
            const rows = data.map(emp => [
                emp.employee_id,
                emp.full_name,
                emp.department?.name || 'N/A',
                emp.branch?.name || 'N/A',
                type?.toUpperCase() || ''
            ]);
            const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Attendance_${type}_${date}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('CSV Exported successfully');
        } catch (error) {
            toast.error('Export failed');
        } finally {
            setIsExporting(false);
        }
    }, [data, type, date]);

    const handleSendNotification = async () => {
        setIsNotifying(true);
        try {
            const response = await fetch('/api/attendance/dashboard-send-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, date, branch_id: branchId ?? null })
            });
            const result = await response.json();
            if (result.success) {
                toast.success('Notification broadcasted to Telegram');
            } else {
                toast.error(result.message || 'Notification failed');
            }
        } catch (error) {
            toast.error('Connection error');
        } finally {
            setIsNotifying(false);
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'present': return <IconCalendarCheck size={24} />;
            case 'absent': return <IconUserMinus size={24} />;
            case 'day_off': return <IconPlaneDeparture size={24} />;
            case 'holiday': return <IconConfetti size={24} />;
            default: return <IconUsers size={24} />;
        }
    };

    const getThemeColorClass = () => {
        switch (type) {
            case 'present': return 'emerald';
            case 'absent': return 'rose';
            case 'day_off': return 'orange';
            case 'holiday': return 'amber';
            default: return 'primary';
        }
    };

    const themeColor = getThemeColorClass();
    const totalCount = data.length;

    const getIconWrapperClass = () => {
        switch (themeColor) {
            case 'emerald': return 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400';
            case 'rose': return 'bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400';
            case 'orange': return 'bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400';
            case 'amber': return 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400';
            default: return 'bg-primary-100 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400';
        }
    };

    const getCardAccentClass = () => {
        switch (themeColor) {
            case 'emerald': return 'bg-emerald-500';
            case 'rose': return 'bg-rose-500';
            case 'orange': return 'bg-orange-500';
            case 'amber': return 'bg-amber-500';
            default: return 'bg-primary-500';
        }
    };

    const getButtonClass = () => {
        switch (themeColor) {
            case 'emerald': return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20';
            case 'rose': return 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20';
            case 'orange': return 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20';
            case 'amber': return 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20';
            default: return 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/20';
        }
    };

    return (
        <Dialog open={!!type} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="sm:max-w-3xl w-[95vw] max-h-[90vh] h-auto flex flex-col p-2
                    !rounded-2xl shadow-xl overflow-hidden
                    bg-background/30 dark:bg-dark backdrop-blur-xl [&>button]:hidden"
            >
                <div className="flex flex-col h-full rounded-xl overflow-hidden
                    bg-white dark:bg-gray-900
                    ring-1 ring-white/40 dark:ring-gray-700/50 shadow-none">

                    {/* Header */}
                    <div className="shrink-0 px-6 py-6 flex items-center justify-between
                        bg-primary/5 dark:bg-primary/10 rounded-t-xl">
                        <div className="flex items-center gap-4">
                            <div className={cn("p-2.5 rounded-xl shadow-sm ring-1 ring-primary/10", getIconWrapperClass())}>
                                {getIcon()}
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-semibold capitalize text-gray-900 dark:text-white">
                                    {type} Insight
                                </DialogTitle>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                    Workforce Intelligence Report • {date}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            aria-label="Close dialog"
                            className="flex-shrink-0 p-2 rounded-full border border-white dark:border-gray-700
                                hover:bg-gray-100 dark:hover:bg-gray-800/50
                                hover:scale-105 active:scale-95 transition-all"
                        >
                            <IconX size={20} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <PerfectScrollbar
                        ref={scrollContainerRef}
                        options={{ suppressScrollX: true, wheelSpeed: 1 }}
                        className="flex-1 min-h-0"
                    >
                        <div className="p-6">
                            {isLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {Array(6).fill(0).map((_, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse bg-slate-50 dark:bg-slate-900/30">
                                            <Skeleton className="h-14 w-14 rounded-xl" />
                                            <div className="space-y-2 flex-grow">
                                                <Skeleton className="h-5 w-3/4" />
                                                <Skeleton className="h-3 w-1/2" />
                                                <Skeleton className="h-3 w-1/3" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : data.length === 0 ? (
                                <EmptyState
                                    title={`No ${type} employees found`}
                                    description={`There are no records classified as ${type} for ${date}. This could be due to a holiday or pending synchronization.`}
                                />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {data.map((emp: any) => (
                                        <div
                                            key={emp.id}
                                            className={cn(
                                                "group relative flex items-start gap-4 p-5 rounded-2xl transition-all duration-300",
                                                "border border-slate-200 dark:border-slate-800",
                                                "bg-white dark:bg-gray-900/20",
                                                "hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-950/50",
                                                "hover:border-transparent hover:scale-[1.02]",
                                                "hover:bg-slate-50/80 dark:hover:bg-gray-800/60"
                                            )}
                                        >
                                            {/* Left accent bar */}
                                            <div className={cn(
                                                "absolute left-0 top-4 bottom-4 w-1 rounded-full transition-all group-hover:w-1.5",
                                                getCardAccentClass(),
                                                "opacity-60 group-hover:opacity-100"
                                            )} />

                                            {/* Avatar */}
                                            <div className="relative shrink-0">
                                                <Avatar className="h-16 w-16 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300">
                                                    <AvatarImage 
                                                        src={emp.profile_image_url} 
                                                        alt={emp.full_name} 
                                                        className="object-cover" 
                                                    />
                                                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-700 text-xl font-black text-slate-500 dark:text-gray-300">
                                                        {emp.full_name?.charAt(0) || '?'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {/* Status badge */}
                                                <div className={cn(
                                                    "absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white dark:border-gray-900 shadow-sm flex items-center justify-center",
                                                    type === 'present' ? 'bg-emerald-500' : 'bg-rose-500'
                                                )}>
                                                    {type === 'present' ? (
                                                        <IconCheck size={11} className="text-white" />
                                                    ) : (
                                                        <div className="w-2 h-0.5 bg-white/70 rounded-full" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Employee Info - text colors fixed for hover */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="text-base font-black text-gray-800 dark:text-white truncate leading-tight">
                                                            {emp.full_name}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                            <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-bold uppercase tracking-tight text-slate-500 bg-slate-50 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700">
                                                                {emp.employee_id}
                                                            </Badge>
                                                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-gray-400 font-medium">
                                                                <IconBriefcase size={11} />
                                                                <span>{emp.department?.name || 'Staff'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {type === 'present' && emp.check_in_time && (
                                                        <div className="text-right">
                                                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Check-in</div>
                                                            <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                                <IconClock size={12} />
                                                                {emp.check_in_time}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-100 dark:border-gray-800">
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-gray-400">
                                                        <IconBuilding size={12} />
                                                        <span className="truncate max-w-[120px]">{emp.branch?.name || 'HQ Branch'}</span>
                                                    </div>
                                                    {emp.attendance_duration && (
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-gray-400">
                                                            <IconClock size={12} />
                                                            <span>{emp.attendance_duration}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </PerfectScrollbar>

                    {/* Footer */}
                    <div className="flex-shrink-0 flex justify-between items-center gap-3 px-6 py-5
                        rounded-b-xl bg-white dark:bg-gray-900
                        border-t border-gray-200/50 dark:border-gray-500/40 shadow-inner">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Total <span className="font-bold text-gray-900 dark:text-white">{totalCount}</span> employees
                        </div>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleExportCSV}
                                disabled={data.length === 0 || isExporting}
                                className="px-4 gap-2 rounded-lg border-gray-300 dark:border-gray-700
                                    bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                                    hover:bg-gray-50 dark:hover:bg-gray-700/50
                                    hover:scale-105 active:scale-95 transition-all"
                            >
                                {isExporting ? <IconLoader2 size={16} className="animate-spin" /> : <IconDownload size={16} />}
                                Export CSV
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSendNotification}
                                disabled={data.length === 0 || isNotifying}
                                className={cn(
                                    "px-5 gap-2 text-white font-medium rounded-lg shadow-sm hover:shadow-md",
                                    "hover:scale-105 active:scale-95 transition-all",
                                    getButtonClass()
                                )}
                            >
                                {isNotifying ? <IconLoader2 size={16} className="animate-spin" /> : <IconBrandTelegram size={16} />}
                                Broadcast Summary
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default React.memo(StatInspectorModal);