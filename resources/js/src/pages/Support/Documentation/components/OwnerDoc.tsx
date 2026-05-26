import React from 'react';
import { IconBuildingStore, IconShieldCheck, IconFileSettings, IconUsersGroup, IconChartLine, IconLock, IconAdjustments, IconAppWindow } from '@tabler/icons-react';
import DocSection from './DocSection';
import InstructionCard from './InstructionCard';
import FeatureGrid from './FeatureGrid';

const OwnerDoc = () => {
    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <DocSection 
                title="Enterprise Governance" 
                icon={IconBuildingStore}
                subtitle="The command center for organizational policy and fiscal integrity."
            >
                This guide outlines the critical controls owners must manage to maintain operational consistency across all branches. It covers financial reconciliation, procurement oversight, and system-wide customization.
            </DocSection>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InstructionCard 
                    title="Procurement & Supplier Oversight"
                    steps={[
                        { label: "Review and approve 'Purchase Orders' over branch limits.", route: "/inventory/purchase-orders", action: "Procurement" },
                        { label: "Audit 'Supplier Performance' based on fulfillment speed." },
                        { label: "Verify 'Purchase Receives' against digital PO records." },
                        { label: "Reconcile 'Accounts Payable' in the Finance module." }
                    ]}
                    tip="Setting PO approval thresholds prevents unauthorized branch-level overspending."
                />

                <InstructionCard 
                    title="Dynamic Form Customization"
                    steps={[
                        { label: "Open the 'Form Template Builder'.", route: "/settings/templates", action: "Templates" },
                        { label: "Design custom schemas for specific document types." },
                        { label: "Link templates to 'Job Cards' or 'Purchase Orders'." },
                        { label: "Audit custom data capture in the document records." }
                    ]}
                    tip="Use templates to capture branch-specific data that isn't part of the core ERP schema."
                />
            </div>

            <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <IconLock size={16} /> Fiscal & Security Hardening
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border bg-card space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                            <IconChartLine size={18} />
                            <span className="text-xs font-bold uppercase">Atomic Shift Reconciliation</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Every dollar in the system must be linked to an <strong>Active Shift</strong>. Owners should audit shift closures daily to ensure zero cash variance between physical and digital ledgers.
                        </p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                            <IconShieldCheck size={18} />
                            <span className="text-xs font-bold uppercase">Digital Audit Trail (ULID)</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            System utilizes high-precision <strong>ULIDs</strong> for all logs. This ensures chronological integrity—no log can be inserted retroactively without breaking the audit chain.
                        </p>
                    </div>
                </div>
            </div>

            <FeatureGrid items={[
                { title: "Branch Geofencing", desc: "Enforce 130m GPS thresholds to prevent 'Proxy Scanning' in the Employee PWA." },
                { title: "Asset/Media Vault", desc: "Centralized auditing of all business-related attachments, contracts, and technician photos." },
                { title: "Exchange Rate Sync", desc: "Automated synchronization of KHR/USD rates to maintain pricing consistency across branches." },
                { title: "PWA Branding", desc: "Live customization of the Employee PWA appearance, logos, and targeted announcements." }
            ]} />
        </div>
    );
};

export default OwnerDoc;
