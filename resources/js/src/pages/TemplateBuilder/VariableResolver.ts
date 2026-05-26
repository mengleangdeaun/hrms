/**
 * VariableResolver.ts
 * Shared utility for normalizing document data and resolving template variables.
 */
 
const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    // Handle ISO strings (2026-05-03T17:00:00.000000Z) or space-separated dates
    return dateStr.split(/[T ]/)[0];
};

export interface NormalizedDocument {
    // Document Info
    doc_number: string;
    doc_date: string;
    expiry_date?: string;
    reference?: string;
    project_name?: string;
    warehouse_name?: string;
    currency_code: string;
    term_name?: string;
    created_by?: string;
    va_name?: string;
    salesperson_name?: string;

    // Party Info (Customer/Vendor)
    party_name: string;
    party_name_km?: string;
    party_code?: string;
    party_phone?: string;
    party_email?: string;
    party_address?: string;
    billing_address?: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    vat_tin?: string;
    memo?: string;

    // Vehicle/Workshop Info
    vehicle_reg?: string;
    vehicle_brand?: string;
    vehicle_model?: string;
    vehicle_vin?: string;
    mileage_in?: string;
    technician_name?: string;
    job_status?: string;
    exchange_rate: number;
    subtotal_khr?: number;
    grand_total_khr?: number;

    // Financials
    sub_total: number;
    total_tax: number;
    total_discount: number;
    total_amount: number;
    balance_due: number;
    paid_amount: number;
    amount_in_words?: string;
    payment_status?: string;

    // Procurement
    expected_delivery?: string;

    // Branding
    branding?: any;
    
    // Line Items
    items: any[];
    
    // Warranty Specific
    warranty_certificate_no?: string;
    installation_date?: string;
    vehicle_vin_last4?: string;
}

export const normalizeData = (type: string, data: any): NormalizedDocument => {
    // Default structure based on common fields
    const normalized: NormalizedDocument = {
        doc_number: data.invoice_no || data.order_no || data.quotation_no || data.po_number || data.job_no || data.adjustment_no || data.doc_number || data.number || '',
        doc_date: formatDate(data.invoice_date || data.order_date || data.quotation_date || data.date || data.created_at || ''),
        expiry_date: formatDate(data.expiry_date || data.due_date || ''),
        reference: data.reference_no || data.reference || '',
        project_name: data.project?.name || '',
        warehouse_name: data.warehouse?.name || '',
        currency_code: data.currency?.code || 'USD',
        term_name: data.payment_term?.name || data.term_name || '',
        created_by: data.creator?.name || data.user?.name || '',
        va_name: data.va?.name || '',
        salesperson_name: data.salesperson?.name || '',

        // Party Info (Customer or Vendor)
        party_name: data.customer?.name || data.vendor?.name || data.supplier?.name || 'Walk-in Customer',
        party_name_km: data.customer?.name_km || data.vendor?.name_km || data.supplier?.name_km || '',
        party_code: data.customer?.code || data.vendor?.code || data.supplier?.code || '',
        party_phone: data.customer?.phone || data.vendor?.phone || data.supplier?.phone || '',
        party_email: data.customer?.email || data.vendor?.email || data.supplier?.email || '',
        party_address: data.customer?.address || data.vendor?.address || data.supplier?.address || '',
        billing_address: data.customer?.billing_address || data.vendor?.billing_address || data.supplier?.billing_address || '',
        contact_name: data.contact_person || '',
        contact_phone: data.contact_phone || '',
        contact_email: data.contact_email || '',
        vat_tin: data.customer?.vat_tin || data.vendor?.vat_tin || data.supplier?.vat_tin || '',
        memo: data.customer_memo || data.notes || data.note || '',

        // Vehicle / Workshop
        vehicle_reg: data.vehicle?.plate_number || data.vehicle_reg || '',
        vehicle_brand: data.vehicle?.brand?.name || '',
        vehicle_model: data.vehicle?.model?.name || '',
        vehicle_vin: data.vehicle?.vin || '',
        mileage_in: data.mileage_in || '',
        technician_name: data.lead_technician?.name || data.technician?.name || '',
        job_status: data.status || '',
        exchange_rate: data.exchange_rate || 4100,
        subtotal_khr: parseFloat(data.subtotal_khr || 0),
        grand_total_khr: parseFloat(data.grand_total_khr || 0),

        // Financials
        sub_total: parseFloat(data.subtotal || data.total_amount || 0),
        total_tax: parseFloat(data.tax_total || 0),
        total_discount: parseFloat(data.discount_total || 0),
        total_amount: parseFloat(data.grand_total || data.total_amount || 0),
        balance_due: parseFloat(data.balance_amount || 0),
        paid_amount: parseFloat(data.paid_amount || 0),
        amount_in_words: data.amount_in_words || '',
        payment_status: data.payment_status || '',

        // Procurement
        expected_delivery: formatDate(data.expected_delivery_date || ''),

        items: (() => {
            let rawItems = data.material_usage || data.items || [];
            
            // For Warranty Cards, extract services from data.items and inject them as headers
            if (type === 'job_warranty_card' && data.items && Array.isArray(data.items)) {
                const servicesMap = new Map();
                data.items.forEach((it: any) => {
                    const sName = it.service?.name;
                    if (sName && !servicesMap.has(sName)) {
                        servicesMap.set(sName, {
                            item_name: sName,
                            unit_price: 0,
                            quantity: 1, // Will be blanked out by the header logic later
                            is_synthetic_service: true
                        });
                    }
                });
                const serviceHeaders = Array.from(servicesMap.values());
                rawItems = [...serviceHeaders, ...rawItems];
            }

            if ((type === 'job_warranty_card' || type === 'sale_invoice') && rawItems.length > 0) {
                const groupedMap = new Map();
                const results: any[] = [];
                const seenKeys = new Set();

                // First pass: Group items
                rawItems.forEach((item: any) => {
                    const name = (item.item_name || item.product?.name || item.name || '').trim();
                    const price = Number(item.unit_price || item.price || 0);
                    const itemDesc = (item.description || item.notes || '').trim();
                    const jobPartName = (item.jobPart?.name || item.job_part?.name || item.part?.name || item.jobCardItem?.part?.name || item.job_card_item?.part?.name || item.part_name || '').trim();
                    const productName = (item.product?.name || '').trim();
                    
                    // For PPF, we consolidate even if part names are different.
                    // For HPF, we want each part as a separate line, so we include jobPartName in the key.
                    const isPPF = name.toUpperCase().includes('PPF') || (item.jobPart?.type || item.job_part?.type || item.jobCardItem?.part?.type || item.job_card_item?.part?.type || '').toUpperCase().includes('PPF');
                    const partKey = isPPF ? '' : jobPartName;
                    
                    const groupKey = `${name}-${itemDesc}-${price}-${productName}-${partKey}`.toLowerCase();
                    console.log('ITEM:', { name, price, productName, jobPartName, isPPF, partKey, groupKey });
                    
                    if (!name) return;

                    const itemQty = Number(item.quantity || item.qty || item.spent_qty || 1) || 0;

                    if (groupedMap.has(groupKey)) {
                        const existing = groupedMap.get(groupKey);
                        existing.spent_qty = (Number(existing.spent_qty) || 0) + (Number(item.spent_qty) || 0);
                        existing.actual_qty = (Number(existing.actual_qty) || 0) + (Number(item.actual_qty) || 0);
                        existing.quantity = (Number(existing.quantity) || 0) + itemQty;
                        existing.subtotal = (Number(existing.subtotal) || 0) + (Number(item.subtotal || item.total || item.amount || 0) || 0);
                        existing.isConsolidated = true;
                        
                        if (jobPartName) existing.all_parts.add(jobPartName);
                        if (itemDesc) existing.all_descs.add(itemDesc);
                    } else {
                        const parts = new Set();
                        if (jobPartName) parts.add(jobPartName);
                        const descs = new Set();
                        if (itemDesc) descs.add(itemDesc);

                        groupedMap.set(groupKey, { 
                            ...item, 
                            item_name: name,
                            all_parts: parts,
                            all_descs: descs,
                            quantity: itemQty,
                            subtotal: Number(item.subtotal || item.total || item.amount || 0) || 0,
                            isConsolidated: false
                        });
                    }
                });

                // Adjust quantities for consolidated services
                groupedMap.forEach((group: any) => {
                    const isService = Number(group.unit_price || group.price || 0) > 0;
                    if (group.isConsolidated && isService && group.quantity > 1) {
                        group.quantity -= 1;
                    }
                });

                // Second pass: Maintain order and include non-grouped items
                rawItems.forEach((item: any) => {
                    const name = (item.item_name || item.product?.name || item.name || '').trim();
                    const price = Number(item.unit_price || item.price || 0);
                    const itemDesc = (item.description || item.notes || '').trim();
                    const jobPartName = (item.jobPart?.name || item.job_part?.name || item.part?.name || item.jobCardItem?.part?.name || item.job_card_item?.part?.name || item.part_name || '').trim();
                    const productName = (item.product?.name || '').trim();
                    
                    const isPPF = name.toUpperCase().includes('PPF') || (item.jobPart?.type || item.job_part?.type || item.jobCardItem?.part?.type || item.job_card_item?.part?.type || '').toUpperCase().includes('PPF');
                    const partKey = isPPF ? '' : jobPartName;
                    
                    const groupKey = `${name}-${itemDesc}-${price}-${productName}-${partKey}`.toLowerCase();

                    if (!name) {
                        results.push(item);
                    } else if (!seenKeys.has(groupKey)) {
                        results.push(groupedMap.get(groupKey));
                        seenKeys.add(groupKey);
                    }
                });

                // Post-process: If multiple rows exist, hide quantity for Service Headers (HPF case)
                if (results.length > 1) {
                    results.forEach((res: any) => {
                        const isService = Number(res.unit_price || res.price || 0) > 0 || (!res.jobPart?.name && !res.job_part?.name && !res.product?.name);
                        if (isService) {
                            res.quantity = " ";
                        }
                    });
                }

                return results;
            }
            return rawItems;
        })().filter(Boolean).map((item: any) => {
            const product = item.product || item;
            const duration = product.warranty_duration || 0;
            const unit = product.warranty_unit || 'Months';
            
            // Calculate expiry if possible
            let expiryDate = '';
            if (duration && data.completed_at) {
                const date = new Date(data.completed_at);
                const unitLower = unit.toLowerCase();
                if (unitLower.includes('month')) date.setMonth(date.getMonth() + duration);
                else if (unitLower.includes('year')) date.setFullYear(date.getFullYear() + duration);
                else if (unitLower.includes('day')) date.setDate(date.getDate() + duration);
                expiryDate = date.toISOString().split('T')[0];
            }

            const mainName = item.item_name || item.product?.name || item.name || '';
            const jobPartName = item.jobPart?.name || item.job_part?.name || item.part?.name || item.jobCardItem?.part?.name || item.job_card_item?.part?.name || item.part_name || '';
            const productName = item.product?.name || '';
            
            const isService = Number(item.unit_price || item.price || 0) > 0;
            const subInfo = jobPartName || item.description || item.notes || '';
            
            let finalDescription = mainName || subInfo || '';
            let finalItemName = mainName;

            const isPPF = mainName.toUpperCase().includes('PPF') || (item.jobPart?.type || item.job_part?.type || item.jobCardItem?.part?.type || item.job_card_item?.part?.type || '').toUpperCase().includes('PPF');

            // If it's a part (price 0) and it has a product name
            if (!isService && productName) {
                if (isPPF) {
                    finalItemName = productName;
                    finalDescription = productName;
                } else if (jobPartName) {
                    finalItemName = `${jobPartName} ${productName}`;
                    finalDescription = finalItemName;
                } else {
                    finalItemName = productName;
                    finalDescription = productName;
                }
            } else if (!isService && jobPartName) {
                finalItemName = jobPartName;
                finalDescription = jobPartName;
            } else if (mainName && subInfo && !mainName.toLowerCase().includes(subInfo.toLowerCase()) && !subInfo.toLowerCase().includes(mainName.toLowerCase())) {
                finalDescription = `${mainName} (${subInfo})`;
            }

            return {
                ...item,
                item_name: finalItemName,
                name: finalItemName, // Also override 'name' just in case the template uses it
                unit_price: item.unit_price || item.price || item.unit_cost || 0,
                description: finalDescription,
                subtotal: item.subtotal || item.total || item.total_cost || item.amount || 0,
                warranty_duration: duration ? `${duration} ${unit}` : '',
                warranty_expiry: expiryDate,
                lifespan: product.lifespan_duration ? `${product.lifespan_duration} ${product.lifespan_unit}` : '',
            };
        }),
        warranty_certificate_no: data.warranty_no || `WTY-${data.job_no || ''}`,
        installation_date: formatDate(data.completed_at || ''),
        vehicle_vin_last4: data.vehicle?.vin ? data.vehicle.vin.slice(-4) : '',
        branding: data.branding || {}
    };

    return normalized;
};

export const getVariableMap = (norm: NormalizedDocument): Record<string, string> => {
    const formatNum = (num: number) => num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const b = norm.branding || {};

    const map: Record<string, string> = {
        // Document
        '{{doc_number}}': norm.doc_number,
        '{{doc_date}}': norm.doc_date,
        '{{expiry_date}}': norm.expiry_date || '',
        '{{reference}}': norm.reference || '',
        '{{project_name}}': norm.project_name || '',
        '{{warehouse_name}}': norm.warehouse_name || '',
        '{{currency_code}}': norm.currency_code,
        '{{term_name}}': norm.term_name || '',
        '{{created_by}}': norm.created_by || '',
        '{{va_name}}': norm.va_name || '',
        '{{salesperson_name}}': norm.salesperson_name || '',

        // Party
        '{{customer_name}}': norm.party_name,
        '{{local_customer_name}}': norm.party_name_km || norm.party_name,
        '{{customer_code}}': norm.party_code || '',
        '{{customer_phone}}': norm.party_phone || '',
        '{{customer_email}}': norm.party_email || '',
        '{{customer_address}}': norm.party_address || '',
        '{{billing_address}}': norm.billing_address || norm.party_address || '',
        '{{contact_name}}': norm.contact_name || '',
        '{{contact_phone}}': norm.contact_phone || '',
        '{{contact_email}}': norm.contact_email || '',
        '{{vat_tin}}': norm.vat_tin || '',
        '{{customer_memo}}': norm.memo || '',

        // Vendor (Aliases for same fields)
        '{{vendor_name}}': norm.party_name,
        '{{vendor_code}}': norm.party_code || '',
        '{{vendor_phone}}': norm.party_phone || '',
        '{{vendor_email}}': norm.party_email || '',
        '{{vendor_address}}': norm.party_address || '',

        // Vehicle / Workshop
        '{{vehicle_reg}}': norm.vehicle_reg || '',
        '{{vehicle_brand}}': norm.vehicle_brand || '',
        '{{vehicle_model}}': norm.vehicle_model || '',
        '{{vehicle_vin}}': norm.vehicle_vin || '',
        '{{mileage_in}}': norm.mileage_in || '',
        '{{technician_name}}': norm.technician_name || '',
        '{{job_status}}': norm.job_status || '',

        // Totals
        '{{sub_total}}': formatNum(norm.sub_total || 0),
        '{{total_tax}}': formatNum(norm.total_tax || 0),
        '{{total_discount}}': formatNum(norm.total_discount || 0),
        '{{total_amount}}': formatNum(norm.total_amount || 0),
        '{{total_amount_riel}}': (norm.grand_total_khr || (norm.total_amount || 0) * (norm.exchange_rate || 4100)).toLocaleString(undefined, { maximumFractionDigits: 0 }),
        '{{exchange_rate}}': (norm.exchange_rate || 4100).toLocaleString(),
        '{{balance_due}}': formatNum(norm.balance_due || 0),
        '{{paid_amount}}': formatNum(norm.paid_amount || 0),
        '{{amount_in_words}}': norm.amount_in_words || '',
        '{{payment_status}}': norm.payment_status || '',

        // Procurement
        '{{expected_delivery}}': norm.expected_delivery || '',

        // Branding
        '{{company_name}}': b.company_name || '',
        '{{local_company_name}}': b.company_name_km || b.company_name || '',
        '{{company_phone}}': b.company_phone || '',
        '{{company_email}}': b.company_email || '',
        '{{company_website}}': b.company_website || '',
        '{{company_address}}': b.company_address || '',
        '{{company_tin}}': b.company_tin || '',
        '{{company_logo}}': b.company_logo || '',

        // Warranty
        '{{warranty_certificate_no}}': norm.warranty_certificate_no || '',
        '{{installation_date}}': norm.installation_date || '',
        '{{vehicle_vin_last4}}': norm.vehicle_vin_last4 || '',
    };

    // Add raw keys for components that expect them without braces (e.g. data['doc_number'])
    const rawMap: Record<string, string> = {};
    Object.keys(map).forEach(key => {
        const rawKey = key.replace(/[{}]/g, '');
        rawMap[rawKey] = map[key];
        
        // Add branding. prefix for CompanyInfo compatibility
        if (rawKey.startsWith('company_')) {
            rawMap[`branding.${rawKey.replace('company_', '')}`] = map[key];
        }
    });

    return { ...map, ...rawMap };
};

export const resolveVariables = (content: string, vars: Record<string, string>): string => {
    if (!content) return '';
    return content.replace(/{{(.*?)}}/g, (match) => {
        return vars[match] !== undefined ? vars[match] : match;
    });
};
