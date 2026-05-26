import { useCallback } from 'react';
import api from '@/utils/api';
import { toast } from 'sonner';

interface PrintData {
    id: number;
    order_no?: string;
    order_date?: string;
    grand_total?: number | string;
    subtotal?: number | string;
    tax_total?: number | string;
    discount_total?: number | string;
    paid_amount?: number | string;
    balance_amount?: number | string;
    customer?: {
        name?: string;
        phone?: string;
        email?: string;
        address?: string;
    };
    vehicle?: {
        plate_number?: string;
        brand?: { name?: string };
        model?: { name?: string };
        year?: string;
        color?: string;
    };
    items?: Array<{
        name: string;
        quantity: number;
        price: number;
        total: number;
    }>;
    branch_id?: number;
}

export const useDocumentPrint = () => {
    const print = useCallback(async (documentType: string, data: PrintData) => {
        const resolveVariables = (text: string, data: any, branding: any) => {
            if (!text) return '';
            
            let processed = text;
            const variables: Record<string, any> = {
                // Order details
                'order.no': data.order_no || '',
                'order.date': data.order_date || '',
                'order.total': data.grand_total || '0.00',
                'order.subtotal': data.subtotal || '0.00',
                'order.tax': data.tax_total || '0.00',
                'order.balance': data.balance_amount || '0.00',
                'order.paid': data.paid_amount || '0.00',
                
                // Customer details
                'customer.name': data.customer?.name || 'Walk-in Customer',
                'customer.phone': data.customer?.phone || '',
                'customer.email': data.customer?.email || '',
                'customer.address': data.customer?.address || '',
                
                // Vehicle details
                'vehicle.plate': data.vehicle?.plate_number || '',
                'vehicle.brand': data.vehicle?.brand?.name || '',
                'vehicle.model': data.vehicle?.model?.name || '',
                
                // Branding details
                'branding.company_name': branding.company_name || '',
                'branding.address': branding.company_address || '',
                'branding.phone': branding.company_phone || '',
                'branding.email': branding.company_email || '',
                'branding.website': branding.company_website || '',
                'branding.bank_details': branding.company_bank_details || '',
                'branding.footer': branding.company_footer_text || '',
            };

            Object.keys(variables).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                const val = variables[key];
                processed = processed.replace(regex, val !== null && val !== undefined ? String(val) : '');
            });

            return processed;
        };

        const renderBlock = (block: any, data: any, branding: any, templateStyles: any): string => {
            const blockStyles = block.styles || {};
            const styleString = `
                font-family: ${blockStyles.fontFamily || 'inherit'};
                font-size: ${blockStyles.fontSize || 'inherit'};
                font-weight: ${blockStyles.fontWeight || 'normal'};
                font-style: ${blockStyles.fontStyle || 'normal'};
                color: ${blockStyles.color || 'inherit'};
                margin-bottom: 20px;
                line-height: 1.5;
            `;

            const blockType = block.type || block.id;

            switch (blockType) {
                case 'logo':
                case 'block_logo':
                    const logoUrl = branding.company_logo || '';
                    return logoUrl ? `<div style="margin-bottom: 15px;"><img src="${logoUrl}" style="max-height: 70px; width: auto;" /></div>` : '';
                
                case 'comp_info':
                case 'company_info':
                    return `
                        <div style="${styleString}">
                            <h2 style="margin: 0 0 5px 0; font-size: 1.25em; color: ${templateStyles.primary_color || '#000'}">${branding.company_name || ''}</h2>
                            <p style="margin: 2px 0;">${branding.company_address || ''}</p>
                            <p style="margin: 2px 0;">Tel: ${branding.company_phone || ''} | Email: ${branding.company_email || ''}</p>
                            ${branding.company_website ? `<p style="margin: 2px 0;">${branding.company_website}</p>` : ''}
                        </div>
                    `;

                case 'client_details':
                case 'client_info':
                    return `
                        <div style="${styleString} border: 1px solid #e4e4e7; padding: 15px; border-radius: 12px; background: #fafafa;">
                            <div style="font-weight: 800; font-size: 0.75rem; margin-bottom: 8px; color: ${templateStyles.primary_color || '#000'}; text-transform: uppercase; letter-spacing: 0.05em;">Bill To</div>
                            <p style="margin: 2px 0; font-size: 1.1em; font-weight: bold;">${data.customer?.name || 'Walk-in Customer'}</p>
                            ${data.customer?.phone ? `<p style="margin: 1px 0;">${data.customer.phone}</p>` : ''}
                            ${data.vehicle ? `
                                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; display: flex; gap: 15px;">
                                    <div><span style="color: #71717a; font-size: 0.8em; font-weight: bold; text-transform: uppercase;">Vehicle:</span> <span style="font-weight: bold;">${data.vehicle.plate_number}</span></div>
                                    <div><span style="color: #71717a; font-size: 0.8em; font-weight: bold; text-transform: uppercase;">Model:</span> <span style="font-weight: bold;">${data.vehicle.brand?.name || ''} ${data.vehicle.model?.name || ''}</span></div>
                                </div>
                            ` : ''}
                        </div>
                    `;

                case 'items_table':
                    const items = data.items || [];
                    let tableHtml = `
                        <table style="width: 100%; border-collapse: collapse; margin: 30px 0; font-size: 0.9em;">
                            <thead>
                                <tr style="background: ${templateStyles.primary_color || '#18181b'}; color: white;">
                                    <th style="padding: 12px 15px; text-align: left; border-radius: 8px 0 0 8px;">DESCRIPTION</th>
                                    <th style="padding: 12px 15px; text-align: center;">QTY</th>
                                    <th style="padding: 12px 15px; text-align: right;">PRICE</th>
                                    <th style="padding: 12px 15px; text-align: right; border-radius: 0 8px 8px 0;">TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    
                    if (items.length === 0) {
                        tableHtml += `
                            <tr><td colspan="4" style="padding: 20px; text-align: center; color: #71717a;">No items found.</td></tr>
                        `;
                    } else {
                        items.forEach((item: any, index: number) => {
                            tableHtml += `
                                <tr style="border-bottom: 1px solid #f4f4f5;">
                                    <td style="padding: 12px 15px;">
                                        <div style="font-weight: bold;">${item.item_name || item.name || item.product?.name || item.service?.name || 'Service Item'}</div>
                                        ${item.description ? `<div style="font-size: 0.85em; color: #71717a;">${item.description}</div>` : ''}
                                    </td>
                                    <td style="padding: 12px 15px; text-align: center;">${item.quantity || item.qty}</td>
                                    <td style="padding: 12px 15px; text-align: right;">$${parseFloat(item.unit_price || item.price || 0).toFixed(2)}</td>
                                    <td style="padding: 12px 15px; text-align: right; font-weight: bold;">$${parseFloat(item.subtotal || item.total || 0).toFixed(2)}</td>
                                </tr>
                            `;
                        });
                    }

                    tableHtml += `</tbody></table>`;
                    return tableHtml;

                case 'totals':
                    return `
                        <div style="float: right; width: 280px; margin-top: 20px; font-size: 0.95em; background: #fafafa; padding: 20px; border-radius: 12px; border: 1px solid #f4f4f5;">
                            <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                                <span style="color: #71717a;">Subtotal:</span>
                                <span style="font-weight: bold;">$${parseFloat(data.subtotal || 0).toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                                <span style="color: #71717a;">Discount:</span>
                                <span style="font-weight: bold; color: #10b981;">-$${parseFloat(data.discount_total || 0).toFixed(2)}</span>
                            </div>
                            ${parseFloat(String(data.tax_total || 0)) > 0 ? `
                                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                                    <span style="color: #71717a;">VAT (Tax):</span>
                                    <span style="font-weight: bold;">$${parseFloat(data.tax_total || 0).toFixed(2)}</span>
                                </div>
                            ` : ''}
                            <div style="display: flex; justify-content: space-between; padding: 15px 0 5px 0; margin-top: 10px; border-top: 2px solid #eee; font-size: 1.25em;">
                                <span style="font-weight: 800;">Total Amount:</span>
                                <span style="font-weight: 800; color: ${templateStyles.primary_color || '#000'};">$${parseFloat(data.grand_total || 0).toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 5px 0; color: #6366f1;">
                                <span>Paid Amount:</span>
                                <span style="font-weight: bold;">$${parseFloat(data.paid_amount || 0).toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 10px 0; margin-top: 5px; border-top: 1px dashed #ddd; color: #ef4444;">
                                <span style="font-weight: bold;">Remaining Balance:</span>
                                <span style="font-weight: 900; font-size: 1.1em;">$${parseFloat(data.balance_amount || 0).toFixed(2)}</span>
                            </div>
                        </div>
                        <div style="clear: both;"></div>
                    `;

                case 'custom_text':
                    return `<div style="${styleString}">${resolveVariables(block.label || '', data, branding)}</div>`;

                case 'notes':
                    return `
                        <div style="margin-top: 40px; font-size: 0.85em; color: #52525b; border-top: 1px solid #f4f4f5; padding-top: 20px;">
                            <p style="font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #a1a1aa; margin-bottom: 8px;">Note & Payment Details</p>
                            <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${data.notes || data.remarks || 'Thank you for your business. Please finalize payment by the due date.'}</p>
                            ${branding.company_bank_details ? `
                                <div style="margin-top: 15px; padding: 12px; background: #f0f9ff; border-radius: 8px; border: 1px solid #e0f2fe;">
                                    <span style="font-weight: bold; color: #0369a1; display: block; margin-bottom: 4px;">Bank Transfer Details:</span>
                                    <span style="color: #0c4a6e;">${branding.company_bank_details}</span>
                                </div>
                            ` : ''}
                        </div>
                    `;

                case 'grid_row':
                    const cols = block.columns || [];
                    return `
                        <div style="display: flex; gap: 40px; margin-bottom: 25px; align-items: flex-start;">
                            ${cols.map((col: any) => `
                                <div style="flex: 1;">
                                    ${col.blocks.map((b: any) => renderBlock(b, data, branding, templateStyles)).join('')}
                                </div>
                            `).join('')}
                        </div>
                    `;

                default:
                    return '';
            }
        };

        try {
            // 1. Fetch template
            const templateRes = await api.get(`/document-types/${documentType}/active-template`);
            const template = templateRes.data;
            const layout = template.layout_config;
            const styles = template.styles || {};

            // 2. Resolve Branding
            const globalBrandingRes = await api.get('/settings/branding/global');
            let branding = globalBrandingRes.data;

            if (data.branch_id) {
                try {
                    const branchesRes = await api.get('/settings/branding/branches');
                    const branch = branchesRes.data.find((b: any) => b.id === data.branch_id);
                    if (branch) {
                        console.log("Applying branch branding overrides", branch);
                        if (branch.logo_url) branding.company_logo = branch.logo_url;
                        if (branch.footer_text) branding.company_footer_text = branch.footer_text;
                        if (branch.payment_account) {
                            branding.company_bank_details = `${branch.payment_account.name} (A/C: ${branch.payment_account.account_no})`;
                        }
                    }
                } catch (e) {
                    console.warn("Could not load branch branding override - using global", e);
                }
            }

            if (!layout || (!layout.header && !layout.body && !layout.footer)) {
                throw new Error("Invalid template configuration: no visible sections found.");
            }

            const getBlocks = (section: any) => {
                if (Array.isArray(section)) return section;
                if (section && typeof section === 'object' && Array.isArray(section.items)) return section.items;
                return [];
            };

            const headerHtml = getBlocks(layout.header).map((b: any) => renderBlock(b, data, branding, styles)).join('');
            const bodyHtml = getBlocks(layout.body).map((b: any) => renderBlock(b, data, branding, styles)).join('');
            const footerHtml = getBlocks(layout.footer).map((b: any) => renderBlock(b, data, branding, styles)).join('');

            const fullHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invoice - ${data.order_no}</title>
                    <style>
                        @page { size: ${template.page_size || 'A4'} portrait; margin: 15mm; }
                        body { 
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
                            margin: 0; 
                            padding: 0; 
                            color: #18181b;
                            line-height: 1.5;
                        }
                        .print-container { width: 100%; border: none; }
                        .header { margin-bottom: 20px; }
                        .footer { margin-top: auto; padding-top: 30px; }
                        * { box-sizing: border-box; }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        <div class="header">${headerHtml}</div>
                        <div class="body">${bodyHtml}</div>
                        <div class="footer">${footerHtml}</div>
                    </div>
                </body>
                </html>
            `;

            // 4. Handle Print via Iframe
            let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
            if (iframe) iframe.remove();
            
            iframe = document.createElement('iframe');
            iframe.id = 'print-iframe';
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow?.document || iframe.contentDocument;
            if (doc) {
                doc.open();
                doc.write(fullHtml);
                doc.close();

                const images = doc.getElementsByTagName('img');
                const imagePromises = Array.from(images).map(img => {
                    return new Promise(resolve => {
                        if (img.complete) resolve(true);
                        else {
                            img.onload = () => resolve(true);
                            img.onerror = () => resolve(true);
                        }
                    });
                });

                await Promise.all(imagePromises);
                
                setTimeout(() => {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                }, 500);
            }
        } catch (error: any) {
            console.error("Print Engine Error:", error);
            toast.error(error.response?.data?.message || 'Print generation failed');
        }
    }, []);

    return { print };
};
