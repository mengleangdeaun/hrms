import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { IconChevronRight } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface Announcement {
    id: number;
    title: string;
    pwa_title?: string;
    pwa_show_title?: boolean;
    has_pwa_action?: boolean;
    featured_image_url: string;
    pwa_action_label?: string;
    pwa_action_url?: string;
}

interface HomeCarouselProps {
    announcements: Announcement[];
}

export const HomeCarousel: React.FC<HomeCarouselProps> = ({ announcements }) => {
    const navigate = useNavigate();

    if (announcements.length === 0) return null;

    const handleAction = (announcement: Announcement) => {
        // If action is disabled in PWA, clicking shouldn't do anything special (or maybe it goes to default view)
        // User said: "when no action label ... just show only an image with no box, no background, no title"
        if (!announcement.has_pwa_action) return;

        if (announcement.pwa_action_url) {
            if (announcement.pwa_action_url.startsWith('http')) {
                window.open(announcement.pwa_action_url, '_blank');
            } else {
                navigate(announcement.pwa_action_url);
            }
        } else {
            navigate(`/employee/announcements/${announcement.id}`);
        }
    };

    return (
        <div className="relative w-full">
            <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 pb-1">
                {announcements.map((item) => {
                    const isPureImage = item.pwa_show_title === false && item.has_pwa_action === false;
                    
                    return (
                        <div 
                            key={item.id} 
                            className={cn(
                                "shrink-0 w-full snap-center last:mr-0 rounded-2xl overflow-hidden relative aspect-[16/9] transition-all",
                                isPureImage ? "shadow-none bg-transparent" : "bg-gray-100 dark:bg-gray-800 shadow-xl shadow-black/5"
                            )}
                            onClick={() => handleAction(item)}
                        >
                            <img 
                                src={item.featured_image_url} 
                                className="w-full h-full object-cover" 
                                alt={item.title}
                            />
                            
                            {!isPureImage && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                                    {item.pwa_show_title !== false && (
                                        <h3 className="text-white font-black text-lg leading-tight mb-3 drop-shadow-md">
                                            {item.pwa_title || item.title}
                                        </h3>
                                    )}
                                    
                                    {item.has_pwa_action !== false && item.pwa_action_label && (
                                        <button
                                            className="self-start px-4 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full flex items-center shadow-lg active:scale-95 transition-transform"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAction(item);
                                            }}
                                        >
                                            {item.pwa_action_label}
                                            <IconChevronRight className="w-3.5 h-3.5 ml-1" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            {announcements.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                    {announcements.map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700 first:bg-primary" />
                    ))}
                </div>
            )}
        </div>
    );
};
