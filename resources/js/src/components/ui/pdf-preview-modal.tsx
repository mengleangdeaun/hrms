import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { 
    IconX, 
    IconDownload, 
    IconFileText, 
    IconPrinter,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import PerfectScrollbar from 'react-perfect-scrollbar';


interface PDFPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    url: string;
    title?: string;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
    open,
    onOpenChange,
    url,
    title = 'PDF Document Preview'
}) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && url) {
            loadPdfBlob();
        } else {
            // Cleanup on close
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
                setBlobUrl(null);
            }
        }

        return () => {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [open, url]);

    const canvasContainerRef = React.useRef<HTMLDivElement>(null);

    const loadPdfBlob = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Ensure PDF.js is loaded
            if (!(window as any).pdfjsLib) {
                await loadScript('/assets/vendor/pdfjs/pdf.min.js');
            }
            const pdfjsLib = (window as any).pdfjsLib;
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/vendor/pdfjs/pdf.worker.min.js';

            // 2. Fetch the PDF bytes
            const response = await fetch(url, {
                headers: { 
                    'Accept': 'application/octet-stream, */*',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include'
            });
            if (response.status === 404) {
                throw new Error('DOCUMENT_NOT_FOUND');
            }
            if (!response.ok) throw new Error('FAILED_TO_FETCH');
            const arrayBuffer = await response.arrayBuffer();

            // 3. Load the document
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            // 4. Render pages to canvases
            if (canvasContainerRef.current) {
                canvasContainerRef.current.innerHTML = ''; // Clear previous content
                
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 1.5 });
                    
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    canvas.className = "w-full h-auto mb-4 rounded-lg shadow-sm bg-white";
                    
                    canvasContainerRef.current.appendChild(canvas);
                    
                    await page.render({
                        canvasContext: context!,
                        viewport: viewport
                    }).promise;
                }
            }

            setBlobUrl(url); // Just for state management
        } catch (err) {
            console.error('Error rendering PDF with PDF.js:', err);
            setError('Could not render PDF preview. Please download it to view.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadScript = (src: string) => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = url;
        
        // Ensure filename always has .pdf extension for consistent OS/Browser behavior
        const cleanTitle = (title || 'document').replace(/[\\/:*?"<>|]/g, ''); // Basic santization
        const filename = cleanTitle.toLowerCase().endsWith('.pdf') ? cleanTitle : `${cleanTitle}.pdf`;
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
            printWindow.onload = () => {
                printWindow.print();
            };
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}> 
            <DialogContent className="max-w-[95vw] w-full sm:max-w-6xl p-0 gap-0 h-[90vh] flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden shadow-2xl border-none rounded-3xl [&>button]:hidden"> 
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-border/50 shadow-sm z-30"> 
                    <div className="flex items-center gap-4 min-w-0"> 
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shadow-inner border border-rose-500/10"> 
                            <IconFileText size={22} stroke={2.5} /> 
                        </div> 
                        <div className="min-w-0"> 
                            <DialogTitle className="text-sm font-bold truncate tracking-tight pr-4 text-slate-800 dark:text-slate-100"> 
                                {title} 
                            </DialogTitle> 
                            <div className="flex items-center gap-2 mt-0.5"> 
                                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest"> PDF DOCUMENT PREVIEW </span> 
                                <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" /> 
                                <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider"> Protected View </span> 
                            </div> 
                        </div> 
                    </div> 
                    <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-xl border border-border/50"> 
                        <Button size="sm" variant="ghost" onClick={handlePrint} className="h-9 text-xs gap-2 px-3 font-bold" > 
                            <IconPrinter size={16} /> Print 
                        </Button> 
                        <Button size="sm" variant="default" onClick={handleDownload} className="h-9 text-xs gap-2 px-4 bg-rose-500 hover:bg-rose-600 text-white font-bold" > 
                            <IconDownload size={16} /> Download 
                        </Button> 
                        <div className="w-px h-6 bg-border mx-1" /> 
                        <Button size="icon" variant="ghost" onClick={() => onOpenChange(false)} className="size-9 hover:bg-rose-500/10 hover:text-rose-500" > 
                            <IconX size={18} /> 
                        </Button> 
                    </div> 
                </div> 

                {/* PDF Viewer with PerfectScrollbar */}
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 p-4 sm:p-6 relative overflow-hidden"> 
                        <PerfectScrollbar className="w-full h-full rounded-2xl shadow-2xl border border-white dark:border-zinc-800 bg-white dark:bg-zinc-950 relative p-4 custom-scrollbar"> 
                            <div ref={canvasContainerRef} className="flex flex-col items-center w-full min-h-full" />
                            
                            {isLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-zinc-950 z-20">
                                    <Loader2 className="w-10 h-10 text-rose-500 animate-spin mb-4" />
                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Rendering Document...</p>
                                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-black">JavaScript Canvas Buffer</p>
                                </div>
                            )}

                            {error && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-950 z-20">
                                    <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">{error}</p>
                                    <Button variant="outline" size="sm" onClick={loadPdfBlob} className="font-bold">
                                        Retry Preview
                                    </Button>
                                </div>
                            )}
                            
                            {/* Subtle overlay */}
                            {!isLoading && !error && <div className="absolute inset-0 pointer-events-none border-2 border-primary/5 rounded-2xl" />} 
                        </PerfectScrollbar> 
                </div> 
            </DialogContent> 
        </Dialog>
    );
};
