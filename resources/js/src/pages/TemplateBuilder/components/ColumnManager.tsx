import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, AlignLeft, AlignCenter, AlignRight, ArrowRightLeft } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Item {
    id: string;
    label: string;
    visible: boolean;
    width?: number;
    align?: 'left' | 'center' | 'right';
    [key: string]: any;
}

interface ColumnManagerProps {
    items: Item[];
    onReorder: (items: Item[]) => void;
    onToggleVisibility: (id: string, visible: boolean) => void;
    onUpdateWidth?: (id: string, width: number) => void;
    onUpdateAlign?: (id: string, align: 'left' | 'center' | 'right') => void;
    onMoveSide?: (id: string) => void;
    showWidth?: boolean;
    showAlign?: boolean;
}

const SortableItem = ({ 
    item, 
    onToggleVisibility, 
    onUpdateWidth, 
    onUpdateAlign,
    onMoveSide,
    showWidth,
    showAlign
}: { 
    item: Item; 
    onToggleVisibility: (id: string, visible: boolean) => void;
    onUpdateWidth?: (id: string, width: number) => void;
    onUpdateAlign?: (id: string, align: 'left' | 'center' | 'right') => void;
    onMoveSide?: (id: string) => void;
    showWidth?: boolean;
    showAlign?: boolean;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-3 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md mb-1 group transition-all",
                isDragging && "opacity-50 shadow-lg scale-[1.02] border-primary/50",
                !item.visible && "opacity-75 grayscale-[0.5]"
            )}
        >
            <div 
                {...attributes} 
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            >
                <GripVertical className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
            </div>

            <Checkbox 
                checked={item.visible}
                onCheckedChange={(checked) => onToggleVisibility(item.id, checked === true)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />

            <span className="flex-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                {item.label}
            </span>

            {showAlign && onUpdateAlign && (
                <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded p-0.5 border border-slate-100 dark:border-slate-700">
                    <button 
                        onClick={() => onUpdateAlign(item.id, 'left')}
                        className={cn("p-1 rounded", item.align === 'left' ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-slate-400 hover:text-slate-600")}
                    >
                        <AlignLeft className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => onUpdateAlign(item.id, 'center')}
                        className={cn("p-1 rounded", item.align === 'center' ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-slate-400 hover:text-slate-600")}
                    >
                        <AlignCenter className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => onUpdateAlign(item.id, 'right')}
                        className={cn("p-1 rounded", item.align === 'right' ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-slate-400 hover:text-slate-600")}
                    >
                        <AlignRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {onMoveSide && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-primary hover:bg-primary/5 shrink-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        onMoveSide(item.id);
                    }}
                >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                </Button>
            )}

            {showWidth && onUpdateWidth && (
                <div className="w-20 shrink-0">
                    <Input 
                        type="number"
                        value={item.width || ''}
                        onChange={(e) => onUpdateWidth(item.id, parseInt(e.target.value) || 0)}
                        className="h-8 text-[10px] px-2"
                        placeholder="Width"
                    />
                </div>
            )}
        </div>
    );
};

const ColumnManager: React.FC<ColumnManagerProps> = ({ 
    items, 
    onReorder, 
    onToggleVisibility, 
    onUpdateWidth,
    onUpdateAlign,
    onMoveSide,
    showWidth = false,
    showAlign = false
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((i) => i.id === active.id);
            const newIndex = items.findIndex((i) => i.id === over.id);
            onReorder(arrayMove(items, oldIndex, newIndex));
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items.map(i => i.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="flex flex-col gap-1">
                    {items.map((item) => (
                        <SortableItem 
                            key={item.id} 
                            item={item} 
                            onToggleVisibility={onToggleVisibility}
                            onUpdateWidth={onUpdateWidth}
                            onUpdateAlign={onUpdateAlign}
                            onMoveSide={onMoveSide}
                            showWidth={showWidth}
                            showAlign={showAlign}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
};

export default ColumnManager;
