import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconTrash, IconPlus, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { UniversalFilePicker } from '@/components/ui/universal-file-picker';
import { FileIcon } from '@/components/illustrations/FileExtension';


export const DocumentsForm: React.FC<any> = ({ fields, append, remove, dropdowns }) => {
    const { t } = useTranslation();
    const { formState: { errors }, watch } = useFormContext();
    const [selectedDocTypeId, setSelectedDocTypeId] = useState<string>('');

    const documents = watch('documents') || [];

    const handleAddDocument = () => {
        if (!selectedDocTypeId) return;
        
        const docType = (dropdowns?.documentTypes || []).find((dt: any) => String(dt.id) === selectedDocTypeId);
        if (!docType) return;

        append({
            document_type_id: Number(selectedDocTypeId),
            document_type: docType,
            media_url: '',
            media_name: '',
            is_pending: true
        });
        setSelectedDocTypeId('');
    };

    const requiredDocTypes = (dropdowns?.documentTypes || []).filter((dt: any) => dt.is_required === true || dt.is_required === 1 || dt.is_required === "1");
    const missingRequiredDocTypes = requiredDocTypes.filter((rdt: any) => 
        !(documents || []).some((d: any) => String(d.document_type_id) === String(rdt.id))
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Instruction */}
            <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl flex items-start gap-4">
                <div className="shrink-0 mt-1 opacity-80 mix-blend-multiply dark:mix-blend-screen bg-background rounded-lg p-2 shadow-sm border border-primary/20">
                     <FileIcon type="doc" size={36} />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-semibold">{t('document_upload_instruction_title') || 'Employee Documents'}</p>
                    <p className="text-xs text-muted-foreground">
                        {t('document_upload_instruction_desc') || 'Please upload the mandatory documents listed below. You can also add more optional documents using the selector.'}
                    </p>
                </div>
            </div>

            {/* Document List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(fields || []).map((field: any, index: number) => {
                    const docType = field.document_type || dropdowns?.documentTypes?.find((dt: any) => String(dt.id) === String(field.document_type_id));
                    const error = (errors.documents as any)?.[index]?.media_url;
                    const isRequired = docType?.is_required === true || docType?.is_required === 1 || docType?.is_required === "1";

                    return (
                        <div key={field.id} className="bg-card rounded-xl border p-4 space-y-4 relative group">
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                    <h4 className="text-sm font-bold flex items-center gap-2">
                                        <div className="shrink-0 opacity-90 p-1 bg-muted/50 rounded-md border border-border/50 shadow-sm">
                                            <FileIcon type="pdf" size={20} />
                                        </div>
                                        {docType?.name || t('unknown_document')}
                                        {isRequired && <span className="text-destructive font-bold text-lg">*</span>}
                                    </h4>
                                </div>
                                {!isRequired && (
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => remove(index)}
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <IconTrash size={16} />
                                    </Button>
                                )}
                            </div>


                            <DocumentUploadField 
                                index={index} 
                                field={field} 
                                docType={docType}
                                error={error}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Dynamic Missing Slots (Double Layer Visibility) */}
            {missingRequiredDocTypes.length > 0 && (
                 <div className="p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-4 bg-muted/20 animate-pulse">
                    <IconAlertCircle className="text-destructive opacity-50" size={40} />
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-destructive">{t('mandatory_documents_loading') || 'Preparing mandatory document slots...'}</p>
                        <p className="text-xs text-muted-foreground">{t('mandatory_documents_loading_desc') || 'The required types will appear here automatically.'}</p>
                    </div>
                 </div>
            )}

            {/* Add Document (Only for Optional ones) */}
            <div className="bg-muted/30 p-4 rounded-xl border border-dashed flex flex-col md:flex-row items-end gap-4 mt-8">
                <div className="flex-1 space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold px-1">{t('add_additional_document') || 'Add Additional Document'}</Label>
                    <Select onValueChange={setSelectedDocTypeId} value={selectedDocTypeId}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder={t('select_document_type')} />
                        </SelectTrigger>
                        <SelectContent>
                            {(dropdowns?.documentTypes || [])
                                .filter((dt: any) => !(fields || []).some((f: any) => String(f.document_type_id) === String(dt.id)))
                                .map((dt: any) => (
                                    <SelectItem key={dt.id} value={String(dt.id)}>
                                        {dt.name} {(dt.is_required === true || dt.is_required === 1 || dt.is_required === "1") && <span className="text-destructive font-bold ml-1">*</span>}
                                    </SelectItem>
                                ))
                            }
                        </SelectContent>
                    </Select>
                </div>
                <Button 
                    type="button" 
                    onClick={handleAddDocument} 
                    disabled={!selectedDocTypeId}
                    className="shrink-0 h-10"
                >
                    <IconPlus size={18} className="mr-2" /> {t('add_doc')}
                </Button>
            </div>

            {(!fields || fields.length === 0) && missingRequiredDocTypes.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-xl space-y-4">
                    <div className="mx-auto w-24 h-24 opacity-60 grayscale hover:grayscale-0 transition-all">
                         <FileIcon type="pdf" size={96} />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{t('no_docs_added')}</p>
                </div>
            )}

        </div>
    );
};

// Internal sub-component to handle specific field in array
const DocumentUploadField = ({ index, error }: any) => {
    const { setValue, watch } = useFormContext();
    const value = watch(`documents.${index}.media_url`);

    return (
        <div className="space-y-2">
            <UniversalFilePicker
                value={value}
                onChange={(val, name) => {
                    setValue(`documents.${index}.media_url`, val, { shouldDirty: true, shouldValidate: true });
                    if (name) {
                        setValue(`documents.${index}.media_name`, name, { shouldDirty: true });
                    }
                }}
                accept="image/*,application/pdf"
                maxSize={30 * 1024 * 1024}
            />
            {error && <p className="text-xs text-destructive font-medium px-1 flex items-center gap-1">
                <IconAlertCircle size={12} />
                {error.message}
            </p>}
            {!error && value && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium px-1">
                    <IconCheck size={12} />
                    File uploaded/selected
                </div>
            )}
        </div>
    );
};
