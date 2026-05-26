import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { PlusCircle, Phone, Mail, Globe } from 'lucide-react';
import { Field } from './Field';

export const CompanyInfo = React.memo(({ s, data, onEdit, layout }: { s: any, data?: any, onEdit: any, layout?: any[] }) => {
    if (!s.header?.show) return null;

    const fields = s.header?.fields || {};
    const alignment = s.header?.alignment || 'left';
    const logo = s.header?.logo || { show: true, width: 120 };
    const layoutType = s.header?.layout_type || 'stack';
    const columns = s.header?.columns || 1;

    const handleLogoClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (ev: any) => {
            const file = ev.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (re: any) => {
                    onEdit({ id: 'header.logo', value: re.target.result, type: 'logo' });
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    // Simulation data for Branch mode in the editor
    const SAMPLE_BRANCH = {
        company_name: 'S-COOL CRM (South Branch)',
        company_name_km: 'S-COOL CRM (សាខាភ្នំពេញ)',
        company_address: 'No 123, St 456, Phnom Penh, Cambodia',
        company_phone: '+855 12 345 678 / +855 98 765 432',
        company_email: 'south-branch@s-cool-crm.com',
        company_website: 'www.s-cool-crm.com',
        company_logo: null // Fallback to global logo if branch doesn't have one
    };

    const displayValue = (fieldId: string) => {
        const source = s.brandingOverrides?.source || 'system';

        // 1. If it's a logo and we are in Branch mode, prioritize the dynamic data logo
        if (fieldId === 'company_logo' && source === 'branch' && data?.['branding.logo']) {
            return data['branding.logo'];
        }

        // 2. Prioritize template-specific header logo (Global/Custom Design choice)
        if (fieldId === 'company_logo' && s.header?.logo?.url) {
            return s.header.logo.url;
        }

        // 2. If 'custom', only return the manual override values
        if (source === 'custom') {
            return s.brandingOverrides?.[fieldId] || s.globalBranding?.[fieldId] || '';
        }

        // 3. For System/Branch, try real/sample data first
        if (data) {
            // Handle logo separately if it's in data
            if (fieldId === 'company_logo' && data['branding.logo']) return data['branding.logo'];
            
            const dataKey = `branding.${fieldId.replace('company_', '')}`;
            if (data[dataKey]) return data[dataKey];
        }

        // 4. Fallback logic for Branch source
        if (source === 'branch') {
            return SAMPLE_BRANCH[fieldId as keyof typeof SAMPLE_BRANCH] || s.globalBranding?.[fieldId] || '';
        }

        // 5. Default fallback (System)
        return s.globalBranding?.[fieldId] || '';
    };


    const hasDynamicLogo = useMemo(() => {
        // Check if any block in the header section is of type 'logo'
        return (layout || []).some((b: any) => b.type === 'logo');
    }, [layout]);

    const Logo = (
        <div 
            className="relative group cursor-pointer inline-block"
            onClick={handleLogoClick}
        >
            {displayValue('company_logo') ? (
                <img 
                    src={displayValue('company_logo')} 
                    alt="Logo" 
                    style={{ width: `${logo.width || 120}px` }} 
                    className="object-contain" 
                    onError={(e: any) => e.target.style.display = 'none'}
                />
            ) : (
                <div 
                    className="bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 rounded-lg group-hover:border-primary group-hover:bg-primary/5 transition-all text-center"
                    style={{ width: `${logo.width || 120}px`, height: `${(logo.width || 120) * 0.6}px` }}
                >
                    <PlusCircle className="w-5 h-5 text-slate-300 group-hover:text-primary mb-1" />
                    <span className="text-[8px] font-bold text-slate-400 group-hover:text-primary uppercase tracking-tighter">Global Logo</span>
                </div>
            )}
        </div>
    );

    const logoShowFinal = logo.show && !hasDynamicLogo;

    const Info = (
        <div className={cn(
            "flex flex-col gap-0.5",
            alignment === 'center' && "items-center text-center",
            alignment === 'right' && "items-end text-right"
        )}>
            {fields.local_company_name && (
                <Field 
                    id="header.local_company_name" 
                    label="Local Company Name" 
                    value={displayValue('company_name_km') || displayValue('company_name')} 
                    styles={s} 
                    data={data}
                    onEdit={onEdit} 
                    className="font-bold text-base" 
                />
            )}
            {fields.company_name && (
                <Field 
                    id="header.company_name" 
                    label="Company Name" 
                    value={displayValue('company_name')} 
                    styles={s} 
                    data={data}
                    onEdit={onEdit} 
                    className="font-bold text-sm" 
                />
            )}
            {fields.address && (
                <Field 
                    id="header.address" 
                    label="Address" 
                    value={displayValue('company_address')} 
                    styles={s} 
                    data={data}
                    onEdit={onEdit} 
                    className="text-[10px] text-slate-500 max-w-[400px]" 
                />
            )}
            {fields.vat_tin_number && (
                <Field 
                    id="header.vat_tin_number" 
                    label="VAT/TIN Number" 
                    value={displayValue('company_tin')} 
                    styles={s} 
                    data={data}
                    onEdit={onEdit} 
                    className="text-[10px] text-slate-500 font-bold" 
                />
            )}
            <div className={cn(
                "flex text-[10px] text-slate-500",
                s.header?.contact_layout === 'stack' ? "flex-col gap-0.5" : "flex-row gap-3",
                alignment === 'center' && (s.header?.contact_layout === 'stack' ? "items-center" : "justify-center"),
                alignment === 'right' && (s.header?.contact_layout === 'stack' ? "items-end" : "justify-end")
            )}>
                {fields.phone && (
                    <div className="flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" />
                        <Field id="header.phone" label="Phone" value={displayValue('company_phone')} styles={s} data={data} onEdit={onEdit} />
                    </div>
                )}
                {fields.email && (
                    <div className="flex items-center gap-1">
                        <Mail className="w-2.5 h-2.5" />
                        <Field id="header.email" label="Email" value={displayValue('company_email')} styles={s} data={data} onEdit={onEdit} />
                    </div>
                )}
                {fields.website && (
                    <div className="flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5" />
                        <Field id="header.website" label="Website" value={displayValue('company_website')} styles={s} data={data} onEdit={onEdit} />
                    </div>
                )}
            </div>
        </div>
    );

    const logoOnRight = logo.position === 'right';

    if (layoutType === 'columns') {
        const gridCols = columns === 1 ? 'grid-cols-1' : 'grid-cols-2';
        return (
            <div className={cn("grid gap-8 items-center", gridCols)}>
                {logoShowFinal && !logoOnRight && Logo}
                {Info}
                {logoShowFinal && logoOnRight && <div className="text-right">{Logo}</div>}
            </div>
        );
    }

    return (
        <div className={cn(
            "flex flex-col gap-4",
            alignment === 'center' && "items-center",
            alignment === 'right' && "items-end"
        )}>
            {logoShowFinal && Logo}
            {Info}
        </div>
    );
});
