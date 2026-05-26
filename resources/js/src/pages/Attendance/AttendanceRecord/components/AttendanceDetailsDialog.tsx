import React, { useRef, useCallback, useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import {
  IconClock,
  IconCalendar,
  IconAlertCircle,
  IconMapPin,
  IconArrowRight,
  IconCheck,
  IconX,
  IconMessage2,
  IconChartBar,
  IconCamera,
  IconRefresh,
  IconHistory,
  IconCoffee,
  IconCoffeeOff
} from '@tabler/icons-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFormatDate } from '@/hooks/useFormatDate';
import StatusBadge from './StatusBadge';

// ============================================================================
// Type Definitions
// ============================================================================

interface ShiftConfig {
  start_time?: string;
  end_time?: string;
  break_start?: string;
  break_end?: string;
  has_break?: boolean;
  day_shift_type?: 'split' | 'normal';
}

interface PolicyConfig {
  name?: string;
  late_tolerance_minutes?: number;
  early_departure_tolerance_minutes?: number;
  overtime_minimum_minutes?: number;
}

interface Employee {
  full_name?: string;
  employee_id?: string;
  profile_image_url?: string;
}

export interface AttendanceRecord {
  id: string | number;
  date: string;
  check_in?: string;
  check_out?: string;
  session_1_out_time?: string;
  session_2_in_time?: string;
  clock_in_location?: string;
  clock_out_location?: string;
  in_status?: string;
  out_status?: string;
  total_hours?: number;
  late_minutes?: number;
  warning_minutes?: number;
  early_minutes?: number;
  early_departure_minutes?: number;
  overtime_minutes?: number;
  stay_late_minutes?: number;
  late_reason?: string;
  early_departure_reason?: string;
  shift_config?: ShiftConfig;
  policy_config?: PolicyConfig;
  employee?: Employee;
}

interface AttendanceDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  record: AttendanceRecord | null;
}

// ============================================================================
// Helper: Format Duration
// ============================================================================
const formatDuration = (minutes?: number): string => {
  const mins = minutes ?? 0;
  if (mins <= 0) return '0 min';
  const hours = Math.floor(mins / 60);
  const remainingMins = Math.round(mins % 60);
  if (hours > 0) {
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }
  return `${remainingMins} min`;
};

const EmployeeHeader: React.FC<{
  employee?: Employee;
  date: string;
  totalHours?: number;
  totalLate?: number;
  earlyDeparture?: number;
  overtime?: number;
  hasDeviations?: boolean;
  deductBreak: boolean;
  onDeductBreakChange: (val: boolean) => void;
}> = ({ 
  employee, 
  date, 
  totalHours = 0, 
  totalLate = 0, 
  earlyDeparture = 0, 
  overtime = 0, 
  hasDeviations = false,
  deductBreak,
  onDeductBreakChange
}) => {
  const { formatDate } = useFormatDate();
  const fallback = employee?.full_name?.charAt(0)?.toUpperCase() ?? '?';
  
  // Clean employee ID – hide if it's "000", "0", empty, or undefined
  const displayEmployeeId = (() => {
    const id = employee?.employee_id?.trim();
    if (!id) return '—';
    if (id === '000' || id === '0' || id === '00') return '—';
    return id;
  })();

  const hasAnyTime =
  (totalLate ?? 0) > 0 ||
  (earlyDeparture ?? 0) > 0 ||
  (overtime ?? 0) > 0;

  // Format total hours to HHh MMmn style
  const displayTotalHours = (() => {
    if (!totalHours || totalHours <= 0) return '0h 00mn';
    const totalMinutes = Math.round(totalHours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m.toString().padStart(2, '0')}mn`;
  })();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 rounded-full border shadow">
          <AvatarImage src={employee?.profile_image_url} alt={employee?.full_name} className="object-cover" />
          <AvatarFallback className="rounded-full text-lg font-bold">
            {fallback}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h3 className="text-xl font-bold tracking-tight mb-0.5">
            {employee?.full_name ?? 'Unknown Employee'}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="font-mono text-xs">{displayEmployeeId}</span>
            <Separator orientation="vertical" className="h-3" />
            <div className="flex items-center gap-1.5">
              <IconCalendar size={14} />
              <span>{formatDate(date)}</span>
            </div>
            {/* Quick stats chips inline */}
<div className="flex flex-wrap gap-1.5 ml-0 sm:ml-2">
  {totalLate > 0 && (
    <Badge variant="destructive" className="gap-1 text-[9px] px-1.5 py-0 h-5">
      <IconAlertCircle size={10} />
      Late {formatDuration(totalLate)}
    </Badge>
  )}

  {earlyDeparture > 0 && (
    <Badge variant="destructive" className="gap-1 bg-orange-500 text-[9px] px-1.5 py-0 h-5">
      <IconX size={10} />
      Early exit {formatDuration(earlyDeparture)}
    </Badge>
  )}

  {overtime > 0 && (
    <Badge variant="success" className="gap-1 text-[9px] px-1.5 py-0 h-5">
      <IconCheck size={10} />
      OT {formatDuration(overtime)}
    </Badge>
  )}

  {!hasAnyTime && (
    <Badge variant="secondary" className="gap-1 text-[9px] px-1.5 py-0 h-5">
      <IconCheck size={10} />
      On time
    </Badge>
  )}
</div>
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-end gap-2">
          <div className="flex flex-row items-end gap-3">
              <div className="flex items-center gap-2 px-2 py-1 bg-muted/40 rounded-lg border no-snapshot">
            {deductBreak ? <IconCoffee size={12} className="text-amber-500" /> : <IconCoffeeOff size={12} className="text-muted-foreground" />}
            <Label htmlFor="deduct-break-dialog" className="text-[9px] mb-0 font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap cursor-pointer">
              {deductBreak ? 'Deduct Break' : 'Raw Time'}
            </Label>
            <Switch 
              id="deduct-break-dialog"
              checked={deductBreak}
              onCheckedChange={onDeductBreakChange}
              className="!scale-75 !h-2 !w-7"
            />
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider mb-0.5">
              {deductBreak ? 'Hours Worked' : 'Raw Duration'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className={cn("text-2xl font-bold tracking-tighter", !deductBreak && "text-blue-600 dark:text-blue-400")}>
                {displayTotalHours}
              </span>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Subcomponent: Timeline Event
// ============================================================================
interface TimelineEventProps {
  title: string;
  time?: string;
  location?: string;
  color: string;
  icon: React.ReactNode;
  isLast?: boolean;
}

const TimelineEvent: React.FC<TimelineEventProps> = ({
  title,
  time,
  location,
  color,
  icon,
  isLast = false,
}) => {
  const hasLocation = !!location;

  return (
    <div className={cn('relative pl-8', !isLast && 'pb-6')}>
      {!isLast && (
        <div
          className="absolute left-[11px] top-7 bottom-0 w-px bg-border"
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          'absolute left-0 top-1.5 h-6 w-6 rounded-full border bg-background flex items-center justify-center z-10',
          color
        )}
      >
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <span className="text-base font-bold tracking-tight font-mono">
            {time || '—:—'}
          </span>
          {hasLocation && (
            <a
              href={`https://www.google.com/maps?q=${encodeURIComponent(location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline transition-colors"
              aria-label="Open location in Google Maps"
            >
              <IconMapPin size={12} />
              Maps
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Subcomponent: Timeline (Main)
// ============================================================================
const Timeline: React.FC<{
  checkIn?: string;
  checkOut?: string;
  session1Out?: string;
  session2In?: string;
  clockInLocation?: string;
  clockOutLocation?: string;
}> = ({
  checkIn,
  checkOut,
  session1Out,
  session2In,
  clockInLocation,
  clockOutLocation,
}) => {
  const { formatTime } = useFormatDate();
  const isSplit = !!session1Out || !!session2In;

  return (
    <div className="space-y-3 px-2">
      <TimelineEvent
        title="Arrival : Clock In"
        time={formatTime(checkIn)}
        location={clockInLocation}
        color="border-primary"
        icon={<IconClock size={12} className="text-primary" />}
      />
      {isSplit && session1Out && (
        <TimelineEvent
          title="Session 1 : Finished"
          time={formatTime(session1Out)}
          color="border-orange-500"
          icon={<IconX size={12} className="text-orange-500" />}
        />
      )}
      {isSplit && session2In && (
        <TimelineEvent
          title="Session 2 : Started"
          time={formatTime(session2In)}
          color="border-blue-500"
          icon={<IconClock size={12} className="text-blue-500" />}
        />
      )}
      <TimelineEvent
        title={isSplit ? 'Session 2 : Finished' : 'Departure : Clock Out'}
        time={formatTime(checkOut)}
        location={clockOutLocation}
        color="border-emerald-500"
        icon={<IconCheck size={12} className="text-emerald-500" />}
        isLast
      />
    </div>
  );
};

// ============================================================================
// Subcomponent: Shift Parameters Card
// ============================================================================
const ShiftParameters: React.FC<{ shiftConfig?: ShiftConfig }> = ({
  shiftConfig,
}) => {
  const isSplit = shiftConfig?.day_shift_type === 'split';

  if (!shiftConfig) {
    return (
      <Card>
        <CardContent className="p-3 text-center text-muted-foreground text-xs">
          No shift configuration available.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <IconClock size={14} />
            <span className="text-[9px] font-bold uppercase tracking-wider">
              Work Schedule
            </span>
          </div>
          <Badge variant="outline" className="text-[8px] font-bold uppercase py-0 px-1.5 h-4">
            {isSplit ? '4 scans' : '2 scans'}
          </Badge>
        </div>

        {isSplit ? (
          <div className="space-y-2">
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[8px] font-bold uppercase text-primary bg-primary/10 px-1 rounded">
                  Session 1
                </span>
              </div>
              <p className="text-xs font-semibold flex items-center gap-1.5 font-mono">
                {shiftConfig.start_time ?? '—'}
                <IconArrowRight size={10} className="text-muted-foreground" />
                {shiftConfig.break_start ?? '—'}
              </p>
            </div>
            <div className="border-t border-dashed pt-2">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[8px] font-bold uppercase text-primary bg-primary/10 px-1 rounded">
                  Session 2
                </span>
              </div>
              <p className="text-xs font-semibold flex items-center gap-1.5 font-mono">
                {shiftConfig.break_end ?? '—'}
                <IconArrowRight size={10} className="text-muted-foreground" />
                {shiftConfig.end_time ?? '—'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold flex items-center gap-1.5 font-mono">
              {shiftConfig.start_time ?? '—'}
              <IconArrowRight size={10} className="text-muted-foreground" />
              {shiftConfig.end_time ?? '—'}
            </p>
            {shiftConfig.has_break && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[8px] font-bold uppercase text-muted-foreground">
                    Break
                  </span>
                </div>
                <p className="text-xs font-mono text-muted-foreground">
                  {shiftConfig.break_start ?? '—'} – {shiftConfig.break_end ?? '—'}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Subcomponent: Policy Metrics Card
// ============================================================================
const PolicyMetrics: React.FC<{ policyConfig?: PolicyConfig }> = ({
  policyConfig,
}) => {
  if (!policyConfig) {
    return (
      <Card>
        <CardContent className="p-3 text-center text-muted-foreground text-xs">
          No policy assigned.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-1.5 mb-2 text-muted-foreground">
          <IconAlertCircle size={14} />
          <span className="text-[9px] font-bold uppercase tracking-wider truncate">
            {policyConfig.name || 'Standard Policy'}
          </span>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">In Margin</span>
            <span className="font-semibold font-mono">
              {policyConfig.late_tolerance_minutes ?? 0}m
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Out Margin</span>
            <span className="font-semibold font-mono">
              {policyConfig.early_departure_tolerance_minutes ?? 0}m
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Overtime</span>
            <span className="font-semibold font-mono">
              {policyConfig.overtime_minimum_minutes ?? 0}m
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Improved Metric Item (Horizontal bar style, fits in grid)
// ============================================================================
const MetricItem: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
  active: boolean;
  color: 'blue' | 'red' | 'amber' | 'orange' | 'emerald' | 'indigo';
}> = ({ label, value, icon, active, color }) => {
  const colorMap = {
    blue: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700',
    red: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700',
    amber: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700',
    orange: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-700',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-700',
  };

  if (!active && value === '0 min') {
    return (
      <div className="flex items-center justify-between p-2 rounded-lg border border-dashed opacity-60">
        <div className="flex items-center gap-2">
          <div className="text-muted-foreground/50">{icon}</div>
          <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
        </div>
        <span className="text-xs font-mono text-muted-foreground/50">—</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-between p-2 rounded-lg border-l-4', colorMap[color])}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-sm font-bold font-mono">{value}</span>
    </div>
  );
};

// ============================================================================
// Main Component (Refactored Layout with Two-Column Metrics)
// ============================================================================
const AttendanceDetailsDialog: React.FC<AttendanceDetailsDialogProps> = ({
  isOpen,
  onOpenChange,
  record,
}) => {
  const { formatTime } = useFormatDate();
  const navigate = useNavigate();
  const [isCapturing, setIsCapturing] = useState(false);
  const [deductBreak, setDeductBreak] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleSnapshot = useCallback(async () => {
    if (!contentRef.current || isCapturing || !record) return;
    
    setIsCapturing(true);
    const toastId = toast.loading('Capturing high-quality snapshot...');
    
    try {
      // Small delay to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const dataUrl = await toPng(contentRef.current, {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#020617' : '#ffffff',
        quality: 1.0,
        pixelRatio: 2, // 2x for high quality
        filter: (node) => {
            const classList = (node as HTMLElement)?.classList;
            return !classList?.contains('no-snapshot');
        },
        style: {
           borderRadius: '16px'
        }
      });
      
      const link = document.createElement('a');
      link.download = `attendance-${record.employee?.full_name || 'record'}-${record.date}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success('Snapshot saved to downloads!', { id: toastId });
    } catch (err) {
      console.error('Snapshot failed:', err);
      toast.error('Failed to capture snapshot', { id: toastId });
    } finally {
      setIsCapturing(false);
    }
  }, [record, isCapturing]);

  const calculatedTotalHours = useMemo(() => {
    if (!record) return 0;
    if (deductBreak) return record.total_hours ?? 0;
    
    const checkIn = record.check_in ? dayjs(record.check_in) : null;
    const checkOut = record.check_out ? dayjs(record.check_out) : null;
    if (!checkIn || !checkOut) return 0;
    
    const s1Out = record.session_1_out_time ? dayjs(record.session_1_out_time) : null;
    const s2In = record.session_2_in_time ? dayjs(record.session_2_in_time) : null;
    
    if (s1Out && s2In) {
      return Math.abs(s1Out.diff(checkIn, 'hour', true)) + Math.abs(checkOut.diff(s2In, 'hour', true));
    }
    return Math.abs(checkOut.diff(checkIn, 'hour', true));
  }, [record, deductBreak]);

  if (!record) return null;

  const employeeNote = record.late_reason || record.early_departure_reason;
  const totalLate = (record.late_minutes ?? 0) + (record.warning_minutes ?? 0);
  const hasDeviations =
    totalLate > 0 ||
    (record.early_departure_minutes ?? 0) > 0 ||
    (record.overtime_minutes ?? 0) > 0;

  // Format reference ID – hide if all zeros
  const referenceId = String(record.id).slice(-8);
  const displayReference = referenceId.replace(/^0+$/, '—');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[1000px] gap-0 p-0 overflow-hidden shadow-2xl border-border/50 [&>button]:hidden"
      >
        {/* Custom close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-50 rounded-full h-8 w-8 no-snapshot"
          onClick={() => onOpenChange(false)}
        >
          <IconX size={16} />
        </Button>

        {/* Header - reduced height */}
        <div className="relative bg-gradient-to-b from-background to-muted/20 p-4 px-5 border-b">
          <DialogHeader className="mb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DialogTitle className="flex items-center gap-2 text-foreground font-bold tracking-tight text-sm">
                    <IconHistory className="w-3.5 h-3.5 text-primary" />
                    Attendance Details
                </DialogTitle>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSnapshot}
                    disabled={isCapturing}
                    className="h-6 px-2 text-[9px] font-bold gap-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:text-primary transition-all active:scale-95 disabled:opacity-70 no-snapshot"
                >
                    {isCapturing ? (
                        <IconRefresh size={12} className="animate-spin" />
                    ) : (
                        <IconCamera size={12} />
                    )}
                    {isCapturing ? 'Capturing...' : 'Snapshot'}
                </Button>
              </div>
              <Badge variant="outline" className="font-mono text-[8px] px-1.5 h-4">
                REF: {displayReference}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        {/* Wrapper for Snapshot Capture */}
        <div ref={contentRef} className="bg-background rounded-2xl overflow-hidden">
          <div className="p-4 pb-2">
              <EmployeeHeader
                  employee={record.employee}
                  date={record.date}
                  totalHours={calculatedTotalHours}
                  totalLate={totalLate}
                  earlyDeparture={record.early_departure_minutes}
                  overtime={record.overtime_minutes}
                  hasDeviations={hasDeviations}
                  deductBreak={deductBreak}
                  onDeductBreakChange={setDeductBreak}
              />
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="max-h-[70vh]">
          <div className="flex flex-col lg:flex-row gap-0">
            {/* LEFT COLUMN: Metrics Breakdown (two columns) + Timeline */}
            <div className="flex-1 p-5 lg:border-r space-y-5">
              {/* Metrics Breakdown - Two column grid */}
              <div className="space-y-2">
                <h5 className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <IconChartBar size={12} /> Metrics Breakdown
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <MetricItem
                    label="Early Arrival"
                    value={formatDuration(record.early_minutes)}
                    icon={<IconArrowRight size={12} />}
                    active={(record.early_minutes ?? 0) > 0}
                    color="blue"
                  />
                  <MetricItem
                    label="Delay"
                    value={formatDuration(record.late_minutes)}
                    icon={<IconAlertCircle size={12} />}
                    active={(record.late_minutes ?? 0) > 0}
                    color="red"
                  />
                  <MetricItem
                    label="Warning Zone"
                    value={formatDuration(record.warning_minutes)}
                    icon={<IconClock size={12} />}
                    active={(record.warning_minutes ?? 0) > 0}
                    color="amber"
                  />
                  <MetricItem
                    label="Early Exit"
                    value={formatDuration(record.early_departure_minutes)}
                    icon={<IconX size={12} />}
                    active={(record.early_departure_minutes ?? 0) > 0}
                    color="orange"
                  />
                  <MetricItem
                    label="Overtime"
                    value={formatDuration(record.overtime_minutes)}
                    icon={<IconCheck size={12} />}
                    active={(record.overtime_minutes ?? 0) > 0}
                    color="emerald"
                  />
                  <MetricItem
                    label="Stay Late"
                    value={formatDuration(record.stay_late_minutes)}
                    icon={<IconClock size={12} />}
                    active={(record.stay_late_minutes ?? 0) > 0}
                    color="indigo"
                  />
                </div>
                {!hasDeviations && (
                  <div className="text-center text-[10px] text-muted-foreground pt-1">
                    ✓ No deviations – within policy limits
                  </div>
                )}
              </div>

              {/* Activity Timeline */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <IconClock size={14} className="text-muted-foreground" />
                  <h4 className="text-[9px] font-bold uppercase text-foreground tracking-wider">
                    Activity Timeline
                  </h4>
                  <Separator className="flex-1" />
                </div>
                <Timeline
                  checkIn={record.check_in}
                  checkOut={record.check_out}
                  session1Out={record.session_1_out_time}
                  session2In={record.session_2_in_time}
                  clockInLocation={record.clock_in_location}
                  clockOutLocation={record.clock_out_location}
                />
                {employeeNote && (
                  <Card className="mt-5 bg-muted/30 border-l-4 border-l-amber-500">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <IconMessage2 size={14} className="text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider mb-0.5">
                            Employee Comment
                          </p>
                          <p className="text-xs text-foreground/80 italic leading-relaxed">
                            "{employeeNote}"
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Status + Schedule & Policy */}
            <div className="w-full lg:w-80 p-5 bg-muted/5 space-y-5">
              {/* Status Badges */}
              <div className="grid grid-cols-2 gap-2">
                <Card className="shadow-none">
                  <CardContent className="p-2 flex flex-col items-center gap-0.5">
                    <span className="text-[8px] font-bold uppercase text-muted-foreground">
                      In Status
                    </span>
                    <StatusBadge status={record.in_status ?? 'unknown'} className="scale-90" />
                  </CardContent>
                </Card>
                <Card className="shadow-none">
                  <CardContent className="p-2 flex flex-col items-center gap-0.5">
                    <span className="text-[8px] font-bold uppercase text-muted-foreground">
                      Out Status
                    </span>
                    <StatusBadge status={record.out_status ?? 'unknown'} className="scale-90" />
                  </CardContent>
                </Card>
              </div>

              {/* Schedule & Policy */}
              <div className="space-y-2">
                <h5 className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <IconCalendar size={12} /> Schedule & Policy
                </h5>
                <ShiftParameters shiftConfig={record.shift_config} />
                <PolicyMetrics policyConfig={record.policy_config} />
              </div>
            </div>
          </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/20 border-t flex items-center justify-between px-5 text-[10px] font-medium text-muted-foreground">
          <span>System generated • {new Date().toLocaleDateString()}</span>
          <button
            className="hover:text-primary transition-colors flex items-center gap-1 font-bold group"
            onClick={() => {
                onOpenChange(false);
                const employeeName = record.employee?.full_name || '';
                navigate(`/report/attendance?search=${encodeURIComponent(employeeName)}`);
            }}
          >
            <span className="border-b border-muted-foreground/30 group-hover:border-primary/50 transition-all">View full audit log</span>
            <IconArrowRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceDetailsDialog;