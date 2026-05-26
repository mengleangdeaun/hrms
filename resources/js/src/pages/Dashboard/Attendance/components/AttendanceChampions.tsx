import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { EmptyDataSmallIllustration } from '@/components/illustrations/EmptyData';

import { 
  IconConfetti, 
  IconAlertCircle, 
  IconCrown, 
  IconTrophy, 
  IconMedal,
  IconMoodEmpty 
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { itemVariants, LEADERBOARD_TABS } from './constants';

interface AttendanceChampionsProps {
    data: any;
    isLoading?: boolean;
}

const AttendanceChampions: React.FC<AttendanceChampionsProps> = ({ data, isLoading }) => {
    const [leaderboardType, setLeaderboardType] = useState<any>('performance');

    const formatScore = (type: string, score: number) => {
        if (score === undefined) return '—';
        if (type === 'performance') return `${Math.round(score)} pts`;
        if (type === 'overtime') {
            const hours = Math.floor(score / 60);
            const mins = score % 60;
            return hours ? `${hours}h ${mins}m` : `${mins}m`;
        }
        return `${score}m`;
    };

    const getRankStyles = (index: number) => {
        switch (index) {
            case 0: return 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-500/30';
            case 1: return 'bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-lg shadow-slate-500/30';
            case 2: return 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-500/30';
            default: return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
        }
    };

    const getRankIcon = (index: number) => {
        if (index === 0) return <IconCrown size={12} className="text-amber-300" />;
        if (index === 1) return <IconTrophy size={11} className="text-slate-300" />;
        if (index === 2) return <IconMedal size={11} className="text-orange-300" />;
        return index + 1;
    };

    const leaderboardEntries = data?.leaderboards?.[leaderboardType] || [];
    const isNegativeMetric = ['late_arrival', 'early_departure'].includes(leaderboardType);

    return (
        <motion.div variants={itemVariants} className="h-full">
            <Card className={cn(
                "border-slate-200/60 dark:border-slate-800/60 shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-white/20 overflow-hidden h-full"
            )}>
                
                <CardHeader className="relative border-b border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-r from-white/50 to-transparent dark:from-slate-900/50 p-5">
                    <div className="flex flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-amber-500 blur-md opacity-50 rounded-full" />
                                <IconConfetti size={24} className="relative text-amber-500 drop-shadow-sm" />
                            </div>
                            <CardTitle className="text-lg font-black tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                                Champions
                            </CardTitle>

                        </div>
                        
                        <div className="flex flex-row gap-2">
                            <Select value={leaderboardType} onValueChange={setLeaderboardType}>
                                <SelectTrigger className="w-[130px] sm:w-[160px] h-9 bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 shadow-sm text-[11px] font-bold uppercase tracking-wider text-primary hover:bg-white dark:hover:bg-slate-800 transition-all">
                                    <SelectValue placeholder="Metric" />
                                </SelectTrigger>
                                <SelectContent align="end" className="min-w-[140px]">
                                    {LEADERBOARD_TABS.map((tab) => (
                                        <SelectItem key={tab.id} value={tab.id} className="text-xs font-medium">
                                            {tab.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="cursor-help p-1.5 rounded-md text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors">
                                        <IconAlertCircle size={18} />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent side="left" className="w-80 p-4 border-slate-200 dark:border-slate-700 shadow-xl">
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-primary">Scoring Logic</h4>
                                        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                            <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-800/50">
                                            <div className='flex gap-1.5' >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" color="none" fill="none" viewBox="0 0 24 24"><path d="M21.609 13.5616L21.8382 11.1263C22.0182 9.2137 22.1082 8.25739 21.781 7.86207C21.604 7.64823 21.3633 7.5172 21.106 7.4946C20.6303 7.45282 20.0329 8.1329 18.8381 9.49307C18.2202 10.1965 17.9113 10.5482 17.5666 10.6027C17.3757 10.6328 17.1811 10.6018 17.0047 10.5131C16.6865 10.3529 16.4743 9.91812 16.0499 9.04851L13.8131 4.46485C13.0112 2.82162 12.6102 2 12 2C11.3898 2 10.9888 2.82162 10.1869 4.46486L7.95007 9.04852C7.5257 9.91812 7.31351 10.3529 6.99526 10.5131C6.81892 10.6018 6.62434 10.6328 6.43337 10.6027C6.08872 10.5482 5.77977 10.1965 5.16187 9.49307C3.96708 8.1329 3.36968 7.45282 2.89399 7.4946C2.63666 7.5172 2.39598 7.64823 2.21899 7.86207C1.8918 8.25739 1.9818 9.2137 2.16181 11.1263L2.391 13.5616C2.76865 17.5742 2.95748 19.5805 4.14009 20.7902C5.32271 22 7.09517 22 10.6401 22H13.3599C16.9048 22 18.6773 22 19.8599 20.7902C21.0425 19.5805 21.2313 17.5742 21.609 13.5616Z" stroke="currentColor" stroke-width="1.5"></path><path opacity="0.5" d="M11.1459 12.5225C11.5259 11.8408 11.7159 11.5 12 11.5C12.2841 11.5 12.4741 11.8408 12.8541 12.5225L12.9524 12.6989C13.0603 12.8926 13.1143 12.9894 13.1985 13.0533C13.2827 13.1172 13.3875 13.141 13.5972 13.1884L13.7881 13.2316C14.526 13.3986 14.895 13.482 14.9828 13.7643C15.0706 14.0466 14.819 14.3407 14.316 14.929L14.1858 15.0812C14.0429 15.2483 13.9714 15.3319 13.9392 15.4353C13.9071 15.5387 13.9179 15.6502 13.9395 15.8733L13.9592 16.0763C14.0352 16.8612 14.0733 17.2536 13.8435 17.4281C13.6136 17.6025 13.2682 17.4435 12.5773 17.1254L12.3986 17.0431C12.2022 16.9527 12.1041 16.9075 12 16.9075C11.8959 16.9075 11.7978 16.9527 11.6014 17.0431L11.4227 17.1254C10.7318 17.4435 10.3864 17.6025 10.1565 17.4281C9.92674 17.2536 9.96476 16.8612 10.0408 16.0763L10.0605 15.8733C10.0821 15.6502 10.0929 15.5387 10.0608 15.4353C10.0286 15.3319 9.95713 15.2483 9.81418 15.0812L9.68403 14.929C9.18097 14.3407 8.92945 14.0466 9.01723 13.7643C9.10501 13.482 9.47396 13.3986 10.2119 13.2316L10.4028 13.1884C10.6125 13.141 10.7173 13.1172 10.8015 13.0533C10.8857 12.9894 10.9397 12.8926 11.0476 12.6989L11.1459 12.5225Z" stroke="currentColor" stroke-width="1.5"></path></svg>
                                                <p className="font-bold text-slate-900 dark:text-white">MVP</p>
                                            </div>
                                                <p className="text-[11px]">(Present Days × 100) – Late Minutes</p>
                                            </div>
                                            <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-800/50">
                                                <div className='flex gap-1.5' >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" color="none" fill="none" viewBox="0 0 24 24"><path opacity="0.5" d="M21 13C21 17.9706 16.9706 22 12 22C7.02944 22 3 17.9706 3 13C3 8.02944 7.02944 4 12 4C16.9706 4 21 8.02944 21 13Z" stroke="currentColor" stroke-width="1.5"></path><path d="M12 13V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M10 2H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>
                                                    <p className="font-bold text-slate-900 dark:text-white">Overtime</p>
                                                </div>
                                                <p className="text-[11px]">Total minutes worked beyond shift</p>
                                            </div>
                                            <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-800/50">
                                                    <div className='flex gap-1.5' >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" color="none" fill="none" viewBox="0 0 24 24"><path opacity="0.5" d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z" stroke="currentColor" stroke-width="1.5"></path><path d="M7 18L7 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path d="M12 18V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path d="M17 18V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>
                                                    <p className="font-bold text-slate-900 dark:text-white">Specialized</p>
                                                </div>
                                                <p className="text-[11px]">Early In, Stay Late, Late, Early Out (minutes)</p>
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-11 w-11 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-28" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-5 w-16 rounded-md" />
                                </div>
                            ))}
                        </div>
                    ) : leaderboardEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                <EmptyDataSmallIllustration  />
                            <p className="text-sm font-medium text-slate-500">No champions found</p>
                            <p className="text-xs text-slate-400 mt-1">Try a different metric</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {leaderboardEntries.map((entry: any, index: number) => {
                                const isTop3 = index < 3;
                                return (
                                    <motion.div
                                        key={entry.employee_id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className={cn(
                                            "group relative p-4 flex items-center justify-between transition-all duration-200",
                                            "hover:bg-slate-50/80 dark:hover:bg-slate-800/40",
                                            isTop3 && "bg-gradient-to-r from-primary/5 via-transparent to-transparent"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <Avatar className="h-12 w-12 rounded-xl shadow-md transition-transform duration-200 group-hover:scale-105">
                                                    <AvatarImage 
                                                        src={entry.employee?.profile_image_url || (entry.employee?.profile_image ? `/storage/${entry.employee.profile_image}` : undefined)} 
                                                        alt={entry.employee?.full_name} 
                                                        className="object-cover" 
                                                    />
                                                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-700 font-bold text-slate-500 dark:text-gray-300">
                                                        {entry.employee?.full_name?.charAt(0) || '?'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className={cn(
                                                    "absolute -top-1.5 -left-1.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white dark:border-slate-900",
                                                    getRankStyles(index)
                                                )}>
                                                    {getRankIcon(index)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800 dark:text-white leading-tight truncate max-w-[100px] sm:max-w-[180px]">
                                                    {entry.employee?.full_name}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-mono text-slate-400">
                                                        {entry.employee?.employee_id}
                                                    </span>
                                                    {entry.present_days > 0 && (
                                                        <Badge variant="success" className="text-[9px] px-1.5 h-4">
                                                            {entry.present_days}d
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={cn(
                                                "text-sm font-black tracking-tight",
                                                isNegativeMetric ? "text-rose-500" : "text-primary",
                                                isTop3 && "text-base"
                                            )}>
                                                {formatScore(leaderboardType, entry.score)}
                                            </div>
                                            <div className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                                                {leaderboardType === 'performance' ? 'MVP' : 'total'}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default React.memo(AttendanceChampions);