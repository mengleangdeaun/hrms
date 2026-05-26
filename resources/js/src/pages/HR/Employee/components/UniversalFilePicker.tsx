import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconLibrary, IconUpload, IconX, IconCheck, IconEye, IconFile, IconAlertCircle } from '@tabler/icons-react';
import MediaSelector, { MediaFile } from '@/components/MediaSelector';
import { FileUpload } from '@/components/ui/file-upload';
import { cn } from '@/lib/utils';
import { ImagePreviewModal } from '@/components/ui/image-preview-modal';
import { PDFPreviewModal } from '@/components/ui/pdf-preview-modal';

import { useTranslation } from 'react-i18next';

interface UniversalFilePickerProps {
    value?: string | File | null;
    onChange: (value: string | File | null, original_name?: string) => void;
    label?: string;
    description?: string;
    accept?: string;
}

export const UniversalFilePicker: React.FC<UniversalFilePickerProps> = ({
    value,
    onChange,
    label,
    description,
    accept,
}) => {
    const { t } = useTranslation();
    const [mode, setMode] = useState<'upload' | 'library' | null>(null);
    const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const isString = typeof value === 'string';
    const isFile = value instanceof File;
    
    // Determine file type for preview
    const getFileType = () => {
        if (isString) {
            const ext = value.split('.').pop()?.toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
            if (ext === 'pdf') return 'pdf';
        } else if (isFile) {
            if (value.type.startsWith('image/')) return 'image';
            if (value.type === 'application/pdf') return 'pdf';
        }
        return null;
    };

    const fileType = getFileType();
    const [previewUrl, setPreviewUrl] = useState<string>('');

    React.useEffect(() => {
        let url = '';
        if (isFile) {
            url = URL.createObjectURL(value);
            setPreviewUrl(url);
        } else if (isString) {
            setPreviewUrl(value);
        } else {
            setPreviewUrl('');
        }

        return () => {
            if (url) URL.revokeObjectURL(url);
        };
    }, [value, isFile, isString]);

    const handleSelectFromLibrary = (file: MediaFile) => {
        onChange(file.url, file.name);
        setMode('library');
    };

    const handleUpload = (file: File | null) => {
        onChange(file);
        if (file) {
            setMode('upload');
            setUploadError(null);
        } else {
            setMode(null);
        }
    };

    const handleClear = () => {
        onChange(null);
        setMode(null);
    };


    return (
        <div className="space-y-3">
            {!value ? (
                <div 
                    className="relative group border-2 border-dashed border-muted-foreground/20 rounded-2xl p-6 transition-all hover:border-primary/50 hover:bg-primary/[0.01] flex flex-col items-center justify-center gap-3 text-center"
                >
                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary transition-transform group-hover:scale-110 duration-300 mb-1">
                        <IconUpload size={20} />
                    </div>
                    
                    <div className="space-y-1">
                        <p className="text-sm font-semibold tracking-tight">
                            {label || t('click_to_upload_or_drag')}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            {description || 'Accepts PDF, SVG, and Images (Max 30MB)'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-3">
                        <div className="relative group/btn">
                            <FileUpload
                                value={null}
                                onChange={handleUpload}
                                onError={setUploadError}
                                label={t('direct_upload')}
                                description={t('click_to_browse')}
                                accept={accept}
                                className="h-full opacity-0 absolute inset-0 z-20 cursor-pointer" compress={false}                            />
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="w-full relative z-10 shadow-sm border-primary/20 hover:border-primary/50 transition-colors"
                            >
                                <IconUpload size={16} className="mr-2 text-primary" /> {t('upload_file')}
                            </Button>
                        </div>
                        
                        <Button
                            type="button"
                            variant="secondary"
                            className="shadow-sm hover:shadow-md transition-all border border-transparent hover:border-primary/20"
                            onClick={() => setIsMediaSelectorOpen(true)}
                        >
                            <IconLibrary size={16} className="mr-2 text-primary" /> {t('browse_library')}
                        </Button>
                    </div>

                    {/* Show Bubbled-Up Upload Errors (e.g. invalid file type or size) */}
                    {uploadError && (
                        <div className="mt-2 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md py-1.5 px-3 flex items-center gap-1.5 animate-in slide-in-from-top-1 fade-in duration-200">
                            <IconAlertCircle size={14} className="shrink-0" />
                            {uploadError}
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative group rounded-xl border border-primary/20 bg-primary/[0.01] p-3 flex items-center gap-4 transition-all hover:bg-primary/[0.03] hover:shadow-sm">
                    <div 
                        className={cn(
                            "w-12 h-12 rounded-lg bg-background border flex items-center justify-center overflow-hidden shrink-0 relative shadow-sm",
                            fileType && "cursor-pointer hover:ring-2 ring-primary/50 transition-all group/thumb"
                        )}
                        onClick={() => fileType && setPreviewOpen(true)}
                    >
                        {isString ? (
                            <img src={value} alt="Selected" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-[9px] font-bold text-muted-foreground uppercase flex flex-col items-center">
                                {fileType === 'pdf' ? (
                                    <IconFile size={20} className="text-rose-500" />
                                ) : (
                                    <span className="bg-muted px-1 rounded">{value.name.split('.').pop()}</span>
                                )}
                            </div>
                        )}
                        
                        {fileType && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                <IconEye size={16} className="text-white" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate leading-tight">
                            {isString ? value.split('/').pop() : value.name}
                        </p>

                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleClear}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 transition-colors"
                    >
                        <IconX size={16} />
                    </Button>
                </div>
            )}

            <MediaSelector
                open={isMediaSelectorOpen}
                onOpenChange={setIsMediaSelectorOpen}
                onSelect={handleSelectFromLibrary}
                acceptedType="all"
            />

            {fileType === 'image' && (
                <ImagePreviewModal
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    src={previewUrl}
                    title={isString ? (value ? value.split('/').pop() : '') : (value ? value.name : '')}
                />
            )}

            {fileType === 'pdf' && (
                <PDFPreviewModal
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    url={previewUrl}
                    title={isString ? (value ? value.split('/').pop() : '') : (value ? value.name : '')}
                />
            )}
        </div>
    );
};
