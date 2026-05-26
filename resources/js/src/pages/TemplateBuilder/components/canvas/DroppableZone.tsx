import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

export const DroppableZone = ({ id, title, children, isEmpty, isOver, onAddBlock }: any) => {
    const { setNodeRef, isOver: isZoneOver } = useDroppable({ id });
    return (
        <div 
            ref={setNodeRef}
            className={cn(
                "relative transition-all duration-300 rounded-lg min-h-[5px] print:min-h-0", 
                (isZoneOver || isOver) && "no-print bg-primary/5 ring-1 ring-primary/20 ring-dashed"
            )}
        >
            {children}
        </div>
    );
};
