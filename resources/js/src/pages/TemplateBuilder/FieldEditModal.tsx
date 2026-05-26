import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bold, Italic, Underline, Braces } from "lucide-react";
import { cn } from "@/lib/utils";
import VariablePicker from './VariablePicker';
import { FontSelector } from '@/components/Shared/FontSelector';

interface FieldEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (overrides: any) => void;
    fieldId: string;
    label: string;
    currentValue: string;
    currentStyles?: any;
    typeSlug?: string;
}

const FieldEditModal = ({ isOpen, onClose, onSave, label, currentValue, currentStyles, typeSlug }: FieldEditModalProps) => {
    const [value, setValue] = useState(currentValue);
    const [styles, setStyles] = useState(currentStyles || {
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#1e293b',
        fontFamily: 'Arial, sans-serif'
    });

    useEffect(() => {
        setValue(currentValue);
        setStyles(currentStyles || {
            fontSize: 12,
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            color: '#1e293b',
            fontFamily: 'Arial, sans-serif'
        });
    }, [currentValue, currentStyles, isOpen]);

    const handleSave = () => {
        onSave({ content: value, styles });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] font-google_sans">
                <DialogHeader>
                    <DialogTitle className="text-sm font-semibold uppercase  tracking-wide text-gray-600 dark:text-slate-400">Edit {label}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                            <Label className="text-[11px] font-bold uppercase text-slate-400">Content</Label>
                            <VariablePicker 
                                typeSlug={typeSlug || ''} 
                                onSelect={(v) => setValue(prev => prev + v)} 
                                className="scale-90 origin-right"
                            />
                        </div>
                        <Input 
                            value={value} 
                            onChange={(e) => setValue(e.target.value)}
                            className="h-10 text-sm font-medium dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 placeholder:text-slate-500"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold uppercase text-slate-400">Font Family</Label>
                            <FontSelector 
                                value={styles.fontFamily} 
                                onValueChange={(v) => setStyles({...styles, fontFamily: v})}
                                className="h-9 text-xs dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold uppercase text-slate-400">Font Size</Label>
                            <Input 
                                type="number" 
                                value={styles.fontSize} 
                                onChange={(e) => setStyles({...styles, fontSize: parseInt(e.target.value)})}
                                className="h-9 text-xs dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold uppercase text-slate-400">Font Color</Label>
                            <div className="flex gap-2">
                                <div 
                                    className="w-9 h-9 rounded-md border border-slate-200 dark:border-slate-800 shrink-0 relative overflow-hidden group cursor-pointer"
                                    style={{ backgroundColor: styles.color || '#000000' }}
                                >
                                    <input 
                                        type="color" 
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        value={styles.color || '#000000'}
                                        onChange={(e) => setStyles({...styles, color: e.target.value})}
                                    />
                                </div>
                                <Input 
                                    value={styles.color} 
                                    onChange={(e) => setStyles({...styles, color: e.target.value})}
                                    className="h-9 flex-1 text-[10px] font-mono uppercase"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold uppercase text-slate-400">Styling</Label>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setStyles({...styles, fontWeight: styles.fontWeight === 'bold' ? 'normal' : 'bold'})}
                                    className={cn(
                                        "w-9 h-9 p-0 bg-slate-50 dark:bg-slate-900 dark:text-slate-100",
                                        styles.fontWeight === 'bold' && "bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20"
                                    )}
                                >
                                    <Bold className="w-4 h-4" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setStyles({...styles, fontStyle: styles.fontStyle === 'italic' ? 'normal' : 'italic'})}
                                    className={cn(
                                        "w-9 h-9 p-0 bg-slate-50 dark:bg-slate-900 dark:text-slate-100",
                                        styles.fontStyle === 'italic' && "bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20"
                                    )}
                                >
                                    <Italic className="w-4 h-4" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setStyles({...styles, textDecoration: styles.textDecoration === 'underline' ? 'none' : 'underline'})}
                                    className={cn(
                                        "w-9 h-9 p-0 bg-slate-50 dark:bg-slate-900 dark:text-slate-100",
                                        styles.textDecoration === 'underline' && "bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20"
                                    )}
                                >
                                    <Underline className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" size="sm" onClick={onClose} className="text-xs font-bold px-6 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-slate-300">Cancel</Button>
                    <Button size="sm" onClick={handleSave} className="bg-primary text-white text-xs font-bold px-8 shadow-lg shadow-primary/20 hover:bg-primary/90">Apply Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FieldEditModal;
