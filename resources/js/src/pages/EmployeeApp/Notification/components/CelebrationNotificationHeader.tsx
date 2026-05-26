import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconCake, IconConfetti, IconChevronRight } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface Celebrant {
    id: number;
    name: string;
    type: 'birthday' | 'anniversary';
    milestone?: string;
    profile_image_url: string;
    designation: string;
}

interface CelebrationNotificationHeaderProps {
    activeTab: 'all' | 'announcement' | 'leave' | 'birthday' | 'anniversary' | 'other';
    celebrants: Celebrant[];
    loading: boolean;
    onCountChange?: (count: number) => void;
}

/**
 * CelebrationNotificationHeader: Relocated from Dashboard to Notifications.
 * Optimized list display for social events happening today.
 */
export const CelebrationNotificationHeader: React.FC<CelebrationNotificationHeaderProps> = ({ 
    activeTab, 
    celebrants, 
    loading,
    onCountChange 
}) => {
    const { t } = useTranslation('pwa');
    const navigate = useNavigate();

    const filteredCelebrants = useMemo(() => {
        const list = activeTab === 'birthday' 
            ? celebrants.filter(c => c.type === 'birthday')
            : activeTab === 'anniversary' 
                ? celebrants.filter(c => c.type === 'anniversary')
                : [];
        
        onCountChange?.(list.length);
        return list;
    }, [celebrants, activeTab, onCountChange]);

    if (loading || filteredCelebrants.length === 0) return null;

    return (
        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="bg-gray-50/80 dark:bg-gray-900/50 backdrop-blur-md px-5 py-3 border-b border-gray-100/50 dark:border-gray-800/30">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                     {activeTab === 'birthday' 
                        ? t('birthdays_today', 'Birthdays Today') 
                        : t('anniversaries_today', 'Work Anniversaries Today')}
                </h4>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {filteredCelebrants.map((person) => (
                    <button
                        key={`${person.id}-${person.type}`}
                        onClick={() => navigate(`/employee/celebrations/${person.id}?type=${person.type}`)}
                        className="w-full text-left bg-white dark:bg-gray-800/50 p-4 transition-all active:scale-[0.98] flex items-center gap-4"
                    >
                        <div className="relative shrink-0">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm p-0.5">
                                {person.profile_image_url ? (
                                    <img src={person.profile_image_url} className="w-full h-full rounded-lg object-cover" />
                                ) : (
                                    <div className="w-full h-full rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                                        {person.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className={cn(
                                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900",
                                person.type === 'birthday' ? "bg-pink-500" : "bg-amber-500"
                            )}>
                                {person.type === 'birthday' ? (
                                    <IconCake size={10} className="text-white" />
                                ) : (
                                    <IconConfetti size={10} className="text-white" />
                                )}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                    {person.name}
                                </p>
                                <span className="text-[10px] text-primary font-bold uppercase tracking-tighter">
                                    {person.type === 'birthday' ? t('birthday', 'Birthday') : `${person.milestone} ${t('anniversary', 'Anniversary')}`}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                                {person.designation}
                            </p>
                        </div>

                        <IconChevronRight size={14} className="text-gray-300" />
                    </button>
                ))}
            </div>
        </div>
    );
};
