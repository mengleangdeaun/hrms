import React from 'react';
import { IconKeyboard, IconCommand, IconMouse, IconTerminal, IconDeviceFloppy, IconBriefcase, IconBuildingStore, IconReceipt, IconPackage, IconBook, IconSearch, IconReportAnalytics, IconAlertTriangle, IconTool } from '@tabler/icons-react';
import DocSection from './DocSection';
import FeatureGrid from './FeatureGrid';

const ShortcutsDoc = () => {
    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            <DocSection 
                title="System Keyboard Shortcuts" 
                icon={IconKeyboard}
                subtitle="Domain-specific keyboard hotkeys for rapid enterprise operations."
            >
                Shortcuts are categorized by functional modules to prevent confusion. Each hotkey is permission-aware and will only trigger if you have access to the underlying module.
            </DocSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Core Navigation */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b pb-2">
                        <IconTerminal size={16} /> Global System
                    </h3>
                    <div className="rounded-lg border bg-card overflow-hidden">
                        <ShortcutItem keys={['Alt', 'H']} label="Home Dashboard" />
                        <ShortcutItem keys={['Alt', 'K']} label="Global Search" />
                        <ShortcutItem keys={['Alt', 'D']} label="Instructional Manuals" />
                        <ShortcutItem keys={['Alt', '/']} label="Shortcut Keys Guide" />
                        <ShortcutItem keys={['Alt', 'G']} label="System Activity Logs" />
                    </div>
                </div>

                {/* Sales & CRM */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b pb-2 text-blue-600 dark:text-blue-400">
                        <IconMouse size={16} /> Sales & CRM
                    </h3>
                    <div className="rounded-lg border border-blue-100 bg-blue-50/10 dark:border-blue-900/50 dark:bg-blue-950/20 overflow-hidden">
                        <ShortcutItem keys={['Alt', 'S']} label="Open POS / Create Sale" />
                        <ShortcutItem keys={['Alt', 'Shift', 'S']} label="Sales Records (List)" />
                        <ShortcutItem keys={['Alt', 'V']} label="Sales Invoices" />
                        <ShortcutItem keys={['Alt', 'Shift', 'D']} label="Sales Dashboard" />
                        <ShortcutItem keys={['Alt', 'Q']} label="Create New Quotation" />
                        <ShortcutItem keys={['Alt', 'Shift', 'Q']} label="Quotations Records" />
                        <ShortcutItem keys={['Alt', 'L']} label="Create New Lead" />
                    </div>
                </div>

                {/* Finance Module */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b pb-2 text-emerald-600 dark:text-emerald-400">
                        <IconReceipt size={16} /> Finance Module
                    </h3>
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/10 dark:border-emerald-900/50 dark:bg-emerald-950/20 overflow-hidden">
                        <ShortcutItem keys={['Alt', 'F']} label="Financial Transactions" />
                        <ShortcutItem keys={['Alt', 'Shift', 'F']} label="Payment Accounts" />
                        <ShortcutItem keys={['Alt', 'N']} label="Incomes (Income list)" />
                        <ShortcutItem keys={['Alt', 'X']} label="Expenses (Expense list)" />
                    </div>
                </div>

                {/* Workshop Module */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b pb-2 text-orange-600 dark:text-orange-400">
                        <IconTool size={16} /> Workshop Module
                    </h3>
                    <div className="rounded-lg border border-orange-100 bg-orange-50/10 dark:border-orange-900/50 dark:bg-orange-950/20 overflow-hidden">
                        <ShortcutItem keys={['Alt', 'J']} label="Job Cards Master" />
                        <ShortcutItem keys={['Alt', 'C']} label="QC Reports" />
                    </div>
                </div>

                {/* Human Resources */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b pb-2">
                        <IconBriefcase size={16} /> Human Resources
                    </h3>
                    <div className="rounded-lg border bg-card overflow-hidden">
                        <ShortcutItem keys={['Alt', 'A']} label="Attendance Records" />
                        <ShortcutItem keys={['Alt', 'E']} label="Employee Master List" />
                        <ShortcutItem keys={['Alt', 'B']} label="Branch Management" />
                    </div>
                </div>

                {/* Logistics */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b pb-2">
                        <IconPackage size={16} /> Logistics
                    </h3>
                    <div className="rounded-lg border bg-card overflow-hidden">
                        <ShortcutItem keys={['Alt', 'O']} label="Purchase Orders" />
                        <ShortcutItem keys={['Alt', 'I']} label="Purchase Receives" />
                        <ShortcutItem keys={['Alt', 'M']} label="Media Library" />
                    </div>
                </div>
            </div>

            <FeatureGrid items={[
                { title: "Permission Aware", desc: "A shortcut will only trigger if the current user has the required module permissions." },
                { title: "Input Detection", desc: "Hotkeys are intelligently suppressed while focus is inside any text-entry field." }
            ]} />
        </div>
    );
};

interface ShortcutItemProps {
    keys: string[];
    label: string;
}

const ShortcutItem = ({ keys, label }: ShortcutItemProps) => (
    <div className="flex items-center justify-between p-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors group">
        <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground">{label}</span>
        <div className="flex gap-1">
            {keys.map((key, i) => (
                <kbd key={i} className="px-1.5 py-0.5 rounded border border-b-2 bg-muted text-[10px] font-bold shadow-sm">
                    {key}
                </kbd>
            ))}
        </div>
    </div>
);

export default ShortcutsDoc;
