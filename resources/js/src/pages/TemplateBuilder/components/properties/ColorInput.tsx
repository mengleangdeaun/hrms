import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export const ColorInput = ({ value, onChange, label }: { value: string, onChange: (val: string) => void, label?: string }) => (
    <div className="space-y-1.5">
        {label && <Label className="text-[10px] font-bold uppercase text-slate-400">{label}</Label>}
        <div className="flex gap-2">
            <div 
                className="w-10 h-10 rounded-md border border-slate-200 dark:border-slate-800 shrink-0 relative overflow-hidden group cursor-pointer"
                style={{ backgroundColor: value || '#000000' }}
            >
                <input 
                    type="color" 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    value={value || '#000000'}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
            <Input 
                value={value || '#000000'}
                onChange={(e) => onChange(e.target.value)}
                className="h-10 font-mono text-[11px] uppercase pr-2"
            />
        </div>
    </div>
);
