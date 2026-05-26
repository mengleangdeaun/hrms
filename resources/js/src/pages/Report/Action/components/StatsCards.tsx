import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { IconClock, IconActivity, IconUser, IconBuildingCommunity, IconBadge } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface StatsCardsProps {
    stats: {
        total_hours: number;
        activity_count: number;
    };
    employee: any;
}

const StatsCards = ({ stats, employee }: StatsCardsProps) => {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Employee Info Card */}
            <Card className="overflow-hidden rounded-xl shadow-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                            <Avatar className="w-12 h-12 rounded-xl border border-primary/20 ">
                                <AvatarImage src={employee?.profile_image_url} alt={employee?.full_name} className="object-cover" />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm uppercase rounded-xl">
                                    {employee?.full_name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                        <div className="min-w-0">
                            <h4 className="text-sm font-black text-slate-800 dark:text-white truncate leading-tight">{employee?.full_name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate mt-0.5">
                                ID: {employee?.employee_id || employee?.employee_code}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800 whitespace-nowrap">
                            <IconBuildingCommunity size={12} className="text-primary" /> {employee?.branch?.name}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800 whitespace-nowrap">
                            <IconBadge size={12} className="text-primary" /> {employee?.designation?.name}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Total Hours Card */}
            <Card className="overflow-hidden rounded-xl shadow-sm bg-white dark:bg-slate-900 border">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/50">
                            <IconClock size={24} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">{t('total_work_hours', 'Total Work Hours')}</p>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stats.total_hours}h</h3>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Activities Card */}
            <Card className="overflow-hidden rounded-xl shadow-sm bg-white dark:bg-slate-900 border">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/50">
                            <IconActivity size={24} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">{t('activities_recorded', 'Activities Recorded')}</p>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stats.activity_count}</h3>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default StatsCards;
