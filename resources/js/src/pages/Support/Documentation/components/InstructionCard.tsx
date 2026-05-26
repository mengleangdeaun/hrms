import React from 'react';
import { IconCircleCheck, IconExternalLink } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface Step {
    label: string;
    action?: string;
    route?: string;
}

interface InstructionCardProps {
    title: string;
    steps: Step[];
    tip?: string;
}

const InstructionCard: React.FC<InstructionCardProps> = ({ title, steps, tip }) => {
    const navigate = useNavigate();

    return (
        <div className="rounded-lg border bg-muted/40 p-4 space-y-3 group transition-all duration-300 hover:bg-muted/60 hover:shadow-sm">
            <h4 className="text-sm font-bold flex items-center gap-2">
                <IconCircleCheck size={16} className="text-primary" /> {title}
            </h4>
            <div className="space-y-1">
                {steps.map((step, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 rounded-md transition-all duration-200 hover:bg-background/60">
                        <div className="flex items-center gap-3">
                            <span className="text-muted-foreground font-mono opacity-60">{i + 1}.</span>
                            <span className="font-medium">{step.label}</span>
                        </div>
                        {step.route && (
                            <button 
                                onClick={() => navigate(step.route!)}
                                className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-primary font-bold hover:underline transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 whitespace-nowrap"
                            >
                                {step.action || 'Go'} <IconExternalLink size={12} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {tip && (
                <div className="pt-2 border-t border-border mt-2">
                    <p className="text-[10px] text-muted-foreground italic">
                        <span className="font-bold text-foreground not-italic uppercase tracking-tighter mr-1">Pro Tip:</span>
                        {tip}
                    </p>
                </div>
            )}
        </div>
    );
};

export default InstructionCard;
