import React from 'react';
import { Field } from './Field';
import { resolveVariables } from '../../VariableResolver';
import { cn } from '@/lib/utils';

export const DocumentTitle = React.memo(({ s, data, onEdit }: { s: any, data?: any, onEdit: any }) => {
    if (!s.doc_info?.show_title) return null;
    
    let titleContent = s.doc_info?.title_content || '<h1 style="color: hsl(356, 100%, 39%); font-size: 28px; font-weight: 900; text-transform: uppercase;">Quotation</h1>';
    
    // Resolve variables in title if data is present
    if (data && typeof titleContent === 'string') {
        titleContent = resolveVariables(titleContent, data);
    }
    
    return (
        <div className={cn(
            "flex w-full py-0",
            s.doc_info?.title_align === 'left' ? "justify-start" : (s.doc_info?.title_align === 'right' ? "justify-end" : "justify-center")
        )}>
            <Field 
                id="doc_info.title_content" // ID matches the style property
                label="Document Title" 
                value={titleContent} 
                styles={s} 
                data={data}
                onEdit={onEdit} 
                className={cn(
                    "inline-block",
                    s.doc_info?.title_align === 'left' ? "text-left" : (s.doc_info?.title_align === 'right' ? "text-right" : "text-center")
                )}
                as="div"
            >
                <div 
                    className="inline-block" 
                    dangerouslySetInnerHTML={{ __html: titleContent }} 
                />
            </Field>
        </div>
    );
});
