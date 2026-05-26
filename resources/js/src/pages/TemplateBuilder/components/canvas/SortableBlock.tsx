import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { GripVertical, Trash2 } from 'lucide-react';

export const SortableBlock = ({ id, type, label, styles, isSelected, onSelect, onRemove }: any) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto' };

    return (
        <div 
            ref={setNodeRef} style={style}
            onClick={(e) => { e.stopPropagation(); onSelect(id); }}
            className={cn(
                "group relative p-3 bg-white/50 border border-transparent hover:border-primary/20 rounded-lg mb-2 transition-all print:border-none print:shadow-none print:bg-transparent print:p-0 print:m-0",
                isSelected && "border-primary bg-primary/5 shadow-sm",
                isDragging && "opacity-50 scale-[1.02] shadow-xl"
            )}
        >
            <div className="no-print absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white border rounded shadow-sm cursor-grab active:cursor-grabbing" {...listeners} {...attributes}>
                <GripVertical className="w-2.5 h-2.5 text-primary" />
            </div>
            <div className="no-print flex justify-between items-center mb-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{type}</span>
                <button onClick={(e) => { e.stopPropagation(); onRemove(id); }} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-2.5 h-2.5" /></button>
            </div>
            <div className="text-[11px] text-slate-600 line-clamp-2 print:text-slate-900 print:line-clamp-none">
                {label || 'Custom Block Content...'}
            </div>
        </div>
    );
};
