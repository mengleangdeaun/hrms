import React from 'react';

interface StatusBadgeProps {
    status: string;
    mins?: number;
    className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, mins, className = '' }) => {
    if (!status) return <span className="text-gray-300">-</span>;

    const getStatusStyles = (s: string) => {
        switch (s) {
            case 'Early':
            case 'Overtime':
            case 'Present':
                return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
            case 'Stay Late':
                return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50';
            case 'In-On time':
            case 'Out-On time':
            case 'On Time':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
            case 'Warning':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
            case 'Late':
            case 'Early Departure':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800/50';
            case 'Absent':
                return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800/50';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700/50';
        }
    };

    const getIcon = (s: string) => {
        if (s === 'Early' || s === 'Overtime' || s === 'Present') return '🟢 ';
        if (s === 'Stay Late') return '🟣 ';
        if (s.includes('On time') || s === 'On Time') return '🔵 ';
        if (s === 'Warning') return '🟡 ';
        if (s === 'Late' || s === 'Early Departure') return '🟠 ';
        if (s === 'Absent') return '🔴 ';
        return '';
    };

    const formatMins = (m: number) => {
        if (m < 60) return `${m}mn`;
        const hrs = Math.floor(m / 60);
        const minsRemaining = Math.round(m % 60);
        return minsRemaining > 0 ? `${hrs}h ${minsRemaining}mn` : `${hrs}h`;
    };

    return (
        <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm border w-fit whitespace-nowrap ${getStatusStyles(status)} ${className}`}>
            <span className="mr-1">{getIcon(status)}</span>
            {status}
            {mins && mins > 0 ? ` : ${formatMins(mins)}` : ''}
        </span>
    );
};

export default StatusBadge;
