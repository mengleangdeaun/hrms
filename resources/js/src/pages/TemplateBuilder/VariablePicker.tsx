import React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { Braces, Building2, User, FileText, Settings2 } from 'lucide-react';

interface VariablePickerProps {
    typeSlug: string;
    onSelect: (variable: string) => void;
    className?: string;
}

const COMPANY_VARIABLES = [
    { label: 'Company Name', value: '{{company_name}}' },
    { label: 'Local Company Name', value: '{{local_company_name}}' },
    { label: 'Company Phone', value: '{{company_phone}}' },
    { label: 'Company Email', value: '{{company_email}}' },
    { label: 'Company Address', value: '{{company_address}}' },
    { label: 'Company TIN', value: '{{company_tin}}' },
];

const CUSTOMER_VARIABLES = [
    { label: 'Customer Name', value: '{{customer_name}}' },
    { label: 'Local Customer Name', value: '{{local_customer_name}}' },
    { label: 'Customer Code', value: '{{customer_code}}' },
    { label: 'Customer Phone', value: '{{customer_phone}}' },
    { label: 'Customer Email', value: '{{customer_email}}' },
    { label: 'Customer Address', value: '{{customer_address}}' },
    { label: 'Billing Address', value: '{{billing_address}}' },
    { label: 'Contact Name', value: '{{contact_name}}' },
    { label: 'VAT TIN', value: '{{vat_tin}}' },
    { label: 'Customer Memo', value: '{{customer_memo}}' },
];

const VENDOR_VARIABLES = [
    { label: 'Vendor Name', value: '{{vendor_name}}' },
    { label: 'Vendor Code', value: '{{vendor_code}}' },
    { label: 'Vendor Phone', value: '{{vendor_phone}}' },
    { label: 'Vendor Email', value: '{{vendor_email}}' },
    { label: 'Vendor Address', value: '{{vendor_address}}' },
];

const VEHICLE_VARIABLES = [
    { label: 'Plate Number', value: '{{vehicle_reg}}' },
    { label: 'Vehicle Brand', value: '{{vehicle_brand}}' },
    { label: 'Vehicle Model', value: '{{vehicle_model}}' },
    { label: 'VIN (Last 4)', value: '{{vehicle_vin}}' },
    { label: 'Mileage In', value: '{{mileage_in}}' },
];

const WORKSHOP_VARIABLES = [
    { label: 'Technician', value: '{{technician_name}}' },
    { label: 'Job Status', value: '{{job_status}}' },
];

const PROCUREMENT_VARIABLES = [{ label: 'Expected Delivery', value: '{{expected_delivery}}' }];

const WARRANTY_VARIABLES = [
    { label: 'Warranty Cert No', value: '{{warranty_certificate_no}}' },
    { label: 'Installation Date', value: '{{installation_date}}' },
];

const DOCUMENT_VARIABLES = [
    { label: 'Doc Number', value: '{{doc_number}}' },
    { label: 'Doc Date', value: '{{doc_date}}' },
    { label: 'Expiry Date', value: '{{expiry_date}}' },
    { label: 'Reference', value: '{{reference}}' },
    { label: 'Currency', value: '{{currency_code}}' },
    { label: 'Term', value: '{{term_name}}' },
    { label: 'Created By', value: '{{created_by}}' },
    { label: 'Salesperson', value: '{{salesperson_name}}' },
];

const TRANSACTION_VARIABLES = [
    { label: 'Sub Total', value: '{{sub_total}}' },
    { label: 'Total Tax', value: '{{total_tax}}' },
    { label: 'Total Discount', value: '{{total_discount}}' },
    { label: 'Total Amount', value: '{{total_amount}}' },
    { label: 'Amount In Words', value: '{{amount_in_words}}' },
    { label: 'Balance Due', value: '{{balance_due}}' },
    { label: 'Payment Status', value: '{{payment_status}}' },
];

const VariablePicker: React.FC<VariablePickerProps> = ({ typeSlug, onSelect, className }) => {
    const { t } = useTranslation();

    const isPurchase = ['purchase-order', 'purchase-receive'].includes(typeSlug);
    const isWorkshop = ['job-card', 'replacement', 'invoice', 'quote', 'job_warranty_card', 'sale_invoice', 'quotation'].includes(typeSlug);
    const isWarranty = ['job_warranty_card'].includes(typeSlug);

    const renderGroup = (label: string, icon: any, variables: any[], show = true) => {
        if (!show || variables.length === 0) return null;
        return (
            <SelectGroup className='p-2' >
                <SelectLabel className="text-[10px] uppercase tracking-widest text-primary font-black px-3 py-2.5 flex items-center gap-2 border-t mt-1 first:border-t-0 first:mt-0">
                    {icon} {label}
                </SelectLabel>
                {variables.map((v) => (
                    <SelectItem key={v.value} value={v.value} textValue={v.label} className="text-xs py-2 mx-auto rounded-md cursor-pointer focus:bg-primary/10">
                        <div className="flex flex-col gap-1.5 w-full">
                            <span className="font-bold text-slate-700 dark:text-slate-200 leading-none">{v.label}</span>
                            <span className="text-[10px] text-slate-400 font-mono tracking-tight">{v.value}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectGroup>
        );
    };

    return (
        <div className={className}>
            <Select onValueChange={onSelect}>
                <SelectTrigger className="h-9 text-xs font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary/50 transition-all">
                    <div className="flex items-center gap-2">
                        <Braces className="w-3.5 h-3.5 text-primary" />
                        <SelectValue placeholder={t('insert_variable')} />
                    </div>
                </SelectTrigger>
                <SelectContent className="max-h-[400px] w-auto">
                    {renderGroup('Company', <Building2 className="w-3 h-3" />, COMPANY_VARIABLES)}
                    {renderGroup(isPurchase ? 'Vendor' : 'Customer', <User className="w-3 h-3" />, isPurchase ? VENDOR_VARIABLES : CUSTOMER_VARIABLES)}
                    {renderGroup('Vehicle', <Settings2 className="w-3 h-3" />, VEHICLE_VARIABLES, isWorkshop)}
                    {renderGroup('Workshop', <FileText className="w-3 h-3" />, WORKSHOP_VARIABLES, isWorkshop)}
                    {renderGroup('Document', <FileText className="w-3 h-3" />, DOCUMENT_VARIABLES)}
                    {renderGroup('Warranty', <Braces className="w-3 h-3" />, WARRANTY_VARIABLES, isWarranty)}
                    {renderGroup('Procurement', <FileText className="w-3 h-3" />, PROCUREMENT_VARIABLES, isPurchase)}
                    {renderGroup('Totals', <Settings2 className="w-3 h-3" />, TRANSACTION_VARIABLES)}
                </SelectContent>
            </Select>
        </div>
    );
};

export default VariablePicker;
