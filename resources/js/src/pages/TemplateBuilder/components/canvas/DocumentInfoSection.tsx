import React from 'react';
import { Field } from './Field';
import { cn } from '@/lib/utils';

export const DocumentInfoSection = React.memo(({ s, data, onEdit }: { s: any, data?: any, onEdit: any }) => {
    const leftCols = s.doc_info?.left_columns || [];
    const rightCols = s.doc_info?.right_columns || [];
    const infoStyles = s.doc_info?.info || {};
    const labelStyles = s.doc_info?.label || {};
    const lang = labelStyles.lang || 'all';

    const renderColumn = (col: any, side: 'left' | 'right') => {
        if (!col.visible) return null;
        
        const fieldId = `doc_info.label.${col.id}`;
        const fieldOverride = s.overrides?.[fieldId];
        const overrideContent = fieldOverride?.content;
        
        const labelStyle = {
            fontFamily: fieldOverride?.styles?.fontFamily || labelStyles.font || 'inherit',
            fontSize: `${fieldOverride?.styles?.fontSize || labelStyles.size || 10}px`,
            color: fieldOverride?.styles?.color || labelStyles.color || 'inherit',
            fontWeight: fieldOverride?.styles?.fontWeight || 'inherit',
            fontStyle: fieldOverride?.styles?.fontStyle || 'inherit',
            textDecoration: fieldOverride?.styles?.textDecoration || 'inherit',
        };

        const renderBilingual = (km: string, en: string) => (
            <div 
                className={cn(
                    "flex leading-tight py-0.5",
                    labelStyles.layout === 'row' ? "flex-row items-center" : "flex-col",
                    labelStyles.align === 'center' ? 'items-center text-center' : (labelStyles.align === 'right' ? 'items-end text-right' : 'items-start text-left')
                )} 
                style={{ gap: `${labelStyles.gap || 2}px`, ...labelStyle }}
            >
                <span className="font-black">{km}</span>
                {labelStyles.layout === 'row' && <span className="text-slate-300 font-light mx-0.5" style={{ fontSize: `${(labelStyles.size || 10) * 0.8}px` }}>/</span>}
                <span className="font-bold uppercase tracking-tight opacity-70" style={{ fontSize: `${(labelStyles.size || 10) * 0.8}px` }}>{en}</span>
            </div>
        );

        let finalLabel: any = null;
        const baseContent = overrideContent || (
            lang === 'km' ? (col.label_km || col.label) : 
            (lang === 'en' ? (col.label_en || col.label) : 
            `${col.label_km || col.label} | ${col.label_en || col.label}`)
        );

        const alignmentClass = labelStyles.align === 'center' ? 'text-center' : (labelStyles.align === 'right' ? 'text-right' : 'text-left');

        if (lang === 'all') {
            if (baseContent.includes('|')) {
                const [km, en] = baseContent.split('|').map((t: string) => t.trim());
                finalLabel = renderBilingual(km, en);
            } else {
                finalLabel = <span className={cn("font-black uppercase tracking-tighter w-full", alignmentClass)} style={labelStyle}>{baseContent}</span>;
            }
        } else {
            let localizedContent = baseContent;
            if (localizedContent.includes('|')) {
                const [km, en] = localizedContent.split('|').map((t: string) => t.trim());
                localizedContent = lang === 'km' ? km : en;
            }
            finalLabel = <span className={cn("font-black uppercase tracking-tighter w-full", alignmentClass)} style={labelStyle}>{localizedContent}</span>;
        }

        const labelText = (() => {
            if (lang === 'km') return col.label_km || col.label;
            if (lang === 'en') return col.label_en || col.label;
            return (col.label_km && col.label_en) ? `${col.label_km} | ${col.label_en}` : (col.label_km || col.label_en || col.label);
        })();

        const indentWidth = side === 'left' ? (infoStyles.indent_left || 125) : (infoStyles.indent_right || 125);

        const infoStyle = {
            fontFamily: infoStyles.font || 'inherit',
            fontSize: `${infoStyles.size || 11}px`,
            color: infoStyles.color || 'inherit',
            textAlign: (infoStyles.align || 'left') as any,
        };

        return (
            <div key={col.id} className="flex items-start gap-3 min-h-[1.5rem] mb-1.5 group">
                <div 
                    style={{ width: `${indentWidth}px` }} 
                    className={cn(
                        "shrink-0 flex items-center h-full",
                        labelStyles.align === 'center' ? 'justify-center' : (labelStyles.align === 'right' ? 'justify-end' : 'justify-start')
                    )}
                >
                    <Field 
                        id={fieldId} 
                        label={`${col.label} Label`} 
                        value={labelText} 
                        styles={s} 
                        data={data}
                        onEdit={onEdit} 
                        className={cn(
                            "max-w-full",
                            labelStyles.align === 'center' ? 'text-center' : (labelStyles.align === 'right' ? 'text-right' : 'text-left')
                        )}
                    >
                        {finalLabel}
                    </Field>
                </div>
                <div className="flex items-center h-full pt-0.5">
                    <span 
                        className="font-black opacity-80" 
                        style={{ 
                            fontFamily: infoStyle.fontFamily,
                            fontSize: `${(infoStyles.size || 11) * 0.9}px`,
                            color: infoStyle.color
                        }}
                    >
                        {infoStyles.separator !== undefined ? infoStyles.separator : ':'}
                    </span>
                </div>
                <div className="flex-1 flex items-center h-full pt-0.5">
                    <Field 
                        id={`doc_info.value.${col.id}`} 
                        label={`${col.label} Value`} 
                        value={data?.[col.id] || `[${col.label}]`} 
                        styles={s} 
                        data={data}
                        onEdit={onEdit} 
                        className="font-bold w-full"
                        style={infoStyle}
                    />
                </div>
            </div>
        );
    };

    const widthLeft = s.width_left || 50;
    const widthRight = s.width_right || 50;

    return (
        <div 
            className="flex gap-12 pb-0" 
            style={{ 
                marginTop: `${s.doc_info?.margin_top || 0}px`,
                paddingTop: `${s.doc_info?.padding_top ?? 12}px`
            }}
        >
            <div style={{ width: `${widthLeft}%` }} className="space-y-1">
                {leftCols.map((col: any) => renderColumn(col, 'left'))}
            </div>
            <div style={{ width: `${widthRight}%` }} className="space-y-1">
                {rightCols.map((col: any) => renderColumn(col, 'right'))}
            </div>
        </div>
    );
});
