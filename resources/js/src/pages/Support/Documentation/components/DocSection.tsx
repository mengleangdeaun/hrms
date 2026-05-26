import React from 'react';

interface DocSectionProps {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    subtitle?: string;
}

const DocSection: React.FC<DocSectionProps> = ({ title, icon: Icon, children, subtitle }) => (
    <div className="space-y-4">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-secondary text-secondary-foreground">
                <Icon size={20} strokeWidth={2} />
            </div>
            <div>
                <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed border-l-2 border-border pl-6 py-1">
            {children}
        </div>
    </div>
);

export default DocSection;
