import React, { useRef } from 'react';
import { CustomQuillEditor } from '@/components/ui/custom-quill-editor';
import VariablePicker from './VariablePicker';
import { Label } from '@/components/ui/label';

interface RichTextEditorProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    typeSlug: string;
    placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
    label, 
    value, 
    onChange, 
    typeSlug, 
    placeholder 
}) => {
    const quillRef = useRef<any>(null);

    const handleVariableSelect = (variable: string) => {
        if (quillRef.current) {
            const quill = quillRef.current.getEditor();
            const range = quill.getSelection();
            if (range) {
                quill.insertText(range.index, variable);
            } else {
                quill.insertText(quill.getLength() - 1, variable);
            }
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                {label && <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</Label>}
                <VariablePicker 
                    typeSlug={typeSlug} 
                    onSelect={handleVariableSelect} 
                    className="w-full"
                />
            </div>
            <CustomQuillEditor
                ref={quillRef}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                variant="minimal-border"
                minHeight={150}
                className="bg-white dark:bg-slate-900"
                wrapperClassName="border-none"
            />
        </div>
    );
};

export default RichTextEditor;
