import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    IconX,
    IconDownload,
    IconZoomIn,
    IconZoomOut,
    IconRotateClockwise,
    IconMaximize,
    IconRefresh,
    IconLoader2
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ImagePreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    src: string;
    title?: string;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
    open,
    onOpenChange,
    src,
    title = 'Image Preview'
}) => {
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Reset zoom and rotation when modal opens/closes
    useEffect(() => {
        if (!open) {
            const timeout = setTimeout(() => {
                setScale(1);
                setRotation(0);
                setIsLoading(true);
            }, 200);
            return () => clearTimeout(timeout);
        }
        setIsLoading(true);
    }, [open, src]);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 5));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
    const handleReset = () => {
        setScale(1);
        setRotation(0);
    };
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = src;
        link.download = title || 'image';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Keyboard shortcut: R to reset
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!open) return;
            if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                handleReset();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-full sm:max-w-6xl p-0 overflow-hidden bg-black/95 backdrop-blur-sm border-white/10 gap-0 [&>button]:hidden h-[90vh] flex flex-col rounded-2xl shadow-2xl">
                {/* Header Toolbar */}
                <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                            <IconMaximize size={18} />
                        </div>
                        <div className="min-w-0">
                            <DialogTitle className="text-white text-sm font-semibold truncate max-w-[200px] sm:max-w-md">
                                {title}
                            </DialogTitle>
                            <DialogDescription className="text-white/50 text-[10px] font-mono mt-0.5 flex gap-2">
                                <span>{Math.round(scale * 100)}%</span>
                                {rotation !== 0 && <span>• {rotation}°</span>}
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                        <TooltipProvider delayDuration={200}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={handleZoomOut} disabled={scale <= 0.5}
                                        className="text-white hover:bg-white/20 rounded-lg size-8 disabled:opacity-30">
                                        <IconZoomOut size={16} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">Zoom Out</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={handleReset}
                                        className="text-white hover:bg-white/20 rounded-lg size-8">
                                        <IconRefresh size={16} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">Reset (R)</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={handleZoomIn} disabled={scale >= 5}
                                        className="text-white hover:bg-white/20 rounded-lg size-8 disabled:opacity-30">
                                        <IconZoomIn size={16} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">Zoom In</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={handleRotate}
                                        className="text-white hover:bg-white/20 rounded-lg size-8">
                                        <IconRotateClockwise size={16} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">Rotate 90°</TooltipContent>
                            </Tooltip>
                            <div className="w-px h-5 bg-white/20 mx-0.5" />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={handleDownload}
                                        className="text-white hover:bg-white/20 rounded-lg size-8">
                                        <IconDownload size={16} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">Download</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={() => onOpenChange(false)}
                                        className="text-white hover:bg-rose-500/80 rounded-lg size-8 transition-colors ml-0.5">
                                        <IconX size={16} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">Close (Esc)</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                {/* Main View Area */}
                <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center p-8 select-none">
                    <AnimatePresence mode="wait">
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10"
                            >
                                <IconLoader2 size={40} className="text-white animate-spin" />
                            </motion.div>
                        )}
                        <motion.div
                            key={src}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full h-full flex items-center justify-center"
                            style={{ rotate: `${rotation}deg` }}  // Rotation applied directly, no animation
                        >
                            <img
                                src={src}
                                alt={title}
                                draggable={false}
                                onLoad={() => setIsLoading(false)}
                                className={cn(
                                    "max-w-full max-h-full object-contain shadow-2xl rounded-lg transition-shadow",
                                    scale > 1 && "ring-2 ring-white/20"
                                )}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Bottom instruction */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/20 pointer-events-none">
                    <p className="text-[12px] text-white/70 flex items-center gap-2">
                        <span>Use buttons to zoom & rotate</span>
                        <span className="w-1 h-1 bg-white/30 rounded-full" />
                        <span><kbd className="bg-white/15 px-1 rounded text-[12px]">R</kbd> to reset</span>
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};