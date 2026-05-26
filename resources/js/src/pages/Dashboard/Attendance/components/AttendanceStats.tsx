import React from 'react';
import { motion } from 'framer-motion';
import { 
    IconUsers, 
    IconCalendarCheck, 
    IconUserMinus, 
    IconPlaneDeparture, 
    IconConfetti,
    IconArrowUpRight,
    IconMinus,
    IconArrowDownRight
} from '@tabler/icons-react';
import { itemVariants } from './constants';

interface StatCardProps {
    title: string;
    value: number | undefined;
    icon: React.ReactNode;
    color: 'primary' | 'emerald' | 'rose' | 'orange' | 'amber';
    trend?: string;
    percentage?: number;
    onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, onClick, value, icon, color, trend, percentage }) => {
    const colorMap: Record<string, string> = {
        primary: 'bg-primary/10 text-primary border-primary/20',
        emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        rose: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
        orange: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
        amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    };

    return (
        <motion.div 
            variants={itemVariants}
            whileHover={onClick ? { y: -4, scale: 1.02 } : {}}
            onClick={onClick}
            className={`p-5 rounded-2xl border bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl ring-1 ring-white/20 flex flex-col gap-4 transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-primary/5 hover:border-primary/30' : ''}`}
        >
            <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl border ${colorMap[color] || colorMap.primary} shadow-sm group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border ${
                        percentage !== undefined 
                            ? (percentage > 50 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : percentage === 50 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20')
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}>
                        {percentage !== undefined && (
                            percentage > 50 ? <IconArrowUpRight size={14} /> : percentage === 50 ? <IconMinus size={14} /> : <IconArrowDownRight size={14} />
                        )}
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                    {value || 0}
                </h3>
            </div>
        </motion.div>
    );
};

interface AttendanceStatsProps {
    data: any;
    isTodayOnly: boolean;
    onInspect: (type: string) => void;
}

const AttendanceStats: React.FC<AttendanceStatsProps> = ({ data, isTodayOnly, onInspect }) => {
    if (!isTodayOnly) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard 
                title="Employees" 
                value={data?.stats?.total_employees} 
                icon={<IconUsers size={24} />} 
                color="primary"
            />
            <StatCard 
                title="Present" 
                onClick={() => onInspect('present')}
                value={data?.stats?.present || 0} 
                icon={<IconCalendarCheck size={24} />} 
                color="emerald"
                percentage={data?.stats?.total_employees > 0 
                    ? Math.round(((data?.stats?.present || 0) / data.stats.total_employees) * 100)
                    : 0}
                trend={`${Math.round(((data?.stats?.present || 0) / (data?.stats?.total_employees || 1)) * 100)}% Participation`}
            />
            <StatCard 
                title="Absent" 
                onClick={() => onInspect('absent')}
                value={data?.stats?.absent} 
                icon={<IconUserMinus size={24} />} 
                color="rose"
            />
            <StatCard 
                title="Day Off" 
                onClick={() => onInspect('day_off')}
                value={data?.stats?.day_off} 
                icon={<IconPlaneDeparture size={24} />} 
                color="orange"
            />
            <StatCard 
                title="Holidays" 
                onClick={() => onInspect('holiday')}
                value={data?.stats?.holiday} 
                icon={<IconConfetti size={24} />} 
                color="amber"
            />
        </div>
    );
};

export default React.memo(AttendanceStats);
