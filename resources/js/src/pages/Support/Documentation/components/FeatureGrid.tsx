import React from 'react';

interface FeatureItem {
    title: string;
    desc: string;
    color?: string; // Optional, Shadcn uses fewer colors
}

const FeatureGrid: React.FC<{ items: FeatureItem[] }> = ({ items }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((item, i) => (
                <div key={i} className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-accent/50 transition-colors">
                    <h4 className="font-semibold text-sm mb-1 tracking-tight">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-normal">{item.desc}</p>
                </div>
            ))}
        </div>
    );
};

export default FeatureGrid;
