import React from 'react';
import { cn } from '@/lib/utils';
import { resolveVariables } from '../../VariableResolver';

export const Field = ({ id, label, value, styles, data, onEdit, className, children, as = 'span', style = {} }: any) => {
    const override = styles?.overrides?.[id];
    const hasOverride = override && override.content !== undefined;
    const rawValue = hasOverride ? override.content : value;
    let displayValue = rawValue;
    
    // Resolve variables in content if data is present
    if (data && typeof displayValue === 'string') {
        displayValue = resolveVariables(displayValue, data);
    }

    const s = override?.styles || {};
    const Component = as;

    // Merge styles: default style prop < s (overrides)
    const combinedStyle = {
        ...style,
        ...(s.fontSize ? { fontSize: `${s.fontSize}px` } : {}),
        ...(s.fontWeight ? { fontWeight: s.fontWeight } : {}),
        ...(s.fontStyle ? { fontStyle: s.fontStyle } : {}),
        ...(s.textDecoration ? { textDecoration: s.textDecoration } : {}),
        ...(s.color ? { color: s.color } : {}),
        ...(s.fontFamily ? { fontFamily: s.fontFamily } : {})
    };

    return (
        <Component 
            onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onEdit({ id, label, value: rawValue, styles: s });
            }}
            className={cn(
                "hover:bg-slate-100/50 hover:ring-1 hover:ring-slate-300 rounded px-0.5 transition-all cursor-text print:bg-transparent print:ring-0 print:p-0 min-h-[1em]",
                as === 'div' ? 'block' : 'inline-block',
                className
            )}
            style={combinedStyle}
        >
            {children || displayValue || (hasOverride ? "" : <span className="opacity-30 italic">[{label}]</span>)}
        </Component>
    );
};
