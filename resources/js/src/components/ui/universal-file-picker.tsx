import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconLibrary, IconUpload, IconX, IconCheck, IconEye, IconAlertCircle } from '@tabler/icons-react';
import MediaSelector, { MediaFile } from '@/components/MediaSelector';
import { FileUpload } from '@/components/ui/file-upload';
import { cn } from '@/lib/utils';
import { ImagePreviewModal } from '@/components/ui/image-preview-modal';
import { PDFPreviewModal } from '@/components/ui/pdf-preview-modal';
import { FileIcon } from '@/components/illustrations/FileExtension';
import { isImage, isPDF, isImageExt, isPDFExt } from '@/lib/file-utils';

import { useTranslation } from 'react-i18next';

interface UniversalFilePickerProps {
    value?: string | File | null;
    onChange: (value: string | File | null, original_name?: string) => void;
    label?: string;
    description?: string;
    accept?: string;
    maxSize?: number;
    compress?: boolean;
    className?: string;
}

export const UniversalFilePicker: React.FC<UniversalFilePickerProps> = ({
    value,
    onChange,
    label,
    description,
    accept,
    maxSize,
    compress = true,
    className,
}) => {
    const { t } = useTranslation();
    const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const isString = typeof value === 'string';
    const isFile = value instanceof File;
    
    // Determine file type for preview
    const getExt = () => {
        if (!value) return '';
        if (isFile) return value.name.split('.').pop()?.toLowerCase() || '';
        if (isString) {
            const baseUrl = value.split(/[?#]/)[0];
            const basicExt = baseUrl.split('.').pop()?.toLowerCase() || '';
            
            // If it's a valid small extension (not something like '/api/media/inline'), return it
            if (basicExt && basicExt.length <= 4 && !basicExt.includes('/')) return basicExt;
            
            // Check for 'path' parameter (proxied files)
            try {
                const urlObj = new URL(value, window.location.origin);
                const pathParam = urlObj.searchParams.get('path');
                if (pathParam) {
                    return pathParam.split('.').pop()?.toLowerCase() || '';
                }
            } catch (e) {}
            
            return basicExt;
        }
        return '';
    };

    const getFileType = () => {
        if (!value) return null;

        if (isFile) {
            if (isImage(value)) return 'image';
            if (isPDF(value)) return 'pdf';
        } else if (isString) {
            const ext = getExt();
            if (isImageExt(ext)) return 'image';
            if (isPDFExt(ext)) return 'pdf';
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
    };

    const handleUpload = (file: File | null) => {
        onChange(file);
        if (file) {
            setUploadError(null);
        }
    };

    const handleClear = () => {
        onChange(null);
    };


    return (
        <div className={cn("space-y-3", className)}>
            {!value ? (
                <div 
                    className="relative group border-2 border-dashed border-muted-foreground/20 rounded-2xl p-4 sm:p-6 transition-all hover:border-primary/40 hover:bg-primary/[0.02] flex flex-col items-center justify-center gap-4 text-center overflow-hidden"
                >
                    {/* Background Decorative Element */}
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
                    <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />

                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary transition-all group-hover:scale-110 group-hover:rotate-3 duration-300 shadow-sm border border-primary/10">
                        <IconUpload size={24} />
                    </div>
                    
                    <div className="space-y-1.5 z-10">
                        <p className="text-sm font-bold tracking-tight text-gray-900 dark:text-gray-100">
                            {label || t('click_to_upload_or_drag')}
                        </p>
                        <p className="text-[11px] text-muted-foreground max-w-[240px] leading-relaxed">
                            {description || 'Accepts PDF, SVG, and Images (Max 30MB)'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-sm mt-2 z-10 transition-all">
                        <div className="relative w-full h-10 group/btn overflow-hidden rounded-xl border border-primary/20 hover:border-primary/50 transition-all shadow-sm">
                            <FileUpload
                                value={null}
                                onChange={handleUpload}
                                onError={setUploadError}
                                label=""
                                description=""
                                accept={accept}
                                maxSize={maxSize}
                                compress={compress}
                                className="h-full w-full opacity-0 absolute inset-0 z-20 cursor-pointer"
                            />
                            <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-background group-hover/btn:bg-primary/[0.03] pointer-events-none transition-colors">
                                <IconUpload size={16} className="text-primary" />
                                <span className="text-xs font-bold">{t('upload_file')}</span>
                            </div>
                        </div>
                        
                        <Button
                            type="button"
                            variant="secondary"
                            className="w-full shadow-sm hover:shadow-md transition-all border border-transparent hover:border-primary/20 h-10 font-bold text-xs rounded-xl"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsMediaSelectorOpen(true);
                            }}
                        >
                            <IconLibrary size={16} className="mr-2 text-primary" /> {t('browse_library')}
                        </Button>
                    </div>

                    {/* Show Bubbled-Up Upload Errors (e.g. invalid file type or size) */}
                    {uploadError && (
                        <div className="mt-2 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl py-2 px-4 flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-300 z-10">
                            <IconAlertCircle size={14} className="shrink-0" />
                            {uploadError}
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative group rounded-2xl border border-primary/20 bg-white dark:bg-gray-950 p-3.5 flex items-center gap-4 transition-all hover:border-primary/40 hover:shadow-md shadow-sm">
                    <div 
                        className={cn(
                            "w-14 h-14 rounded-xl bg-muted/30 border flex items-center justify-center overflow-hidden shrink-0 relative shadow-inner ring-offset-background transition-all group-hover:ring-2 ring-primary/20",
                            fileType && "cursor-pointer group/thumb"
                        )}
                        onClick={() => fileType && setPreviewOpen(true)}
                    >
                        {fileType === 'image' ? (
                            <img src={previewUrl} alt="Selected" className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-110" />
                        ) : (
                            <div className="flex items-center justify-center h-full w-full bg-slate-50 dark:bg-slate-900 border-none">
                                <FileIcon ext={getExt()} size={32} />
                            </div>
                        )}
                        
                        {fileType && (
                            <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-all duration-300">
                                <div className="bg-white/90 dark:bg-black/80 rounded-full p-2 shadow-lg transform translate-y-2 group-hover/thumb:translate-y-0 transition-all duration-300">
                                    <IconEye size={18} className="text-primary" />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate leading-tight text-gray-900 dark:text-gray-100 mb-0.5">
                            {isString ? (value.split(/[?#]/)[0].split('/').pop() || 'Selected File') : value.name}
                        </p>
                        <div className="flex items-center gap-2">
                             <span className="text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <IconCheck size={10} /> {t('selected_label') || 'Selected'}
                             </span>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleClear}
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                    >
                        <IconX size={18} />
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
                    title={isString ? (value ? value.split(/[?#]/)[0].split('/').pop() : '') : (value ? value.name : '')}
                />
            )}

            {fileType === 'pdf' && (
                <PDFPreviewModal
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    url={previewUrl}
                    title={isString ? (value ? value.split(/[?#]/)[0].split('/').pop() : '') : (value ? value.name : '')}
                />
            )}
        </div>
    );
};
