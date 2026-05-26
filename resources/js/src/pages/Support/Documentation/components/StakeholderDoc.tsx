import React from 'react';
import { IconLayoutDashboard, IconShieldCheck, IconChartBar, IconGlobe, IconTarget, IconActivity } from '@tabler/icons-react';
import DocSection from './DocSection';
import InstructionCard from './InstructionCard';
import FeatureGrid from './FeatureGrid';

const StakeholderDoc = () => {
    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <DocSection 
                title="Strategic Oversight" 
                icon={IconLayoutDashboard}
                subtitle="The executive portal for ROI tracking and enterprise health."
            >
                This guide outlines the strategic controls and reporting tools available to stakeholders for monitoring organizational performance and revenue protection.
            </DocSection>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InstructionCard 
                    title="How to Monitor Enterprise Revenue"
                    steps={[
                        { label: "Open the Executive Dashboard.", route: "/dashboard", action: "Dashboard" },
                        { label: "Filter by 'Branch' or 'Date Range'." },
                        { label: "Review the 'Total Collected' vs 'Balance Due'." },
                        { label: "Inspect the 'Top Performing Services' chart." }
                    ]}
                    tip="Use the 'Balance Due' metric to identify branches with potential credit collection risks."
                />

                <InstructionCard 
                    title="How to Track Operational Variance"
                    steps={[
                        { label: "Navigate to Attendance Analytics.", route: "/attendance/dashboard", action: "Attendance" },
                        { label: "Review the 'Heatmap' for peak operational hours." },
                        { label: "Inspect 'Leaderboards' for employee performance." },
                        { label: "Verify 'Absence Trends' across departments." }
                    ]}
                    tip="High overtime in specific branches may indicate a need for additional personnel."
                />
            </div>


            <FeatureGrid items={[
                { title: "Revenue Protection", desc: "Forced shift-locks ensure zero unrecorded transactions at the branch level." },
                { title: "Asset Intelligence", desc: "Automated tracking of customer vehicle lifespans to drive recurring service revenue." },
                { title: "Global Accessibility", desc: "Real-time oversight of all branches from any device via the secure Admin Portal." },
                { title: "Compliance Logs", desc: "Immutable audit trails for every financial and personnel action in the system." }
            ]} />
        </div>
    );
};

export default StakeholderDoc;
