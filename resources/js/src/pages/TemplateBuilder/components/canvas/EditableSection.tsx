import React from 'react';
import { cn } from '@/lib/utils';

export const EditableSection = ({ children, active, onClick, label, className, style = {} }: any) => {
    return (
        <div 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={cn(
                "group relative border-[1.5px] border-transparent hover:border-dashed hover:border-green-500/50 transition-all duration-200 cursor-pointer rounded-sm print:border-none print:shadow-none print:bg-transparent",
                active && "border-dashed border-green-500 bg-green-50/5 shadow-[0_0_15px_rgba(34,197,94,0.05)]",
                className
            )}
            style={style}
        >
            <div className="no-print absolute -top-5 left-0 opacity-0 group-hover:opacity-100 transition-opacity bg-green-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-t-sm tracking-widest z-50 pointer-events-none">
                Edit {label}
            </div>
            {children}
        </div>
    );
};
