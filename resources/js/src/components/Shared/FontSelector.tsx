import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { THEME_FONTS, getCanonicalFont } from '@/constants/themeFonts';
import { cn } from '@/lib/utils';

interface FontSelectorProps {
    value: string;
    onValueChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

export const FontSelector: React.FC<FontSelectorProps> = ({ 
    value, 
    onValueChange, 
    className,
    placeholder = "Select Font"
}) => {
    // Find canonical value for exact match in Select
    const canonicalValue = React.useMemo(() => {
        return getCanonicalFont(value).value;
    }, [value]);

    return (
        <Select value={canonicalValue} onValueChange={onValueChange}>
            <SelectTrigger className={cn("h-9 text-xs font-medium", className)}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
                {THEME_FONTS.map((font) => (
                    <SelectItem 
                        key={font.value} 
                        value={font.value}
                        className="cursor-pointer"
                    >
                        <span style={{ fontFamily: font.value }} className="text-sm">
                            {font.label}
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};
