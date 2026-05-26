import { IconCamera, IconPhotoPlus, IconLoader2 } from '@tabler/icons-react';
import { PwaMultiImageUpload } from '@/components/ui/pwa/pwa-multi-image-upload';
import { useTranslation } from 'react-i18next';
import { compressImage, validateFile } from '@/lib/file-utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import React from 'react';

interface AttachmentStepProps {
    attachments: File[];
    onChange: (files: File[]) => void;
    onNext: () => void;
}

export function AttachmentStep({ attachments, onChange, onNext }: AttachmentStepProps) {
    const { t } = useTranslation('pwa');
    const cameraInputRef = React.useRef<HTMLInputElement>(null);
    const [compressing, setCompressing] = React.useState(false);

    const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (attachments.length + files.length > 5) {
            toast.error(t('max_files_error', { count: 5 }) as string);
            return;
        }

        setCompressing(true);
        const processedFiles: File[] = [];

        for (const file of files) {
            const validation = validateFile(file, {
                maxSize: 10 * 1024 * 1024,
                allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
            });

            if (!validation.valid) {
                toast.error(`${file.name}: ${validation.error}`);
                continue;
            }

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

        onChange([...attachments, ...processedFiles]);
        setCompressing(false);
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    };

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 rounded-3xl border border-primary/10 mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                        <IconCamera className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">{t('capture_your_progress', 'Capture Your Progress') as string}</h3>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5 uppercase tracking-wider">{t('step_1_proof', 'Step 1: Activity Proof') as string}</p>
                    </div>
                </div>
            </div>

            <PwaMultiImageUpload 
                value={attachments}
                onChange={onChange}
                label={t('site_photos_evidence', 'Site Photos & Evidence') as string}
                maxFiles={5}
            />

            <div className="flex flex-col gap-3 pt-2">
                <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={compressing || attachments.length >= 5}
                    className="w-full py-4 rounded-full bg-white dark:bg-gray-800 border-2 border-primary/20 text-primary font-black text-xs uppercase tracking-wide flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
                >
                    {compressing ? <IconLoader2 className="w-5 h-5 animate-spin" /> : <IconCamera className="w-5 h-5" />}
                    {t('open_camera_instantly', 'Open Camera Instantly')}
                </button>

                <input 
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCameraCapture}
                />

                <button
                    onClick={onNext}
                    disabled={attachments.length === 0 || compressing}
                    className="w-full py-4 rounded-full bg-primary text-white font-black text-xs uppercase tracking-wide shadow shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-40 disabled:grayscale flex items-center justify-center gap-2"
                >
                    {t('next_step_location', 'Next Step: Location') as string}
                </button>
            </div>
        </motion.div>
    );
}
