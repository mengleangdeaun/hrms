import React from 'react';
import { IconWorld, IconPhoto } from '@tabler/icons-react';
import { AnnouncementFormData } from '../types';
import { cn } from '@/lib/utils';

interface PwaPreviewProps {
    form: AnnouncementFormData;
    imageUrl: string | null;
}

export const PwaPreview = ({ form, imageUrl }: PwaPreviewProps) => {
    const pwaTitle = form.pwa_title || form.title || 'Announcement Title';
    
    return (
        <div className="relative w-[280px] h-[580px] bg-gray-900 rounded-[2rem] border-[8px] border-gray-800 shadow-2xl overflow-hidden pointer-events-none select-none mx-auto lg:sticky lg:top-24">
            {/* Speaker/Camera notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20" />
            
            <div className="absolute inset-0 bg-gray-50 dark:bg-zinc-950 flex flex-col">
                {/* Status Bar */}
                <div className="h-10 flex justify-between items-center px-6 pt-2 text-gray-400 dark:text-gray-500">
                    <span className="text-[10px] font-bold">9:41</span>
                    <div className="flex gap-1.5 items-center">
                        <div className="w-3 h-3 bg-current rounded-full opacity-20" />
                        <div className="w-4 h-2.5 bg-current rounded-sm opacity-20" />
                    </div>
                </div>

                {/* App Header */}
                <div className="p-4 flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <IconWorld className="w-4 h-4 text-primary" />
                    </div>
                    <div className="h-2 w-20 bg-gray-200 dark:bg-zinc-800 rounded-full" />
                </div>

                <div className="flex-1 overflow-hidden p-4 space-y-4">
                    {/* Top Banner Mode */}
                    {form.pwa_display_type === 'top_banner' && (
                        <div className={cn(
                            "bg-primary text-white rounded-md shadow-lg animate-in slide-in-from-top-4 duration-500",
                            form.has_pwa_action ? "p-3" : "h-1"
                        )}>
                            {form.has_pwa_action && (
                                <>
                                    {form.pwa_show_title && <p className="text-[11px] font-bold leading-tight line-clamp-2">{pwaTitle}</p>}
                                    {form.pwa_action_label && (
                                        <div className="mt-2 text-[9px] font-black uppercase tracking-widest bg-white/20 inline-block px-2 py-1 rounded-md">
                                            {form.pwa_action_label}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Quick Actions Skeleton */}
                    <div className="grid grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="space-y-2">
                                <div className="aspect-square bg-gray-200 dark:bg-zinc-800 rounded-md" />
                                <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-900 rounded-full" />
                            </div>
                        ))}
                    </div>

                    {/* Home Image Section / Carousel Mode */}
                    {form.pwa_display_type === 'home_image_section' && (
                        <div className="aspect-[21/9] bg-gray-200 dark:bg-zinc-800 rounded-md overflow-hidden relative shadow-md">
                            {imageUrl ? (
                                <img src={imageUrl} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <IconPhoto className="w-8 h-8 text-gray-400 opacity-30" />
                                </div>
                            )}
                            {form.pwa_show_title && (
                                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent animate-in fade-in duration-300">
                                    <p className="text-white text-[10px] font-bold truncate">{pwaTitle}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Content Skeleton */}
                    <div className="space-y-3 pt-2">
                        <div className="h-3 w-1/2 bg-gray-200 dark:bg-zinc-800 rounded-full" />
                        <div className="space-y-2">
                            <div className="h-16 w-full bg-gray-100 dark:bg-zinc-900 rounded-md" />
                            <div className="h-16 w-full bg-gray-100 dark:bg-zinc-900 rounded-md" />
                        </div>
                    </div>
                </div>

                {/* Home Popup Mode / Modal Overlay */}
                {form.pwa_display_type === 'home_popup' && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-30 flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className={cn(
                            "bg-white dark:bg-zinc-900 w-full rounded-md shadow-lg animate-in zoom-in-95 duration-500 overflow-hidden transition-all",
                            (form.pwa_show_title || form.has_pwa_action) ? "p-5" : "p-0 mx-4"
                        )}>
                            <div className="aspect-video bg-gray-100 dark:bg-zinc-800 overflow-hidden rounded-md mb-4">
                                {imageUrl ? (
                                    <img src={imageUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <IconPhoto className="w-8 h-8 text-gray-400 opacity-20" />
                                    </div>
                                )}
                            </div>
                            {(form.pwa_show_title || form.has_pwa_action) && (
                                <div className="space-y-4 animate-in slide-in-from-bottom-2">
                                    {form.pwa_show_title && (
                                        <div className="space-y-2 text-gray-900 dark:text-white">
                                            <h3 className="text-sm font-black leading-tight">{pwaTitle}</h3>
                                            <p className="text-[11px] text-gray-500 line-clamp-3">This is how your announcement content will appear in the startup popup modal.</p>
                                        </div>
                                    )}
                                    {form.has_pwa_action && (
                                        <div className="h-10 bg-primary rounded-md flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                            {form.pwa_action_label || 'Learn More'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Bottom Nav Skeleton */}
                <div className="h-14 bg-white dark:bg-black border-t dark:border-zinc-900 flex justify-around items-center px-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-5 h-5 bg-gray-200 dark:bg-zinc-800 rounded-md" />
                    ))}
                </div>
            </div>
        </div>
    );
};
