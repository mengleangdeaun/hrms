import React from 'react';
import { cn } from '@/lib/utils';
import { Field } from './Field';

export const DocumentTable = React.memo(({ s, items, data, onEdit }: { s: any, items?: any[], data?: any, onEdit: any }) => {
    const columns = (s.table?.columns || []).filter((c: any) => c.visible);
    const borderWeight = s.table?.border_width || 1;
    const borderColor = s.table?.border_color || '#e2e8f0';
    const borderOption = s.table?.border_option || 'only_row';
    const tableLang = s.table?.lang || 'all';

    const headerStyle = {
        backgroundColor: s.table?.header?.bg || '#1e293b',
        color: s.table?.header?.color || '#ffffff',
        fontFamily: s.table?.header?.font || 'inherit',
        fontSize: `${s.table?.header?.size || 10}px`,
        padding: `${s.table?.header?.padding || 10}px 12px`,
    };

    const bodyStyle = {
        backgroundColor: s.table?.body?.bg || '#ffffff',
        color: s.table?.body?.color || '#1e293b',
        fontFamily: s.table?.body?.font || 'inherit',
        fontSize: `${s.table?.body?.size || 10}px`,
        padding: `${s.table?.body?.padding || 8}px 12px`,
    };

    return (
        <div className="w-full mb-0 overflow-hidden bg-white">
            <table 
                className="w-full border-collapse bg-white"
                style={{ 
                    borderTop: (borderOption === 'all') ? `${borderWeight}px solid ${borderColor}` : 'none',
                    borderLeft: (borderOption === 'all' || borderOption === 'only_column') ? `${borderWeight}px solid ${borderColor}` : 'none',
                    backgroundColor: 'white'
                }}
            >
                <thead>
                    <tr style={{ backgroundColor: headerStyle.backgroundColor }}>
                        {columns.map((col: any) => {
                            const fieldId = `table.header.${col.id}`;
                            const override = s.overrides?.[fieldId]?.content;

                            const renderBilingualTable = (km: string, en: string) => (
                                <div className={cn(
                                    "flex flex-col leading-tight gap-0.5",
                                    col.align === 'right' ? "items-end text-right" : (col.align === 'center' ? "items-center text-center" : "items-start text-left")
                                )}>
                                    <span className="font-bold">{km}</span>
                                    <span className={cn(
                                        "text-[9px] opacity-80 font-medium",
                                        s.table?.header?.en_italic !== false ? "italic" : "",
                                        s.table?.header?.en_underline ? "underline" : ""
                                    )}>{en}</span>
                                </div>
                            );

                            let finalTableLabel = override || (tableLang === 'km' ? (col.label_km || col.label) : (col.label_en || col.label));

                            if (tableLang === 'all') {
                                const content = override || `${col.label_km || col.label} | ${col.label_en || col.label}`;
                                if (content.includes('|')) {
                                    const [km, en] = content.split('|').map((t: string) => t.trim());
                                    finalTableLabel = renderBilingualTable(km, en);
                                } else {
                                    finalTableLabel = content;
                                }
                            }

                            const rawLabel = tableLang === 'all'
                                ? `${col.label_km || col.label} | ${col.label_en || col.label}`
                                : (tableLang === 'km' ? (col.label_km || col.label) : (col.label_en || col.label));

                            return (
                                <th 
                                    key={col.id} 
                                    className={cn(
                                        "uppercase tracking-wider font-bold",
                                        col.align === 'right' ? "text-right" : (col.align === 'center' ? "text-center" : "text-left")
                                    )}
                                    style={{ 
                                        ...headerStyle, 
                                        width: col.width ? `${col.width}px` : 'auto',
                                        borderRight: (borderOption === 'all' || borderOption === 'only_column') ? `${borderWeight}px solid ${borderColor}` : 'none',
                                        borderBottom: `${borderWeight}px solid ${borderColor}`,
                                    }}
                                >
                                    <Field id={fieldId} label={`${col.label} Header`} value={rawLabel} styles={s} data={data} onEdit={onEdit}>
                                        {finalTableLabel}
                                    </Field>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {(() => {
                        const baseItems = (items && items.length > 0) ? items : (s.sampleItems || [
                            { description: 'Premium ERP Implementation - Module A', qty: 1, unit: 'Set', unit_price: 1500, subtotal: 1500 },
                            { description: 'Custom Dashboard Development', qty: 2, unit: 'Hr', unit_price: 450, subtotal: 900 },
                            { description: 'Managed Cloud Hosting (Yearly)', qty: 1, unit: 'Year', unit_price: 100, subtotal: 100 },
                        ]);

                        const totalRowsCount = s.table?.total_rows || 10;
                        const finalRows = [...baseItems];
                        
                        // Add blank rows if needed
                        while (finalRows.length < totalRowsCount) {
                            finalRows.push({ isBlank: true });
                        }

                        const currency = s.table?.show_currency ? (s.general?.currency || '$') : '';
                        const packageAmountOnly = s.table?.package_amount_only || false;

                        return finalRows.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                {columns.map((col: any) => {
                                    let val = "";
                                    
                                    if (row.isBlank) {
                                        // Handle blank row numbering
                                        if (col.id === 'no' || col.id === 'index') {
                                            val = s.table?.blank_row_num ? (i + 1).toString() : "";
                                        } else {
                                            val = "";
                                        }
                                    } else {
                                        // Handle data row mapping
                                        if (col.id === 'description' || col.id === 'item_name') val = row.item_name || row.description || row.name;
                                        else if (col.id === 'sku' || col.id === 'code') val = row.sku || row.code || '-';
                                        else if (col.id === 'qty' || col.id === 'quantity') val = row.quantity || row.qty || '0';
                                        else if (col.id === 'unit') val = row.unit_name || row.unit || '-';
                                        else if (col.id === 'unit_price' || col.id === 'price') {
                                            const price = parseFloat(row.unit_price || row.price || 0);
                                            // Package logic: if it's a sub-item and package_amount_only is true, hide price
                                            if (packageAmountOnly && row.is_package_item) {
                                                val = "-";
                                            } else {
                                                val = `${currency} ${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`.trim();
                                            }
                                        }
                                        else if (col.id === 'discount') val = (parseFloat(row.discount_amount || row.discount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 });
                                        else if (col.id === 'amount' || col.id === 'total' || col.id === 'subtotal') {
                                            const amt = parseFloat(row.subtotal || row.total || row.amount || 0);
                                            if (packageAmountOnly && row.is_package_item) {
                                                val = "-";
                                            } else {
                                                val = `${currency} ${amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`.trim();
                                            }
                                        }
                                        else if (col.id === 'no' || col.id === 'index') val = (i + 1).toString();
                                        else val = row[col.id] || "";
                                    }

                                    return (
                                        <td 
                                            key={col.id} 
                                            className={cn(
                                                "min-h-[36px]",
                                                col.align === 'right' ? "text-right font-mono" : (col.align === 'center' ? "text-center" : "text-left")
                                            )}
                                            style={{ 
                                                ...bodyStyle,
                                                borderRight: ((borderOption === 'all' || borderOption === 'only_column')) ? `${borderWeight}px solid ${borderColor}` : 'none',
                                                borderBottom: (borderOption === 'all' || borderOption === 'only_row') ? `${borderWeight}px solid ${borderColor}` : 'none'
                                            }}
                                        >
                                            <div className="min-h-[1.2rem]">
                                                {val}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ));
                    })()}
                </tbody>
                {s.footer?.summary_row && (
                    <tfoot style={{ backgroundColor: '#f8fafc' }}>
                        <tr>
                            {columns.map((col: any) => {
                                let val = "";
                                if (col.id === 'qty' || col.id === 'quantity') {
                                    const totalQty = (items || []).reduce((acc: number, item: any) => {
                                        const q = parseFloat(item.quantity || item.qty || 0);
                                        return acc + (isNaN(q) ? 0 : q);
                                    }, 0);
                                    val = totalQty.toString();
                                } else if (col.id === 'amount' || col.id === 'total' || col.id === 'subtotal') {
                                    const totalAmt = (items || []).reduce((acc: number, item: any) => acc + (parseFloat(item.subtotal || item.total || item.amount || 0)), 0);
                                    const currency = s.table?.show_currency ? (s.general?.currency || '$') : '';
                                    const exRate = s.general?.exchange_rate || 4100;
                                    val = (
                                        <div className="flex flex-col">
                                            <span>{currency} {totalAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            {s.footer?.summary_riel && (
                                                <span className="text-[9px] text-slate-400 font-medium">៛ {(totalAmt * exRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                            )}
                                        </div>
                                    ) as any;
                                } else if (col.id === 'description' || col.id === 'item_name') {
                                    val = tableLang === 'km' ? 'សរុបរួម' : (tableLang === 'en' ? 'Total' : 'សរុបរួម | Total');
                                }

                                return (
                                    <td 
                                        key={col.id} 
                                        className={cn(
                                            "py-2 px-3 text-[11px] font-black",
                                            col.align === 'right' ? "text-right font-mono" : (col.align === 'center' ? "text-center" : "text-left")
                                        )}
                                        style={{ 
                                            borderRight: ((borderOption === 'all' || borderOption === 'only_column')) ? `${borderWeight}px solid ${borderColor}` : 'none',
                                            borderBottom: `${borderWeight}px solid ${borderColor}`,
                                            borderLeft: (col.id === columns[0].id && (borderOption === 'all' || borderOption === 'only_column')) ? `${borderWeight}px solid ${borderColor}` : 'none',
                                            color: s.table?.header?.bg || '#1e293b',
                                            backgroundColor: s.table?.footer?.bg || '#f8fafc'
                                        }}
                                    >
                                        {val}
                                    </td>
                                );
                            })}
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
});
