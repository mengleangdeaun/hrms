import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { 
    IconFileText, IconShieldCheck, IconUsers, IconCode, 
    IconBuildingStore, IconChevronRight, IconSearch, IconX, IconMenu2,
    IconExternalLink, IconBook, IconLayoutDashboard, IconMessageCircle,
    IconArrowUpRight, IconDeviceMobileMessage, IconBriefcase, IconDeviceMobile, IconKeyboard
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

// Persona Components
import StakeholderDoc from './components/StakeholderDoc';
import OwnerDoc from './components/OwnerDoc';
import UserDoc from './components/UserDoc';
import DeveloperDoc from './components/DeveloperDoc';
import CustomerDoc from './components/CustomerDoc';
import HrDoc from './components/HrDoc';
import PwaDoc from './components/PwaDoc';

const Documentation = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [activePersona, setActivePersona] = useState('users');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        dispatch(setPageTitle('Support Documentation'));
    }, [dispatch]);

    const personas = [
        { id: 'stakeholders', name: 'Stakeholders', icon: IconLayoutDashboard, desc: 'Strategy & ROI' },
        { id: 'owners', name: 'Owners', icon: IconBuildingStore, desc: 'Governance' },
        { id: 'hr', name: 'Human Resources', icon: IconBriefcase, desc: 'Talent & Compliance' },
        { id: 'users', name: 'System Users', icon: IconUsers, desc: 'Procedures' },
        { id: 'pwa', name: 'Employee PWA', icon: IconDeviceMobile, desc: 'Mobile Workflows' },
        { id: 'customers', name: 'Customers (TMA)', icon: IconDeviceMobileMessage, desc: 'Booking & Tracking' },
        { id: 'developers', name: 'Developers', icon: IconCode, desc: 'API & Architecture' },
    ];

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-background">
            
            {/* Minimalist Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full py-6 px-4 space-y-8">
                    
                    <div>
                        <h2 className="px-4 mb-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                            Documentation
                        </h2>
                        <div className="space-y-1">
                            {personas.map((persona) => {
                                const Icon = persona.icon;
                                const isActive = activePersona === persona.id;
                                return (
                                    <button
                                        key={persona.id}
                                        onClick={() => setActivePersona(persona.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                            isActive 
                                                ? 'bg-secondary text-secondary-foreground' 
                                                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                        }`}
                                    >
                                        <Icon size={18} />
                                        <span>{persona.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <h2 className="px-4 mb-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                            Quick Links
                        </h2>
                        <div className="space-y-1">
                            {[
                                { label: 'Attendance Dashboard', route: '/dashboard/attendance' },
                                { label: 'Sales Dashboard', route: '/dashboard/sales' },
                                { label: 'Inventory Dashboard', route: '/dashboard/inventory' },
                                { label: 'Finance Dashboard', route: '/dashboard/finance' },
                                { label: 'Job Performance', route: '/dashboard/tech-performance' },
                            ].map((link) => (
                                <button
                                    key={link.label}
                                    onClick={() => navigate(link.route)}
                                    className="w-full flex items-center justify-between px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground group"
                                >
                                    {link.label}
                                    <IconArrowUpRight size={12} className="opacity-0 group-hover:opacity-100" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center gap-2 mb-2 text-primary">
                            <IconMessageCircle size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Support</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">
                            Need immediate technical assistance or found a bug?
                        </p>
                        <a 
                            href="https://t.me/mengleang_deaun" 
                            target="_blank" 
                            className="text-[10px] font-bold text-foreground hover:underline flex items-center gap-1"
                        >
                            Open Telegram Support <IconExternalLink size={10} />
                        </a>
                    </div>

                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                
                {/* Header */}
                <header className="flex items-center justify-between px-8 py-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-1.5 lg:hidden rounded-md border hover:bg-muted"
                        >
                            {isSidebarOpen ? <IconX size={16} /> : <IconMenu2 size={16} />}
                        </button>
                        <div className="flex items-center gap-2">
                            <IconBook size={18} className="text-muted-foreground" />
                            <h1 className="text-sm font-semibold">
                                {personas.find(p => p.id === activePersona)?.name} Instruction
                            </h1>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Actions removed to keep interface clean and functional */}
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth custom-scrollbar">
                    <div className="max-w-6xl mx-auto">
                        {activePersona === 'stakeholders' && <StakeholderDoc />}
                        {activePersona === 'owners' && <OwnerDoc />}
                        {activePersona === 'hr' && <HrDoc />}
                        {activePersona === 'users' && <UserDoc />}
                        {activePersona === 'pwa' && <PwaDoc />}
                        {activePersona === 'customers' && <CustomerDoc />}
                        {activePersona === 'developers' && <DeveloperDoc />}
                        
                        <div className="mt-24 pt-8 border-t border-border flex justify-between items-center text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                            <span>SCCG ERP SYSTEM</span>
                            <div className="flex gap-4">
                                <a href="#" className="hover:text-foreground">Documentation V1.0.0 (Human and AI generated)</a>
                                <div className='h-5 w-0.5 bg-gray-400' />
                                <a href="#" className="hover:text-foreground">30th APRIL 2026</a>
                            </div>
                        </div>
                    </div>
                </main>

            </div>
        </div>
    );
};

export default Documentation;