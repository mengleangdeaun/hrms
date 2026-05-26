import React from 'react';
import { motion } from 'framer-motion';

interface LeaveBalanceCardProps {
    name: string;
    balance: number;
    color?: string;
}

export const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({ name, balance, color = '#3b82f6' }) => {
    return (
        <motion.div 
            whileTap={{ scale: 0.95 }}
            className="snap-start shrink-0 w-44 bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 relative overflow-hidden flex flex-col items-center justify-center transition-all"
        >

            
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 text-center uppercase tracking-widest mb-2 leading-tight line-clamp-1 w-full" title={name}>
                {name}
            </span>
            
            <div className="flex items-baseline gap-0.5">
                <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                    {balance}
                </span>
            </div>

            {/* Bottom accent pill */}
            <div 
                className="absolute bottom-3 w-6 h-1 rounded-full opacity-60"
                style={{ backgroundColor: color }}
            />
        </motion.div>
    );
};
