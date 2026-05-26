import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { IconX, IconDownload, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface PwaImagePreviewModalProps {
    images: string[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
    title?: string;
}

export const PwaImagePreviewModal: React.FC<PwaImagePreviewModalProps> = ({
    images = [],
    initialIndex = 0,
    isOpen,
    onClose,
    title = 'Image Preview'
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [scale, setScale] = useState(1);
    const [lastScale, setLastScale] = useState(1);
    const [isPinching, setIsPinching] = useState(false);
    
    // For swipe-to-dismiss and navigation
    const y = useMotionValue(0);
    const backgroundOpacity = useTransform(y, [0, 200], [1, 0]);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            setScale(1);
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
        } else {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        };
    }, [isOpen, initialIndex]);

    // Handle touch events for Pinch-to-Zoom
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            setIsPinching(true);
            const distance = getDistance(e.touches[0], e.touches[1]);
            setLastScale(distance);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && isPinching) {
            const distance = getDistance(e.touches[0], e.touches[1]);
            const delta = distance / lastScale;
            const newScale = Math.min(Math.max(scale * delta, 1), 5);
            setScale(newScale);
            setLastScale(distance);
        }
    };

    const handleTouchEnd = () => {
        setIsPinching(false);
    };

    const getDistance = (t1: React.Touch, t2: React.Touch) => {
        return Math.sqrt(Math.pow(t2.pageX - t1.pageX, 2) + Math.pow(t2.pageY - t1.pageY, 2));
    };

    const handleDoubleTap = () => {
        setScale(prev => (prev > 1 ? 1 : 2.5));
    };

    const navigate = (dir: 'next' | 'prev') => {
        if (scale > 1) return; // Disable navigation when zoomed in
        if (dir === 'next' && currentIndex < images.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setScale(1);
        } else if (dir === 'prev' && currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setScale(1);
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = images[currentIndex];
        link.download = `image_${currentIndex + 1}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black select-none touch-none h-[100dvh] w-full overflow-hidden"
                    style={{ opacity: backgroundOpacity }}
                >
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 z-[1001] p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
                        <div className="flex flex-col">
                            <span className="text-white text-xs font-black uppercase tracking-widest">{title}</span>
                            <span className="text-white/50 text-[10px] font-bold">{currentIndex + 1} / {images.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDownload}
                                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all"
                            >
                                <IconDownload size={18} />
                            </button>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all"
                            >
                                <IconX size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Image Viewport */}
                    <motion.div
                        drag={scale === 1 ? 'y' : true}
                        dragConstraints={scale === 1 ? { top: 0, bottom: 0 } : false}
                        style={{ y }}
                        onDragEnd={(_, info) => {
                            if (scale === 1) {
                                // Swipe down to dismiss
                                if (info.offset.y > 100) onClose();
                                // Swipe left/right to navigate
                                if (info.offset.x > 100) navigate('prev');
                                if (info.offset.x < -100) navigate('next');
                            }
                        }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onDoubleClick={handleDoubleTap}
                        className="w-full h-full flex items-center justify-center overflow-hidden"
                    >
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={currentIndex}
                                src={images[currentIndex]}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ 
                                    opacity: 1, 
                                    x: 0,
                                    scale: scale,
                                }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="max-w-full max-h-full object-contain pointer-events-none"
                                draggable={false}
                            />
                        </AnimatePresence>
                    </motion.div>

                    {/* Navigation Indicators (Visible only if more than 1 image) */}
                    {images.length > 1 && scale === 1 && (
                        <>
                            {currentIndex > 0 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigate('prev'); }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white active:scale-75 transition-all"
                                >
                                    <IconChevronLeft size={24} />
                                </button>
                            )}
                            {currentIndex < images.length - 1 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigate('next'); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white active:scale-75 transition-all"
                                >
                                    <IconChevronRight size={24} />
                                </button>
                            )}
                        </>
                    )}

                    {/* Instructions */}
                    <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
                        <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
                            <p className="text-[10px] text-white/60 font-black uppercase tracking-widest flex items-center gap-3">
                                <span>Pinch to Zoom</span>
                                <span className="w-1 h-1 bg-white/20 rounded-full" />
                                <span>Swipe Down to Close</span>
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
