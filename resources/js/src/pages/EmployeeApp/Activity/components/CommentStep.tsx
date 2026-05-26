import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IconNotes, IconLoader2, IconCheck, IconSend } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface CommentStepProps {
    comment: string;
    onChange: (val: string) => void;
    onSubmit: () => void;
    onBack: () => void;
    submitting: boolean;
    location: { lat: number; lng: number; name?: string } | null;
    locLoading: boolean;
}

export function CommentStep({ comment, onChange, onSubmit, onBack, submitting, location, locLoading }: CommentStepProps) {
    const { t } = useTranslation('pwa');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [comment]);

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
                        <IconNotes className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">{t('final_details', 'Final Details') as string}</h3>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5 uppercase tracking-wide">{t('step_3_notes', 'Step 3: Activity Notes') as string}</p>
                    </div>

                    {/* Background GPS Indicator */}
                    <div className={cn(
                        "px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all duration-500",
                        location ? "bg-emerald-50/50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/10 dark:border-emerald-800" : "bg-gray-50 border-gray-100 text-gray-400 dark:bg-gray-900/40 dark:border-gray-800"
                    )}>
                        {locLoading ? (
                            <IconLoader2 size={12} className="animate-spin" />
                        ) : (
                            <IconCheck size={12} className={cn(location ? "opacity-100" : "opacity-30")} />
                        )}
                        <span className="text-[10px] font-black uppercase tracking-wide whitespace-nowrap">
                            {location ? t('gps_verified', 'GPS Verified') as string : locLoading ? t('syncing_gps', 'Syncing GPS') as string : t('no_gps', 'No GPS') as string}
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
                <label className="block text-[10px] font-black uppercase tracking-wide text-gray-400 mb-4 ml-1">
                    {t('what_did_you_accomplish', 'What did you accomplish?') as string}
                </label>
                
                <textarea
                    ref={textareaRef}
                    rows={4}
                    value={comment}
                    onChange={e => onChange(e.target.value)}
                    placeholder={t('comment_placeholder', 'Enter site notes, visit outcomes, or any important updates...') as string}
                    className="w-full bg-gray-50/50 dark:bg-gray-900/40 rounded-2xl p-5 text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 resize-none outline-none leading-relaxed font-medium border border-transparent focus:border-primary/20 transition-all min-h-[120px]"
                    maxLength={1000}
                />
                
                <div className="flex items-center justify-between mt-4 px-1">
                    <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest",
                        comment.length >= 900 ? "text-rose-500" : "text-gray-300"
                    )}>
                        {comment.length} / 1000 {t('characters', 'Characters') as string}
                    </span>
                    {comment.length > 0 && (
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                            {t('ready_to_submit', 'Ready to Submit') as string}
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={onBack} 
                    disabled={submitting}
                    className="py-4 rounded-full border-2 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-200 font-black text-xs uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                >
                     {t('back_step', 'Back') as string}
                </button>
                <button 
                    onClick={onSubmit}
                    disabled={submitting}
                    className="py-4 rounded-full bg-primary text-white font-black text-xs uppercase tracking-wide shadow shadow-primary/30 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        <>
                            <IconLoader2 className="w-4 h-4 animate-spin" />
                            <span>{t('submitting', 'Sending...') as string}</span>
                        </>
                    ) : (
                        <>
                            <IconSend className="w-4 h-4" />
                            <span>{t('finish_log', 'Finish Log') as string}</span>
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
}
