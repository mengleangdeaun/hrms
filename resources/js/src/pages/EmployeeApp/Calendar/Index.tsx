import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { toast } from 'sonner';
import { pwaFetch } from '@/lib/pwa-fetch';
import { IconArrowLeft, IconCalendarEvent, IconCalendarPlus, IconChevronLeft, IconLoader2 } from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import { format, startOfMonth, startOfDay } from 'date-fns';

import PageHeader from '@/components/ui/pwa/PageHeader';
import { PwaActionButton } from '@/components/ui/pwa/PwaActionButton';
import { pwaCache } from '@/lib/pwa-cache';

// Refactored Components
import { CalendarStats } from './components/CalendarStats';
import { CalendarCard } from './components/CalendarCard';
import { EventNavigator } from './components/EventNavigator';
import { WorkdayView } from './components/WorkdayView';
import { AgendaView } from './components/AgendaView';

export default function EmployeePwaCalendar() {
    const { t } = useTranslation('pwa');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const initialMonth = startOfMonth(new Date());
    const m = initialMonth.getMonth() + 1;
    const y = initialMonth.getFullYear();
    const cachedData = pwaCache.get(`calendar_data_${m}_${y}`);

    // State
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfDay(new Date()));
    const [currentMonth, setCurrentMonth] = useState<Date>(initialMonth);
    const [data, setData] = useState<any>(() => {
        const base = {
            attendance: [],
            holidays: [],
            leaves: [],
            day_offs: [],
            working_days: [],
            working_shift: null
        };
        return cachedData ? { ...base, ...cachedData } : base;
    });
    const [loading, setLoading] = useState(!cachedData);
    const [activeTab, setActiveTab] = useState<'workday' | 'holiday' | 'leave' | 'day_off'>('workday');

    const fetchCalendarData = useCallback(async (date: Date) => {
        const token = localStorage.getItem('employee_auth_token');
        if (!token) {
            navigate('/employee/login');
            return;
        }

        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const cached = pwaCache.get(`calendar_data_${month}_${year}`);
        
        if (cached) {
            setData(cached);
        }

        // OFFLINE GUARD: Return early if no connection
        if (!navigator.onLine) {
            setLoading(false);
            return;
        }

        if (!cached) {
            setLoading(true);
        }

        try {
            const res = await pwaFetch(`/api/employee-app/calendar-data?month=${month}&year=${year}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.status === 401) {
                localStorage.removeItem('employee_auth_token');
                navigate('/employee/login');
                return;
            }

            const jsonData = await res.json();
            if (res.ok) {
                setData(jsonData);
                pwaCache.set(`calendar_data_${month}_${year}`, jsonData);
            } else {
                if (!cached) {
                    toast.error(jsonData.message || t('failed_load_calendar', 'Failed to load calendar data') as string);
                }
            }
        } catch (e) {
            if (navigator.onLine && !cached) {
                toast.error(t('network_error', 'Network error') as string);
            }
        } finally {
            setLoading(false);
        }
    }, [navigate, t]);

    useEffect(() => {
        dispatch(setPageTitle(t('calendar', 'Calendar')));
        fetchCalendarData(currentMonth);

        const handleRefresh = () => fetchCalendarData(currentMonth);
        window.addEventListener('pwa-refresh', handleRefresh);
        return () => window.removeEventListener('pwa-refresh', handleRefresh);
    }, [dispatch, t, currentMonth, fetchCalendarData]);

    const formatTime = (timeString: string | null) => {
        if (!timeString) return '--:--';
        if (timeString.includes(':') && timeString.length <= 8) return timeString.substring(0, 5);
        try {
            const d = new Date(timeString);
            if (isNaN(d.getTime())) return timeString;
            return format(d, 'hh:mm a');
        } catch (e) {
            return timeString;
        }
    };

    // Calculate Monthly Stats
    const stats = useMemo(() => {
        const attendanceCount = data.attendance?.length || 0;
        const holidayCount = data.holidays?.length || 0;
        const leaveCount = data.leaves?.filter((l: any) => l.status === 'approved').length || 0;

        // Count actual Day Off days in the current month
        let dayOffCount = 0;
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayName = format(date, 'eeee').toLowerCase();
            const dateStr = format(date, 'yyyy-MM-dd');

            // Check if this specific date is overridden by an active day-off assignment
            const isAssignedDayOff = (data.day_offs || []).some((d: any) => {
                const start = d.effective_from;
                const end = d.effective_to;
                const isInRange = dateStr >= start && (!end || dateStr <= end);
                if (!isInRange) return false;

                if (d.frequency === 'specific_dates') {
                    return (d.specific_dates || []).includes(dateStr);
                }

                if (d.frequency === 'monthly') {
                    const days = (d.days_off || []).map((dn: string) => dn.toLowerCase());
                    if (!days.includes(dayName)) return false;

                    const weekOfMonth = Math.ceil(day / 7);
                    const isLastWeek = new Date(year, month, day + 7).getMonth() !== month;
                    const weeks = d.weeks_of_month || [];

                    return weeks.includes(weekOfMonth) || (weeks.includes(5) && isLastWeek);
                }

                // Default: Weekly
                const days = (d.days_off || []).map((dn: string) => dn.toLowerCase());
                return days.includes(dayName);
            });

            if (isAssignedDayOff) {
                dayOffCount++;
            }
        }

        return {
            attendance: attendanceCount,
            holidays: holidayCount,
            leaves: leaveCount,
            dayOffs: dayOffCount
        };
    }, [data, currentMonth]);

    // Only show full-page loader if we HAVE NO data yet and are loading
    const isFirstLoad = loading && data.attendance.length === 0 && data.working_days.length === 0;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#060818] pb-32">
            <PageHeader
                title={t('my_calendar', 'My Calendar') as string}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5 text-primary'  width="22" height="22" color="none" fill="none" viewBox="0 0 24 24"><path d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12V14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14V12Z" stroke="currentColor" stroke-width="1.5"></path><path opacity="0.5" d="M7 4V2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path d="M17 4V2.5" opacity="0.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M2 9H22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><circle cx="16.5" cy="16.5" r="1.5" stroke="currentColor" stroke-width="1.5"></circle></svg>}
                backButton={
                    <PwaActionButton
                        icon={<IconArrowLeft />}
                        variant="soft"
                        onClick={() => navigate(-1)}
                        aria-label={t('go_back', 'Go back')}
                    />
                }
                rightAction={
                    <PwaActionButton
                        icon={<IconCalendarPlus />}
                        variant="soft"
                        onClick={() => navigate('/employee/leave/create')}
                    />
                }
            />

            {loading && data.attendance.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4 flex-1">
                    <IconLoader2 size={40} className="animate-spin text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('syncing_calendar', 'Syncing Calendar...') as string}</p>
                </div>
            ) : (
                <div className="p-4 space-y-6">
                {/* 1. Monthly Summary Stats */}
                <CalendarStats 
                    attendanceCount={stats.attendance}
                    holidayCount={stats.holidays}
                    leaveCount={stats.leaves}
                    dayOffCount={stats.dayOffs}
                />

                {/* 2. Main Calendar (Gesture Enabled) */}
                <CalendarCard 
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    currentMonth={currentMonth}
                    setCurrentMonth={setCurrentMonth}
                    data={data}
                />

                {/* 3. Event Navigator & Content */}
                <div className="space-y-4">
                    <EventNavigator 
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />

                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {activeTab === 'workday' && (
                            <WorkdayView data={data} formatTime={formatTime} />
                        )}

                        {activeTab === 'holiday' && (
                            <AgendaView 
                                items={data.holidays} 
                                type="holiday" 
                                emptyMessage={t('no_holidays_month', 'No holidays found this month') as string} 
                            />
                        )}

                        {activeTab === 'leave' && (
                            <AgendaView 
                                items={data.leaves} 
                                type="leave" 
                                emptyMessage={t('no_leaves_found', 'No leave records found') as string} 
                            />
                        )}

                        {activeTab === 'day_off' && (
                            <AgendaView 
                                items={data.day_offs} 
                                type="day_off" 
                                emptyMessage={t('no_day_offs_found', 'No day-off records found') as string} 
                            />
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
);
}