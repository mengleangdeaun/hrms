import React from 'react';
import { IconUsers, IconCalendarEvent,  IconFileCertificate, IconSpeakerphone, IconTrendingUp, IconAlertTriangle, IconDoorExit } from '@tabler/icons-react';
import DocSection from './DocSection';
import InstructionCard from './InstructionCard';
import FeatureGrid from './FeatureGrid';

const HrDoc = () => {
    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <DocSection 
                title="Human Resources Management" 
                icon={IconUsers}
                subtitle="Guidelines for talent lifecycle, attendance governance, and organizational communication."
            >
                The HR module is the foundation of organizational accountability. It manages the entire employee lifecycle—from onboarding and attendance auditing to promotions and offboarding.
            </DocSection>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InstructionCard 
                    title="How to Onboard a New Employee"
                    steps={[
                        { label: "Navigate to Employee Management.", route: "/hr/employees", action: "Employees" },
                        { label: "Fill in personal, contract, and branch details." },
                        { label: "Upload mandatory documents (ID, Contract, Photos)." },
                        { label: "Assign a Working Shift and Leave Policy." }
                    ]}
                    tip="The system automatically generates a unique Employee ID and QR profile upon save."
                />

                <InstructionCard 
                    title="How to Audit Attendance & Overtime"
                    steps={[
                        { label: "Open the Attendance Audit dashboard.", route: "/attendance/audit", action: "Audit" },
                        { label: "Filter by Branch or Department." },
                        { label: "Review 'Late' or 'Early Departure' logs." },
                        { label: "Approve or Adjust 'Overtime' hours for payroll." }
                    ]}
                    tip="Attendance snapshots are frozen at the time of scan to prevent retroactive manipulation."
                />
            </div>

            <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <IconTrendingUp size={16} /> Personnel Lifecycle & Compliance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border bg-card space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                            <IconFileCertificate size={18} />
                            <span className="text-[10px] font-bold uppercase">Promotions & Salary</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Track historical growth. Every salary increment or designation change is logged as a <strong>Salary Movement</strong> for payroll auditability.
                        </p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card space-y-2">
                        <div className="flex items-center gap-2 text-amber-500">
                            <IconAlertTriangle size={18} />
                            <span className="text-[10px] font-bold uppercase">Disciplinary Actions</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Issue <strong>Warnings</strong> for policy violations. These records are permanently attached to the employee's digital profile.
                        </p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card space-y-2">
                        <div className="flex items-center gap-2 text-red-500">
                            <IconDoorExit size={18} />
                            <span className="text-[10px] font-bold uppercase">Offboarding</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Formalize <strong>Resignations</strong> or <strong>Terminations</strong>. The system automatically revokes PWA access and freezes final balances.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <IconSpeakerphone size={16} /> Internal Communications
                </h3>
                <div className="rounded-lg border bg-card p-4 space-y-3">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                        Use the <strong>Announcements</strong> module to broadcast messages. You can target specific branches, departments, or individual roles via the PWA and Telegram.
                    </p>
                    <FeatureGrid items={[
                        { title: "Leave Governance", desc: "Manage leave balances and accrual rules per policy. System prevents over-booking of time-off." },
                        { title: "Holiday Calendar", desc: "Define company holidays and branch-specific working days to automate attendance expectations." },
                        { title: "Document Vault", desc: "Securely store and track expiration dates for employee work permits and contracts." },
                        { title: "Audit Trail", desc: "100% traceability for all HR actions with ULID precision for security compliance." }
                    ]} />
                </div>
            </div>
        </div>
    );
};

export default HrDoc;
