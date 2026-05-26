import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IconPhoto,
    IconFile,
    IconTrash,
    IconReplace,
    IconSearch,
    IconAlertCircle,
    IconCheck,
    IconLoader2,
    IconCloudUpload
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    formatBytes,
    isImage,
    isPDF,
    isSVG,
    validateFile,
    compressImage,
    isCorrupted
} from '@/lib/file-utils';
import { FileIcon } from '@/components/illustrations/FileExtension';

interface FileUploadProps {
    value: File | null;
    onChange: (file: File | null) => void;
    progress?: number;
    onPreview?: () => void;
    accept?: string;
    maxSize?: number;
    label?: string;
    compress?: boolean;
    description?: string;
    className?: string;
    disabled?: boolean;
    onError?: (error: string | null) => void;
    initialUrl?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
    value,
    onChange,
    progress = 0,
    onPreview,
    accept = 'image/*,application/pdf,image/svg+xml',
    maxSize = 30 * 1024 * 1024,
    label = 'Upload File',
    description = 'Drag and drop or click to select',
    compress = true,
    className,
    disabled = false,
    onError,
    initialUrl
}) => {
    const [internalError, setInternalError] = useState<string | null>(null);
    const [isCleared, setIsCleared] = useState(false);
    
    // Helper to sync error state with parent
    const handleError = (error: string | null) => {
        setInternalError(error);
        if (onError) onError(error);
    };

    const [isCompressing, setIsCompressing] = useState(false);
    const lastFileRef = useRef<{ name: string; size: number; lastModified: number } | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        handleError(null);

        // 1. Validation
        const validation = validateFile(file, {
            maxSize,
            allowedTypes: accept.split(','),
            preventEmpty: true
        });

        if (!validation.valid) {
            handleError(validation.error || 'Invalid file');
            return;
        }

        // 2. Strict SVG check
        if (isSVG(file) && !accept.includes('svg') && !accept.includes('image/*')) {
            handleError('SVG files are not permitted');
            return;
        }

        // 3. Corruption Guard
        const corrupted = await isCorrupted(file);
        if (corrupted) {
            handleError('File appears to be corrupted');
            return;
        }

        let finalFile = file;

        // 4. Compression (Skip for SVG)
        if (compress && isImage(file) && !isSVG(file)) {
            setIsCompressing(true);
            try {
                finalFile = await compressImage(file, {
                    maxSizeMB: maxSize / (1024 * 1024),
                    maxWidthOrHeight: 1920
                });
            } finally {
                setIsCompressing(false);
            }
        }

        lastFileRef.current = {
            name: finalFile.name,
            size: finalFile.size,
            lastModified: finalFile.lastModified
        };

        setIsCleared(false);
        onChange(finalFile);
    }, [onChange, maxSize, accept, compress]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: accept.split(',').reduce((acc, curr) => ({ ...acc, [curr.trim()]: [] }), {}),
        maxFiles: 1,
        disabled: disabled || isCompressing
    });

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
        setIsCleared(true);
        lastFileRef.current = null;
        handleError(null);
    };

    const getExt = (file: File) => file.name.split('.').pop()?.toLowerCase() || 'txt';

    return (
        <div className={cn('space-y-2', className)}>
            <div
                {...getRootProps()}
                className={cn(
                    'relative group cursor-pointer rounded-lg border-2 border-dashed transition-colors duration-200 overflow-hidden',
                    isDragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/60 hover:bg-accent/20',
                    value && !internalError && 'border-solid border-border',
                    internalError && 'border-destructive/50 bg-destructive/5',
                    disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                )}
            >
                <input {...getInputProps()} />

                <AnimatePresence mode="wait">
                    {/* ── Empty state / Initial URL ── */}
                    {!value ? (
                        initialUrl && !isCleared ? (
                            <motion.div
                                key="initial-preview"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.15 }}
                                className="p-3 grid grid-cols-[auto,1fr,auto] items-center gap-3"
                            >
                                <div className="relative w-14 h-14 rounded-md overflow-hidden border border-border bg-muted shrink-0">
                                    <img
                                        src={initialUrl}
                                        alt="Current image"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0 flex flex-col gap-1 pt-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-foreground truncate">
                                            Current Image
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">
                                        Existing banner image
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        onClick={handleRemove}
                                        className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:border-destructive/40"
                                    >
                                        <IconTrash size={13} />
                                        <span className="sr-only">Remove</span>
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="placeholder"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.15 }}
                                className="flex flex-col items-center justify-center py-10 gap-3"
                            >
                                <div className="w-10 h-10 rounded-md border border-border bg-background flex items-center justify-center text-muted-foreground transition-colors duration-200 group-hover:border-primary/50 group-hover:text-primary group-hover:bg-primary/5">
                                    <IconPhoto size={20} />
                                </div>
                                <div className="text-center space-y-0.5">
                                    <p className="text-sm font-medium text-foreground">{label}</p>
                                    <p className="text-xs text-muted-foreground">{description}</p>
                                </div>
                                <p className="text-[11px] text-muted-foreground/50">
                                    Max size: {formatBytes(maxSize)}
                                </p>
                            </motion.div>
                        )
                    ) : (
                        /* ── File / upload state ── */
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.15 }}
                            className="p-3 grid grid-cols-[auto,1fr,auto] items-center gap-3"
                        >
                            {/* Left: Thumbnail */}
                            <div className="relative w-14 h-14 rounded-md overflow-hidden border border-border bg-muted shrink-0">
                                {isImage(value) ? (
                                    <img
                                        src={URL.createObjectURL(value)}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                        <FileIcon type={getExt(value)} size={28} />
                                    </div>
                                )}

                                <AnimatePresence>
                                    {(isCompressing || (progress > 0 && progress < 100)) && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-background/70 flex items-center justify-center"
                                        >
                                            <IconLoader2 size={16} className="animate-spin text-muted-foreground" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Middle: Metadata */}
                            <div className="min-w-0 flex flex-col gap-1 pt-0.5">
                                {/* Name + valid badge */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-foreground truncate">
                                        {value.name}
                                    </span>
                                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                                        <IconCheck size={10} />
                                        Valid
                                    </span>
                                </div>

                                {/* Ext + size */}
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide">
                                        {getExt(value)}
                                    </span>
                                    <span>·</span>
                                    <span>{formatBytes(value.size)}</span>
                                </div>

                                {/* ↓ ORIGINAL progress logic — untouched ↓ */}
                                {progress > 0 && (
                                    <div className="mt-2 space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">
                                                {progress < 100 ? 'Uploading…' : 'Complete'}
                                            </span>
                                            <span className={cn(
                                                'tabular-nums font-medium',
                                                progress === 100 ? 'text-emerald-600' : 'text-foreground'
                                            )}>
                                                {progress}%
                                            </span>
                                        </div>
                                        <Progress value={progress} className="h-1" />
                                    </div>
                                )}

                                {/* ↓ ORIGINAL compressing logic — untouched ↓ */}
                                {isCompressing && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                        <IconLoader2 size={12} className="animate-spin" />
                                        <span>Compressing…</span>
                                    </div>
                                )}
                            </div>

                            {/* Right: Action buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                                {onPreview && (
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onPreview();
                                        }}
                                        className="h-7 w-7 rounded-md"
                                    >
                                        <IconSearch size={13} />
                                        <span className="sr-only">Preview</span>
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    onClick={handleRemove}
                                    className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:border-destructive/40"
                                >
                                    <IconTrash size={13} />
                                    <span className="sr-only">Remove</span>
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ↓ ORIGINAL drag overlay logic — untouched ↓ */}
                <AnimatePresence>
                    {(isDragActive || isCompressing) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={cn(
                                'absolute inset-0 z-30 flex items-center justify-center gap-2 rounded-lg',
                                isDragActive
                                    ? 'bg-background/95'
                                    : 'bg-background/90'
                            )}
                        >
                            {isDragActive ? (
                                <>
                                    <IconCloudUpload size={18} className="text-primary animate-bounce" />
                                    <span className="text-sm font-medium text-primary">Drop to upload</span>
                                </>
                            ) : (
                                <>
                                    <IconLoader2 size={18} className="animate-spin text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Compressing…</span>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ↓ ORIGINAL error logic — untouched ↓ */}
            {internalError && (
                <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-1.5 text-xs text-destructive px-1"
                >
                    <IconAlertCircle size={13} className="shrink-0" />
                    <span>{internalError}</span>
                </motion.div>
            )}
        </div>
    );
};