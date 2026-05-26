import React, { useState } from 'react';
import {
    IconPhotoPlus,
    IconTrash,
    IconLoader2,
    IconAlertCircle,
    IconX
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { compressImage, validateFile } from '@/lib/file-utils';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface PwaMultiImageUploadProps {
    value: File[];
    onChange: (files: File[]) => void;
    label?: string;
    maxFiles?: number;
}

export function PwaMultiImageUpload({
    value = [],
    onChange,
    label = 'Attachments',
    maxFiles = 5
}: PwaMultiImageUploadProps) {
    const { t } = useTranslation('pwa');
    const [compressing, setCompressing] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (value.length + files.length > maxFiles) {
            toast.error(t('max_files_error', { count: maxFiles }) as string);
            return;
        }

        setCompressing(true);
        const processedFiles: File[] = [];

        for (const file of files) {
            // Validation
            const validation = validateFile(file, {
                maxSize: 10 * 1024 * 1024,
                allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
            });

            if (!validation.valid) {
                toast.error(`${file.name}: ${validation.error}`);
                continue;
            }

            // Compression
            try {
                const compressed = await compressImage(file, {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1280
                });
                processedFiles.push(compressed);
            } catch (err) {
                processedFiles.push(file);
            }
        }

        onChange([...value, ...processedFiles]);
        setCompressing(false);
        e.target.value = ''; // Reset input
    };

    const removeFile = (index: number) => {
        const newValue = [...value];
        newValue.splice(index, 1);
        onChange(newValue);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-400">
                    {t('attachments')} ({value.length}/{maxFiles})
                </label>
            </div>

            <div className="flex flex-wrap gap-3">
                <AnimatePresence initial={false}>
                    {value.map((file, index) => (
                        <motion.div
                            key={`${file.name}-${index}`}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800"
                        >
                            <img
                                src={URL.createObjectURL(file)}
                                alt="preview"
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute top-1 right-1 w-6 h-6 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
                            >
                                <IconX className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {value.length < maxFiles && (
                    <label className={cn(
                        "w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95",
                        compressing 
                            ? "bg-gray-50 border-gray-200 pointer-events-none" 
                            : "bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-primary/50 text-gray-400 hover:text-primary"
                    )}>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={compressing}
                        />
                        {compressing ? (
                            <IconLoader2 className="w-6 h-6 animate-spin text-primary" />
                        ) : (
                            <>
                                <IconPhotoPlus className="w-7 h-7" />
                                <span className="text-[9px] font-black uppercase tracking-tighter">{t('add', 'Add') as string}</span>
                            </>
                        )}
                    </label>
                )}
            </div>

            {value.length === 0 && !compressing && (
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/40 p-3 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                    <IconAlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
                    <p className="text-[10px] text-gray-400 leading-tight">
                        {t('add_images_hint', 'Add images (medical certificates, evidence, etc.) to support your request.') as string}
                    </p>
                </div>
            )}
        </div>
    );
}
