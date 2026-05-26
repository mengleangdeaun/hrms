import React from 'react';
import { verticalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getVariableMap, resolveVariables, normalizeData } from './VariableResolver';

// Separated Canvas Components
import { EditableSection } from './components/canvas/EditableSection';
import { Field } from './components/canvas/Field';
import { CompanyInfo } from './components/canvas/CompanyInfo';
import { DocumentTitle } from './components/canvas/DocumentTitle';
import { DocumentInfoSection } from './components/canvas/DocumentInfoSection';
import { DocumentTable } from './components/canvas/DocumentTable';
import { SortableBlock } from './components/canvas/SortableBlock';
import { DroppableZone } from './components/canvas/DroppableZone';

// --- Main Canvas ---

const Canvas = ({ layout, styles, pageSize, data, items, activeTab, onSelectTab, onSelectBlock, selectedBlockId, onRemoveBlock, onAddBlock, onEditField, typeSlug, isResizing, className }: any) => {
    const s = styles || {};
    
    // Ensure data is normalized
    const normalizedData = React.useMemo(() => {
        // If data doesn't have doc_number (a key field in normalized), it's likely raw
        if (data && !data.hasOwnProperty('doc_number')) {
            return normalizeData(typeSlug || 'invoice', data);
        }
        return data || normalizeData(typeSlug || 'invoice', {});
    }, [data, typeSlug]);

    const variableMap = getVariableMap(normalizedData); // data is now the full normalized document
    
    const getPaperDimensions = () => {
        const isLandscape = s.general?.orientation === 'landscape';
        const size = pageSize || s.general?.paper_size || 'A4';
        switch (size) {
            case 'A5': return { width: isLandscape ? '210mm' : '148.5mm', minHeight: isLandscape ? '148.5mm' : '210mm' };
            default: return { width: isLandscape ? '297mm' : '210mm', minHeight: isLandscape ? '210mm' : '297mm' };
        }
    };

    const getMargin = (val: any, fallback = 40) => {
        if (val === undefined || val === null) return fallback;
        const parsed = parseInt(val);
        return isNaN(parsed) ? fallback : parsed;
    };

    const paperStyles = {
        ...getPaperDimensions(),
        fontFamily: s.general?.font_family || 'var(--font-google_sans)',
        backgroundColor: 'white',
        position: 'relative' as const,
        paddingTop: `${getMargin(s.general?.margins?.top)}px`,
        paddingBottom: `${getMargin(s.general?.margins?.bottom)}px`,
        paddingLeft: `${getMargin(s.general?.margins?.left)}px`,
        paddingRight: `${getMargin(s.general?.margins?.right)}px`,
    };

    const parseWidth = (w: any) => {
        if (!w) return 'auto';
        if (typeof w === 'number') return `${w}px`;
        if (w.includes('px') || w.includes('%') || w.includes('mm')) return w;
        return `${w}px`;
    };

    return (
        <div className={cn("flex-1 overflow-hidden bg-slate-100/50 dark:bg-slate-900 flex flex-col transition-colors duration-500", className)} onClick={() => onSelectBlock(null)}>
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { 
                        size: ${s.general?.paper_size || 'A4'} ${s.general?.orientation || 'portrait'}; 
                        margin: 0; 
                    }
                    
                    /* Reset body for print */
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        height: auto !important;
                        background: white !important;
                        visibility: hidden !important;
                    }

                    /* Target the canvas specifically */
                    .print-canvas {
                        visibility: visible !important;
                        display: flex !important;
                        flex-direction: column !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        min-height: 100% !important;
                        margin: 0 !important;
                        padding: ${getMargin(s.general?.margins?.top)}px ${getMargin(s.general?.margins?.right)}px ${getMargin(s.general?.margins?.bottom)}px ${getMargin(s.general?.margins?.left)}px !important;
                        background: white !important;
                        box-shadow: none !important;
                        border: none !important;
                        transform: none !important;
                    }

                    /* Ensure all children are visible */
                    .print-canvas * {
                        visibility: visible !important;
                    }

                    .no-print { 
                        display: none !important; 
                        visibility: hidden !important;
                    }
                    
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
                .print-canvas h1 { font-size: 2.25rem; font-weight: 800; line-height: 1.2; margin-top: 0; margin-bottom: 0.5rem; }
                .print-canvas h2 { font-size: 1.875rem; font-weight: 700; line-height: 1.25; margin-bottom: 0.5rem; }
                .print-canvas h3 { font-size: 1.5rem; font-weight: 700; line-height: 1.3; margin-bottom: 0.4rem; }
                .print-canvas p { margin-bottom: 0.5rem; }
                .print-canvas strong { font-weight: 700; }
            ` }} />

            <ScrollArea className="flex-1 w-full ScrollAreaRoot">
                <div className="min-h-full w-full flex flex-col items-center justify-start py-12 px-4 canvas-content-wrapper">
                    <div 
                        style={paperStyles} 
                        className={cn(
                            "print-canvas shadow-[0_0_50px_rgba(0,0,0,0.08)] dark:shadow-[0_0_50px_rgba(0,0,0,0.3)] rounded-sm bg-white text-slate-900 origin-top",
                            !isResizing && "transition-all duration-300"
                        )}
                    >
                        {/* Watermark Rendering */}
                        {s.general?.watermark?.show && (
                            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none select-none overflow-hidden" style={{ opacity: s.general?.watermark?.opacity || 0.05 }}>
                                {s.general?.watermark?.type === 'image' && s.general?.watermark?.image ? (
                                    <img 
                                        src={s.general.watermark.image} 
                                        style={{ width: `${s.general.watermark.size || 300}px` }} 
                                        className="object-contain" 
                                        onError={(e: any) => e.target.style.display = 'none'}
                                    />
                                ) : (
                                    <h1 
                                        className="font-black whitespace-nowrap" 
                                        style={{ 
                                            fontSize: `${s.general?.watermark?.size || 100}px`,
                                            transform: `rotate(${s.general?.watermark?.rotate || -45}deg)`,
                                            color: s.general?.primary_color || 'rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        {s.general?.watermark?.text || 'S-COOL CRM'}
                                    </h1>
                                )}
                            </div>
                        )}

                        <div className="relative z-10 flex flex-col min-h-full">
                            {/* Header */}
                            <EditableSection 
                                label="Header" 
                                active={activeTab === 'header'} 
                                onClick={() => onSelectTab('header')}
                                className="mb-4"
                            >
                                <CompanyInfo s={s} data={variableMap} onEdit={onEditField} layout={layout.header} />
                                {s.header?.border_bottom && (
                                    <div 
                                        className="mt-4" 
                                        style={{ 
                                            borderBottom: `${s.header?.border_width || 2}px solid ${s.header?.border_color || 'var(--primary)'}`,
                                            marginTop: `${16 + (s.header?.border_offset || 0)}px`
                                        }} 
                                    />
                                )}
                            </EditableSection>

                            <DroppableZone id="header" title="Header" isEmpty={layout.header.length === 0} onAddBlock={onAddBlock}>
                                <SortableContext items={layout.header.map((b: any) => b.id)} strategy={verticalListSortingStrategy}>
                                    {layout.header.map((b: any) => <SortableBlock key={b.id} {...b} isSelected={selectedBlockId === b.id} onSelect={onSelectBlock} onRemove={onRemoveBlock} />)}
                                </SortableContext>
                            </DroppableZone>

                            {/* Doc Information Area */}
                            <EditableSection 
                                label="Document Info" 
                                active={activeTab === 'doc_info'} 
                                onClick={() => onSelectTab('doc_info')}
                                className=""
                            >
                                <DocumentTitle s={s} data={variableMap} onEdit={onEditField} />
                                {s.doc_info?.title_position === 'top' && <DocumentInfoSection s={s} data={variableMap} onEdit={onEditField} />}
                            </EditableSection>
                            
                            {/* Body / Custom Items */}
                            <div className={cn("py-2", s.footer?.placement === 'fixed' && "flex-1")}>
                                <DroppableZone id="body" title="Body Content" isEmpty={layout.body.length === 0} onAddBlock={onAddBlock}>
                                    <SortableContext items={layout.body.map((b: any) => b.id)} strategy={verticalListSortingStrategy}>
                                        {layout.body.map((b: any) => <SortableBlock key={b.id} {...b} isSelected={selectedBlockId === b.id} onSelect={onSelectBlock} onRemove={onRemoveBlock} />)}
                                    </SortableContext>
                                </DroppableZone>
                                
                                {/* Main Transaction Table */}
                                <EditableSection 
                                    label="Table" 
                                    active={activeTab === 'table'} 
                                     onClick={() => onSelectTab('table')}
                                    className="my-4"
                                >
                                    <DocumentTable s={s} items={items} data={variableMap} onEdit={onEditField} />
                                </EditableSection>
                                
                                {s.doc_note?.show && (
                                    <EditableSection 
                                        label="Document Note" 
                                        active={activeTab === 'doc_info'} 
                                        onClick={() => onSelectTab('doc_info')}
                                        className="mt-6 mb-2"
                                    >
                                        <div className="relative pl-4 group/note">
                                            <div 
                                                className="absolute left-0 top-1 bottom-1 w-0.5 rounded-0" 
                                                style={{ backgroundColor: s.doc_note?.border_color || 'hsl(var(--primary) / 0.4)' }}
                                            />
                                            <div 
                                                className="text-[11px] text-slate-600 leading-relaxed min-h-[3rem] prose-sm prose-slate max-w-none" 
                                                dangerouslySetInnerHTML={{ __html: resolveVariables(s.doc_note?.content || '<p class="text-slate-400 italic">Add internal notes or customer message here...</p>', variableMap) }} 
                                            />
                                        </div>
                                    </EditableSection>
                                )}
                            </div>

                            {/* Document Info Bottom */}
                            {s.doc_info?.title_position === 'bottom' && (
                                <EditableSection 
                                    label="Document Info" 
                                    active={activeTab === 'doc_info'} 
                                     onClick={() => onSelectTab('doc_info')}
                                    className=""
                                >
                                    <DocumentInfoSection s={s} data={variableMap} onEdit={onEditField} />
                                </EditableSection>
                            )}

                            {/* Footer System Section */}
                            <EditableSection 
                                label="Totals & Notes" 
                                active={activeTab === 'footer'} 
                                onClick={() => onSelectTab('footer')}
                                className={cn(
                                    s.footer?.placement === 'fixed' ? "mt-auto" : "",
                                    (!s.footer?.placement || s.footer?.placement === 'auto') && !s.footer?.margin_top && "mt-8"
                                )}
                                style={{ 
                                    marginTop: s.footer?.margin_top !== undefined ? `${s.footer.margin_top}px` : undefined,
                                    marginBottom: s.footer?.margin_bottom !== undefined ? `${s.footer.margin_bottom}px` : undefined,
                                    color: s.footer?.font_color || '#64748b',
                                    fontFamily: s.footer?.font_family || s.general?.font_family || 'Arial, sans-serif'
                                }}
                            >
                                <div className={cn(
                                    s.footer?.layout_type === 'stack' ? "flex flex-col gap-6" : "grid gap-10",
                                    s.footer?.layout_type !== 'stack' && (s.footer?.columns === 1 ? "grid-cols-1" : "grid-cols-2")
                                )}>
                                    <div>
                                        {s.footer?.note?.show && (
                                            <div 
                                                className="text-[10px] leading-relaxed" 
                                                style={{ 
                                                    color: s.footer?.font_color || '#64748b',
                                                    fontFamily: s.footer?.note?.font_family || s.footer?.font_family || s.general?.font_family || 'Arial, sans-serif'
                                                }}
                                                dangerouslySetInnerHTML={{ __html: resolveVariables(s.footer?.note?.content, variableMap) }} 
                                            />
                                        )}
                                    </div>
                                    <div className={cn(
                                        "flex flex-col gap-1.5",
                                        s.footer?.layout_type === 'stack' ? "items-start" : "items-end"
                                    )}>
                                        {(s.footer?.totals || []).filter((t: any) => t.visible).map((total: any) => {
                                            const label = total.label;
                                            const totalId = total.id === 'grand_total' ? 'total_amount' : (total.id === 'tax' ? 'total_tax' : (total.id === 'discount' ? 'total_discount' : total.id));
                                            const val = variableMap[`{{${totalId}}}`] || '0.00';
                                            const isGrandTotal = totalId === 'total_amount';
                                            
                                            return (
                                                <div key={total.id} className={cn(
                                                    "flex justify-between w-full max-w-[240px] text-[11px]",
                                                    isGrandTotal 
                                                        ? cn("text-sm pt-2 border-t-2 border-slate-900 border-double mt-1", s.footer?.total_bold === true ? "font-black" : "font-normal") 
                                                        : "font-bold"
                                                )} style={{ color: (isGrandTotal && s.footer?.total_color_primary === true) ? undefined : (s.footer?.font_color || '#64748b') }}>
                                                    <span className={cn(
                                                        "uppercase", 
                                                        isGrandTotal && s.footer?.total_color_primary === true && "text-primary"
                                                    )}>{label}:</span>
                                                    <span className="font-mono">
                                                        {totalId === 'total_discount' && '- '}
                                                        $ {val}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                        
                                        {s.footer?.summary_riel && (
                                            <div className="flex justify-between w-full max-w-[240px] text-[10px] font-black border-t border-slate-100 pt-1 mt-1" style={{ color: s.footer?.font_color || '#64748b' }}>
                                                <span className={cn("uppercase", s.footer?.summary_riel_italic === true && "italic")}>Total in Riel (KHR):</span>
                                                <span className="font-mono">៛ {variableMap['{{total_amount_riel}}'] || '0'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </EditableSection>

                            {/* Dynamic Signature Area */}
                            {s.footer?.signature?.show && (
                                <EditableSection
                                    label="Signatures"
                                    active={activeTab === 'footer'}
                                    onClick={() => onSelectTab('footer')}
                                    className="pt-12"
                                >
                                    <div className={cn(
                                        "grid gap-12",
                                        s.footer?.signature?.count === 1 && "grid-cols-1 max-w-[240px] mx-auto",
                                        s.footer?.signature?.count === 2 && "grid-cols-2",
                                        s.footer?.signature?.count === 3 && "grid-cols-3"
                                    )}>
                                        {(s.footer?.signature?.items || []).filter((i: any, idx: number) => idx < (s.footer?.signature?.count || 2)).map((sig: any) => (
                                            <div key={sig.id} className="flex flex-col items-center text-center space-y-2">
                                                {sig.image && (
                                                    <div className="h-16 w-full flex items-center justify-center mb-1">
                                                        <img 
                                                            src={sig.image} 
                                                            className="max-h-full max-w-full object-contain" 
                                                            alt="Signature" 
                                                            onError={(e: any) => e.target.style.display = 'none'}
                                                        />
                                                    </div>
                                                )}
                                                <div 
                                                    className={cn(
                                                        "w-full h-px",
                                                        s.footer?.signature?.line_style === 'solid' && "bg-slate-900",
                                                        s.footer?.signature?.line_style === 'dashed' && "border-t border-dashed border-slate-900",
                                                        s.footer?.signature?.line_style === 'none' && "opacity-0"
                                                    )}
                                                />
                                                <Field 
                                                    id={`footer.signature.${sig.id}`} 
                                                    label={sig.label} 
                                                    value={sig.label} 
                                                    styles={s} 
                                                    onEdit={onEditField}
                                                    className="text-[10px] font-bold text-slate-800 uppercase tracking-wide leading-tight px-2"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </EditableSection>
                            )}
                            
                            <DroppableZone id="footer" title="Footer" isEmpty={layout.footer.length === 0} onAddBlock={onAddBlock}>
                                <SortableContext items={layout.footer.map((b: any) => b.id)} strategy={verticalListSortingStrategy}>
                                    {layout.footer.map((b: any) => <SortableBlock key={b.id} {...b} isSelected={selectedBlockId === b.id} onSelect={onSelectBlock} onRemove={onRemoveBlock} />)}
                                </SortableContext>
                            </DroppableZone>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};

export default Canvas;
