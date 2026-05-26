import React from 'react';
import { IconDeviceMobileMessage, IconCalendarStats, IconCar, IconStar, IconMessageCircle, IconInfoCircle, IconTimelineEvent } from '@tabler/icons-react';
import DocSection from './DocSection';
import InstructionCard from './InstructionCard';
import FeatureGrid from './FeatureGrid';

const CustomerDoc = () => {
    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <DocSection 
                title="Customer Portal (TMA)" 
                icon={IconDeviceMobileMessage}
                subtitle="Guidelines for customers using the Telegram Mini App (TMA)."
            >
                The Customer Portal is a high-fidelity interface integrated directly into Telegram. It allows customers to book services, track their vehicle's progress in real-time, and manage their garage with ease.
            </DocSection>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InstructionCard 
                    title="How to Onboard & Link Contact"
                    steps={[
                        { label: "Open the S-COOL Bot on Telegram." },
                        { label: "Click 'Start' and select 'Open Portal'." },
                        { label: "Click the 'Share Contact' button when prompted." },
                        { label: "The system will verify your phone number with the CRM." }
                    ]}
                    tip="You must use the same phone number registered with the branch to see your history."
                />

                <InstructionCard 
                    title="How to Book a Service"
                    steps={[
                        { label: "Go to the 'Booking' tab in the TMA." },
                        { label: "Select your Branch and Service Type." },
                        { label: "Choose a vehicle from your 'Garage' or add a new one." },
                        { label: "Select your preferred Date and Time." }
                    ]}
                    tip="Bookings are 'Pending' until a manager confirms the appointment via Telegram."
                />
            </div>

            <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <IconTimelineEvent size={16} /> Real-time Tracking & Feedback
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border bg-card space-y-3">
                        <div className="flex items-center gap-2 text-primary">
                            <IconCar size={18} />
                            <span className="text-xs font-bold uppercase">Live Job Tracking</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Customers can view the <strong>Live Status</strong> of their Job Card. This includes:
                        </p>
                        <ul className="text-[11px] space-y-1 list-disc pl-5 text-muted-foreground">
                            <li>Technician Lead assigned to the vehicle.</li>
                            <li>Progress percentage of individual service items.</li>
                            <li>Real-time material consumption (parts used).</li>
                        </ul>
                    </div>
                    <div className="p-4 rounded-lg border bg-card space-y-3">
                        <div className="flex items-center gap-2 text-amber-500">
                            <IconStar size={18} />
                            <span className="text-xs font-bold uppercase">Service Rating</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Once a Job Card is marked 'Delivered', the customer receives a prompt to rate the experience:
                        </p>
                        <ul className="text-[11px] space-y-1 list-disc pl-5 text-muted-foreground">
                            <li><strong>Service Rating:</strong> Overall experience and speed.</li>
                            <li><strong>Technical Rating:</strong> Quality of repair and parts.</li>
                            <li><strong>Comments:</strong> Detailed feedback for management.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <FeatureGrid items={[
                { title: "Garage Management", desc: "Add multiple vehicles (Plate, VIN, Brand/Model) to your profile for faster booking." },
                { title: "Digital History", desc: "Access all past service records, invoices, and material usage history anytime." },
                { title: "Broadcast Alerts", desc: "Receive automated notifications on Telegram for status updates and promotions." },
                { title: "Care Center", desc: "Instant access to FAQs and direct chat with branch support topics." }
            ]} />
        </div>
    );
};

export default CustomerDoc;
