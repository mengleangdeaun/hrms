import React from 'react';
import { IconDeviceMobile, IconQrcode, IconCalendarEvent, IconHistory, IconMoodSmile, IconBell, IconSettings, IconPhotoPlus, IconMapPin, IconHeart } from '@tabler/icons-react';
import DocSection from './DocSection';
import InstructionCard from './InstructionCard';
import FeatureGrid from './FeatureGrid';

const PwaDoc = () => {
    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            <DocSection 
                title="Employee PWA (Field & Mobile)" 
                icon={IconDeviceMobile}
                subtitle="The complete guide to the high-fidelity mobile application for staff."
            >
                The Employee PWA is a premium, glassmorphism-inspired mobile interface designed for real-time attendance, leave management, and organizational engagement.
            </DocSection>

            {/* Attendance & Smart Clock */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <IconQrcode className="text-primary" size={20} />
                    <h3 className="text-lg font-bold tracking-tight">Smart Clock & Attendance</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <InstructionCard 
                        title="Daily Clock-In Workflow"
                        steps={[
                            { label: "Open the PWA Dashboard." },
                            { label: "Tap the 'Scan QR' button on the Smart Clock card." },
                            { label: "Ensure your GPS is enabled and within 130m." },
                            { label: "Verify 'Success' status and review your shift hours." }
                        ]}
                        tip="If outside the geofence, the system will prevent the scan to maintain data integrity."
                    />
                    <InstructionCard 
                        title="Device Binding & Security"
                        steps={[
                            { label: "Login for the first time on your primary device." },
                            { label: "Go to Settings > Device Management." },
                            { label: "Tap 'Bind Current Device' to lock your account." },
                            { label: "Contact HR to reset binding if you change phones." }
                        ]}
                        tip="Device binding prevents multiple employees from scanning using a single mobile device."
                    />
                </div>
            </div>

            {/* Leave & History */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <IconCalendarEvent className="text-blue-500" size={20} />
                    <h3 className="text-lg font-bold tracking-tight">Leave & History Management</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <InstructionCard 
                        title="Applying for Leave"
                        steps={[
                            { label: "Go to the 'Leave' tab.", route: "/employee/leave", action: "Leave" },
                            { label: "Check your 'Annual' or 'Sick' balances." },
                            { label: "Tap '+' to create a request (Date, Type, Reason)." },
                            { label: "Wait for real-time notification of approval/rejection." }
                        ]}
                        tip="Managers can approve or reject leave directly within their own PWA interface."
                    />
                    <InstructionCard 
                        title="Attendance History Audit"
                        steps={[
                            { label: "Navigate to the 'History' tab.", route: "/employee/history", action: "History" },
                            { label: "Review daily On-Time/Late/Absent status." },
                            { label: "Check 'Total Work Hours' for the current month." },
                            { label: "View past Leave Request outcomes and comments." }
                        ]}
                        tip="Filter by date range to track your attendance performance over time."
                    />
                </div>
            </div>

            {/* Engagement & Feedback */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <IconMoodSmile className="text-emerald-500" size={20} />
                    <h3 className="text-lg font-bold tracking-tight">Social Engagement & Activity</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <InstructionCard 
                        title="Posting Work Activity"
                        steps={[
                            { label: "Go to 'Activity' and tap 'Post Activity'.", route: "/employee/activity", action: "Activity" },
                            { label: "Select Activity Type (Field Work, Meeting, etc.)." },
                            { label: "Attach photos and tag your current Location." },
                            { label: "Submit to sync with the Admin Dashboard." }
                        ]}
                        tip="Activities document your progress and are visible to branch managers in real-time."
                    />
                    <InstructionCard 
                        title="Celebrations & Wishes"
                        steps={[
                            { label: "Check the 'Notifications' header for colleague birthdays." },
                            { label: "Open the 'Wishes Inbox' to send a digital card." },
                            { label: "View incoming wishes on your own anniversary." },
                            { label: "React to celebrations with emojis." }
                        ]}
                        tip="Celebrations foster a positive workplace culture and organizational bonding."
                    />
                </div>
            </div>

            {/* Settings & App Health */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <IconSettings size={16} /> App Customization & Health
                </h3>
                <div className="rounded-lg border bg-card p-4 space-y-3">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                        The PWA supports deep customization to match your personal workflow and visual preferences.
                    </p>
                    <FeatureGrid items={[
                        { title: "Multi-Language", desc: "Native support for English, Khmer, and Chinese (Traditional/Simplified)." },
                        { title: "Visual Engine", desc: "Switch between Light/Dark modes and customize accent colors via Settings." },
                        { title: "Glassmorphism", desc: "Toggle blurred UI effects for improved performance on older mobile devices." },
                        { title: "Push Notifications", desc: "Real-time Reverb broadcasts for announcements, shift changes, and approvals." }
                    ]} />
                </div>
            </div>
        </div>
    );
};

export default PwaDoc;
