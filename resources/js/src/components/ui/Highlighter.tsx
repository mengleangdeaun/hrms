import React from 'react';

interface HighlighterProps {
    text: string;
    className?: string;
    mentionClassName?: string;
}

const Highlighter: React.FC<HighlighterProps> = ({ 
    text, 
    className = "", 
    mentionClassName = "text-primary font-black bg-primary/5 px-1.5 py-0.5 rounded cursor-default" 
}) => {
    if (!text) return null;

    // Split text by mention pattern @[Name]
    const parts = text.split(/(@\[[^\]]+\])/g);

    return (
        <span className={className}>
            {parts.map((part, index) => {
                if (part.startsWith('@[') && part.endsWith(']')) {
                    // Extract name inside @[...]
                    const name = part.substring(2, part.length - 1);
                    return (
                        <span key={index} className={mentionClassName}>
                            @{name}
                        </span>
                    );
                }
                return part;
            })}
        </span>
    );
};

export default Highlighter;
