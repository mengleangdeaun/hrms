import React from 'react';
import { IconChecklist, IconDeviceMobile, IconLayoutDashboard, IconTruckDelivery, IconRepeat, IconInfoCircle, IconTerminal, IconUserCheck, IconPackageImport, IconFileSearch, IconBinary, IconArrowRightBar } from '@tabler/icons-react';
import DocSection from './DocSection';
import InstructionCard from './InstructionCard';
import FeatureGrid from './FeatureGrid';

const UserDoc = () => {
    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            <DocSection 
                title="System Operational Workflows" 
                icon={IconChecklist}
                subtitle="Exhaustive manual for CRM, Procurement, Warehouse, and Workshop operations."
            >
                This guide provides step-by-step instructions for the full organizational lifecycle—from acquiring leads and stock to delivering high-precision workshop services.
            </DocSection>

            {/* CRM & Pipeline Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <IconFileSearch className="text-primary" size={20} />
                    <h3 className="text-lg font-bold tracking-tight">CRM & Lead Pipeline</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <InstructionCard 
                        title="Managing Prospects (Leads)"
                        steps={[
                            { label: "Capture new prospects in 'CRM > Leads'.", route: "/dashboard/leads", action: "Leads" },
                            { label: "Move leads through Pipeline Stages (Contacted, Interested, etc.)." },
                            { label: "Add 'Notes' or 'Reminders' for follow-up activities." },
                            { label: "Click 'Convert to Customer' once they commit to a service." }
                        ]}
                        tip="Maintaining an active pipeline ensures high conversion rates for the sales team."
                    />
                    <InstructionCard 
                        title="Contact & Customer Hub"
                        steps={[
                            { label: "Search for existing customers by Name or Phone.", route: "/crm/customers", action: "Customers" },
                            { label: "Verify 'Customer Vehicles' and past service history." },
                            { label: "Link secondary contacts (Company representatives) if needed." },
                            { label: "Review 'Customer Feedback' for past service sentiment." }
                        ]}
                        tip="Always check service history before giving pricing to recurring customers."
                    />
                </div>
            </div>

            {/* Procurement & Warehouse Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <IconPackageImport className="text-blue-500" size={20} />
                    <h3 className="text-lg font-bold tracking-tight">Procurement & Warehouse Ops</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <InstructionCard 
                        title="Inbound Stock (Procurement)"
                        steps={[
                            { label: "Create a 'Purchase Order' for the supplier.", route: "/inventory/purchase-orders", action: "Purchase Orders" },
                            { label: "Once stock arrives, create a 'Purchase Receive'." },
                            { label: "Verify item counts and 'Expiry Dates' (if applicable)." },
                            { label: "System will automatically update Stock Balances upon 'Post'." }
                        ]}
                        tip="Ensure 'Supplier Invoices' are uploaded as attachments for financial audit."
                    />
                    <InstructionCard 
                        title="Warehouse Movements"
                        steps={[
                            { label: "Request 'Stock Transfers' between branches.", route: "/stock/transfers", action: "Transfers" },
                            { label: "Perform 'Stock Adjustments' for variance or damage.", route: "/stock/adjustments", action: "Adjustments" },
                            { label: "Monitor 'Serial Movements' for high-value tracked items." },
                            { label: "Conduct quarterly 'Stock Takes' to sync physical vs digital counts." }
                        ]}
                        tip="All warehouse movements require 'Approval' from a Manager before taking effect."
                    />
                </div>
            </div>

            {/* Advanced Workshop Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <IconBinary className="text-emerald-500" size={20} />
                    <h3 className="text-lg font-bold tracking-tight">Advanced Workshop Logic</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <InstructionCard 
                        title="Serial Tracking & Off-Cuts"
                        steps={[
                            { label: "Select a 'Serial Number' when consuming tracked products." },
                            { label: "For partial usage (Tinting/PPF), record 'Spent Quantity'." },
                            { label: "System generates an 'Off-Cut Serial' for the remaining balance." },
                            { label: "Track 'Off-Cut' history to ensure zero material waste." }
                        ]}
                        tip="Off-cut management is essential for high-cost materials sold by roll or length."
                    />
                    <InstructionCard 
                        title="QC & Job Card Finalization"
                        steps={[
                            { label: "Perform 'Quality Control' checks via the QC portal.", route: "/services/job-cards/qc", action: "QC Portal" },
                            { label: "Record Technician Performance metrics (Time-on-task)." },
                            { label: "Sync progress to the Customer TMA for transparency." },
                            { label: "Set Job Card to 'Delivered' to trigger the rating prompt." }
                        ]}
                        tip="Digital QC signatures are mandatory for warranty-protected repair items."
                    />
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <IconArrowRightBar size={16} /> Operational Governance
                </h3>
                <FeatureGrid items={[
                    { title: "Shift-Gated Sales", desc: "No Sales Order can be recorded without an active, open Shift in the Admin Panel." },
                    { title: "Atomic Inventory", desc: "Stock is deducted at the point of Invoice (Direct Sale) or Material Recording (Workshop)." },
                    { title: "GPS Integrity", desc: "Employee Attendance requires a 130m proximity scan via the PWA interface." },
                    { title: "Document precision", desc: "System auto-generates prefixed IDs (PO-XXXX, JC-XXXX) for all organizational artifacts." }
                ]} />
            </div>
        </div>
    );
};

export default UserDoc;
