import React from 'react';
import { cn } from '@/lib/utils';

export const SectionTitle = ({ icon: Icon, title, className }: { icon: any, title: string, className?: string }) => (
    <div className={cn("flex items-center gap-2 mb-1 px-1", className)}>
        {Icon && <Icon className="w-3.5 h-3.5 text-primary" />}
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">{title}</h3>
    </div>
);
