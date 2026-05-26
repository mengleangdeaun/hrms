import React from 'react';
import { cn } from '@/lib/utils';

export const Label = ({ children, required, className }: { children: React.ReactNode; required?: boolean; className?: string }) => (
    <label 
        className={cn("text-xs font-semibold tracking-wide mb-2 block text-gray-400 dark:text-gray-500", className)}
        style={{ fontFamily: 'var(--font-family, "Google Sans")' }}
    >
        {children}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
);

export const Card = ({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) => (
    <div 
        className={cn("bg-white dark:bg-dark rounded-xl border border-gray-100 dark:border-white/5 p-6 shadow-xl shadow-black/[0.02] dark:shadow-none space-y-6", className)}
        style={{ fontFamily: 'var(--font-family, "Google Sans")' }}
    >
        {title && (
            <div className="flex items-center gap-3 mb-2">
                <div className="w-1.5 h-6 bg-primary rounded-full" />
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 tracking-tight">{title}</h2>
            </div>
        )}
        <div className="space-y-6">
            {children}
        </div>
    </div>
);

export const Toggle = ({ checked, onChange, label, sublabel, activeColor = 'bg-primary' }:
    { checked: boolean; onChange: (v: boolean) => void; label: string; sublabel?: string; activeColor?: string }) => (
    <label 
        className="flex items-center justify-between gap-3 cursor-pointer select-none group p-3 rounded-2xl border border-transparent hover:border-gray-100 dark:hover:border-white/5 transition-all"
        style={{ fontFamily: 'var(--font-family, "Google Sans")' }}
    >
        <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 tracking-tight">{label}</p>
            {sublabel && <p className="text-[10px] text-gray-400 font-medium leading-tight">{sublabel}</p>}
        </div>
        <div className="relative shrink-0">
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only" />
            <div className={`w-11 h-6 rounded-full transition-all duration-300 ${checked ? activeColor : 'bg-gray-200 dark:bg-gray-800'}`} />
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${checked ? 'translate-x-5 scale-110' : 'scale-90 opacity-60'}`} />
        </div>
    </label>
);
