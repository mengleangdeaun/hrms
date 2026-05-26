import React from 'react';
import { IconCode, IconDatabase, IconWebhook, IconSchema, IconTerminal, IconApi, IconServer, IconShieldLock, IconBinary, IconPackage, IconTruck, IconUsers, IconUserCheck, IconTool, IconBusinessplan, IconSettings, IconDeviceMobile } from '@tabler/icons-react';
import DocSection from './DocSection';
import InstructionCard from './InstructionCard';
import FeatureGrid from './FeatureGrid';

const DeveloperDoc = () => {
    return (
        <div className="space-y-16 animate-in fade-in duration-500">
            <DocSection 
                title="Master API & Engineering Reference" 
                icon={IconCode}
                subtitle="Exhaustive index of 530+ endpoints and the core logic engines driving the ERP."
            >
                This blueprint provides a 1:1 mapping of the system's operational surface area. It is categorized by functional domain to ensure technical integrity across the Web, PWA, and TMA platforms.
            </DocSection>

            {/* Core Logic Engine */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <IconTerminal size={16} /> Backend Logic Engines
                </h3>
                <FeatureGrid items={[
                    { title: "StockService.php", desc: "Orchestrates atomic balance updates, serial movements, and Off-Cut generation logic." },
                    { title: "FinanceService.php", desc: "Manages double-entry ledger accuracy with multi-currency conversion and pessimistic locking." },
                    { title: "AttendanceService.php", desc: "Calculates geofencing (Haversine) and enforces shift-based attendance policies." },
                    { title: "NotificationService.php", desc: "Unified dispatcher for Reverb (WebSockets), Telegram, and Web Push notifications." }
                ]} />
            </div>

            {/* Inventory Master Data */}
            <ApiGroup 
                title="Inventory Master Data" 
                icon={IconPackage}
                endpoints={[
                    { method: 'GET|POST', path: '/api/inventory/products', desc: 'Manage the core product catalog and specifications.' },
                    { method: 'GET|PUT|DEL', path: '/api/inventory/products/{id}', desc: 'CRUD operations for specific product units.' },
                    { method: 'GET|POST', path: '/api/inventory/categories', desc: 'Hierarchical product categorization.' },
                    { method: 'GET|POST', path: '/api/inventory/tags', desc: 'Metadata tagging for advanced filtering.' },
                    { method: 'GET|POST', path: '/api/inventory/uoms', desc: 'Units of Measure (Standardization for Stock/Sales).' },
                    { method: 'GET|POST', path: '/api/inventory/locations', desc: 'Warehouse and shelf-level location management.' }
                ]}
            />

            {/* Procurement & Suppliers */}
            <ApiGroup 
                title="Procurement & Logistics" 
                icon={IconTruck}
                endpoints={[
                    { method: 'GET|POST', path: '/api/inventory/suppliers', desc: 'Manage external vendor profiles and contact data.' },
                    { method: 'GET|POST', path: '/api/inventory/purchase-orders', desc: 'Lifecycle management of stock acquisition requests.' },
                    { method: 'GET', path: '/api/inventory/purchase-orders/{id}/pending-items', desc: 'Fetch items awaiting physical receiving.' },
                    { method: 'GET|POST', path: '/api/inventory/purchase-receives', desc: 'Process inbound stock and update branch balances.' },
                    { method: 'POST', path: '/api/stock/transfers', desc: 'Execute and audit inter-branch inventory movements.' },
                    { method: 'PUT', path: '/api/inventory/stocks/{id}/adjust', desc: 'Authorized stock count corrections with audit trails.' }
                ]}
            />

            {/* Workshop & Service Operations */}
            <ApiGroup 
                title="Workshop & Service Engine" 
                icon={IconTool}
                endpoints={[
                    { method: 'GET|PUT', path: '/api/services/job-cards', desc: 'Master management of vehicle service lifecycle.' },
                    { method: 'PUT', path: '/api/services/job-cards/{id}/items', desc: 'Update specific service task progress (%).' },
                    { method: 'POST', path: '/api/services/job-cards/material-usage', desc: 'Deduct parts/materials and manage Off-Cut serials.' },
                    { method: 'POST', path: '/api/services/job-cards/qc', desc: 'Submit mandatory quality control checklists.' },
                    { method: 'GET', path: '/api/services/tech-performance', desc: 'Metrics for technician efficiency and labor hours.' },
                    { method: 'GET', path: '/api/scan/serials/{serial}', desc: 'Lookup serial status, warranty, and history.' }
                ]}
            />

            {/* Sales & Fiscal Integrity */}
            <ApiGroup 
                title="Sales & Fiscal Operations" 
                icon={IconBusinessplan}
                endpoints={[
                    { method: 'POST', path: '/api/sales/orders', desc: 'Generate sales invoices (Requires active user shift).' },
                    { method: 'GET|POST', path: '/api/sales/dashboard/shift', desc: 'Retrieve or Open/Close daily branch sales shifts.' },
                    { method: 'GET|POST', path: '/api/sales/quotations', desc: 'Draft and convert price quotes into active orders.' },
                    { method: 'POST', path: '/api/sales/orders/{id}/deposits', desc: 'Record partial payments and down-payments.' },
                    { method: 'GET', path: '/api/finance/transactions', desc: 'Centralized ledger for all income and expense items.' }
                ]}
            />

            {/* HR & Workforce Management */}
            <ApiGroup 
                title="HR & Attendance Domain" 
                icon={IconUsers}
                endpoints={[
                    { method: 'GET|POST', path: '/api/hr/employees', desc: 'Full employee lifecycle (Onboarding to Offboarding).' },
                    { method: 'GET|POST', path: '/api/hr/leave-requests', desc: 'Apply for or Authorize employee time-off.' },
                    { method: 'POST', path: '/api/attendance/scan/clock', desc: 'Record GPS-verified attendance scan (130m threshold).' },
                    { method: 'GET', path: '/api/hr/announcements', desc: 'Broadcast organizational messages via PWA/Telegram.' }
                ]}
            />

            {/* CRM & Customer TMA */}
            <ApiGroup 
                title="CRM & Customer TMA" 
                icon={IconUserCheck}
                endpoints={[
                    { method: 'GET|POST', path: '/api/crm/customers', desc: 'Manage verified customer profiles and vehicle garage.' },
                    { method: 'POST', path: '/api/crm/leads', desc: 'Capture and track prospects in the Sales Pipeline.' },
                    { method: 'POST', path: '/api/crm/tma/booking', desc: 'Process service appointments via Telegram Mini App.' },
                    { method: 'GET', path: '/api/crm/tma/job-detail/{id}', desc: 'Payload for real-time customer service tracking.' }
                ]}
            />

            {/* Employee App (PWA) */}
            <ApiGroup 
                title="Employee PWA Endpoints" 
                icon={IconDeviceMobile}
                endpoints={[
                    { method: 'GET', path: '/api/employee-app/dashboard', desc: 'Core payload for PWA Home (Shift, Stats, Clock status).' },
                    { method: 'POST', path: '/api/employee-app/activities', desc: 'Post field activity with photos and location tagging.' },
                    { method: 'GET', path: '/api/employee-app/history', desc: 'Personal attendance and leave request logs.' },
                    { method: 'GET', path: '/api/employee-app/celebrations', desc: 'Colleague birthdays and wishes inbox data.' }
                ]}
            />

            {/* Infrastructure & Security */}
            <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <IconShieldLock size={16} /> Security & Infrastructure
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border bg-card space-y-2">
                        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase">
                            <IconServer size={14} /> Real-time Integration
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            System utilizes <strong>Laravel Reverb</strong> for instant UI updates. Private channels: <code>job-card.{"{id}"}</code>, <code>branch-stats.{"{id}"}</code>.
                        </p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card space-y-2">
                        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase">
                            <IconSchema size={14} /> Access Control
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Gated by <strong>auth:sanctum</strong> and <strong>Spatie</strong>. ULID keys are used for high-precision log sequencing and auditing.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InstructionCard 
                    title="API Standards"
                    steps={[
                        { label: "Utilize Eloquent API Resources for standardized JSON wrapping." },
                        { label: "Enforce 'branch.guard' for data isolation across multiple branches." },
                        { label: "Use ULID for primary keys in logs and business documents." }
                    ]}
                    tip="Standardizing responses ensures frontend stability across Web and Mobile PWA platforms."
                />
                <InstructionCard 
                    title="Health & Monitoring"
                    steps={[
                        { label: "Check '/api/health' for service status (Redis, Database, Reverb)." },
                        { label: "Audit '/api/settings/system-logs' for technical traceability." },
                        { label: "Monitor Reverb debug console for real-time socket health." }
                    ]}
                    tip="All critical errors are logged with stack traces and user context for rapid debugging."
                />
            </div>
        </div>
    );
};

interface ApiGroupProps {
    title: string;
    icon: any;
    endpoints: {
        method: string;
        path: string;
        desc: string;
    }[];
}

const ApiGroup = ({ title, icon: Icon, endpoints }: ApiGroupProps) => (
    <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
            <Icon size={18} className="text-primary" />
            <h4 className="text-sm font-bold tracking-tight">{title}</h4>
        </div>
        <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-[11px] text-left">
                <tbody className="divide-y divide-border">
                    {endpoints.map((ep, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-mono text-primary font-bold w-1/3 truncate">{ep.path}</td>
                            <td className="p-3 w-20">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                    ep.method.includes('POST') ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 
                                    ep.method.includes('PUT') ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 
                                    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                }`}>
                                    {ep.method}
                                </span>
                            </td>
                            <td className="p-3 text-muted-foreground font-medium">{ep.desc}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default DeveloperDoc;
