import React from 'react';

interface Step {
    title: string;
    desc: string;
}

const WorkflowTimeline: React.FC<{ steps: Step[] }> = ({ steps }) => (
    <div className="space-y-4">
        {steps.map((step, i) => (
            <div key={i} className="group flex items-start gap-5 p-5 rounded-2xl border border-border hover:border-primary/20 hover:bg-card transition-all">
                <div className="text-3xl font-black text-muted-foreground/10 group-hover:text-primary/20 transition-colors w-12 text-center">
                    {(i + 1).toString().padStart(2, '0')}
                </div>
                <div className="flex-1">
                    <h4 className="font-bold mb-1 group-hover:text-primary transition-colors text-sm md:text-base">{step.title}</h4>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
            </div>
        ))}
    </div>
);

export default WorkflowTimeline;
