import React, { useState } from 'react';
import { ArrowLeft, Download, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useNavigate } from 'react-router-dom';
import { ActionButton } from '@/components/ui/ActionButtons';
import { Toaster } from 'sonner';

interface PrintToolbarProps {
    title: string;
    subtitle?: string;
    documentName: string;
    template: any;
    onBack?: () => void;
    printableElementId?: string;
}

export const PrintToolbar: React.FC<PrintToolbarProps> = ({
    title,
    subtitle = "Document Preview & Printing",
    documentName,
    template,
    onBack,
    printableElementId = 'printable-area'
}) => {
    const navigate = useNavigate();
    const [exportQuality, setExportQuality] = useState<'standard' | 'high' | 'ultra' | 'max'>('high');
    const [downloadingImage, setDownloadingImage] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    const handleBack = () => {
        if (onBack) {
            onBack();
            return;
        }
        
        // If there's no history to go back to (e.g. new tab), navigate to a default list page
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            // Fallback to closing the tab if opened via window.open, or go to home
            if (window.opener) {
                window.close();
            } else {
                navigate('/');
            }
        }
    };

    const getPixelRatio = () => {
        switch (exportQuality) {
            case 'max':
                return 8;
            case 'ultra':
                return 4;
            case 'high':
                return 2;
            case 'standard':
                return 1.5;
            default:
                return 2;
        }
    };

    const handleDownloadImage = async () => {
        const element = document.getElementById(printableElementId);
        if (!element) return;
        
        setDownloadingImage(true);
        
        const capturePromise = (async () => {
            const canvasElement = (element.querySelector('.print-canvas') as HTMLElement) || element;
            
            const dataUrl = await toPng(canvasElement, {
                pixelRatio: getPixelRatio(),
                backgroundColor: '#ffffff',
                cacheBust: true,
                skipFonts: true, 
                includeQueryParams: true,
                imagePlaceholder: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
                filter: (node: any) => {
                    const exclusionClasses = ['no-print', 'edit-handle', 'delete-btn', 'resize-handle', 'loader'];
                    const hasExclusionClass = node.classList && exclusionClasses.some(cls => node.classList.contains(cls));
                    if (hasExclusionClass) return false;

                    if (node.tagName === 'IMG') {
                        if (node.naturalWidth === 0 || node.complete === false) {
                            return false; 
                        }
                    }
                    return true;
                }
            });

            const link = document.createElement('a');
            link.download = `${documentName}.png`;
            link.href = dataUrl;
            link.click();
            return true;
        })();

        toast.promise(capturePromise, {
            loading: `Generating High-Quality Image (${exportQuality.toUpperCase()})...`,
            success: 'Image Downloaded Successfully',
            error: 'Image Capture Failed. Please try again.',
        });

        try {
            await capturePromise;
        } catch (error) {
            console.error('Image Export Failed:', error);
        } finally {
            setDownloadingImage(false);
        }
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById(printableElementId);
        if (!element) return;

        setDownloadingPdf(true);

        const pdfPromise = (async () => {
            const canvasElement = (element.querySelector('.print-canvas') as HTMLElement) || element;
            
            // Cap PDF pixel ratio to 4 (Ultra) to avoid jsPDF memory/corruption issues with 8K data
            const pdfPixelRatio = Math.min(getPixelRatio(), 4);
            
            const dataUrl = await toPng(canvasElement, {
                pixelRatio: pdfPixelRatio,
                backgroundColor: '#ffffff',
                cacheBust: true,
                skipFonts: true,
                includeQueryParams: true,
                imagePlaceholder: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
                filter: (node: any) => {
                    const exclusionClasses = ['no-print', 'edit-handle', 'delete-btn', 'resize-handle', 'loader'];
                    const hasExclusionClass = node.classList && exclusionClasses.some(cls => node.classList.contains(cls));
                    if (hasExclusionClass) return false;
                    
                    if (node.tagName === 'IMG') {
                        if (node.naturalWidth === 0 || node.complete === false) {
                            return false;
                        }
                    }
                    return true;
                }
            });

            const pdf = new jsPDF({
                unit: 'mm',
                format: template?.page_size?.toLowerCase() === 'a5' ? 'a5' : 'a4',
                orientation: template?.styles?.general?.orientation || 'portrait',
                compress: true, 
            });

            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Use PNG for Ultra/Max to avoid JPEG corruption at high resolutions
            const format = (exportQuality === 'ultra' || exportQuality === 'max') ? 'PNG' : 'JPEG';
            const compression = (exportQuality === 'standard') ? 'FAST' : 'SLOW';

            pdf.addImage(dataUrl, format, 0, 0, pdfWidth, pdfHeight, undefined, compression);
            pdf.save(`${documentName}.pdf`);
            return true;
        })();

        toast.promise(pdfPromise, {
            loading: `Generating PDF Document (${exportQuality.toUpperCase()})...`,
            success: 'PDF Saved Successfully',
            error: 'PDF Generation Failed. Please try again.',
        });

        try {
            await pdfPromise;
        } catch (error) {
            console.error('PDF Export Failed:', error);
        } finally {
            setDownloadingPdf(false);
        }
    };

    const handlePrint = () => window.print();

    return (
        <div className="no-print h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl sticky top-0 z-50 px-6 flex items-center justify-center">
            <Toaster richColors position="top-center" />
            
            <div className="max-w-[1400px] w-full flex items-center justify-between">
                {/* Left Section: Back Button & Title */}
                <div className="flex items-center gap-4">
                    <ActionButton 
                        icon={ArrowLeft}
                        label="Go Back"
                        onClick={handleBack}
                        style="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full"
                        variant="rounded"
                    />
                    <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />
                    <div className="flex flex-col">
                        <h1 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight leading-tight">{title}</h1>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">{subtitle}</p>
                    </div>
                </div>

                {/* Right Section: Actions */}
                <div className="flex-1 flex items-center justify-end gap-3">
                    {/* Quality Selector */}
                    <div className="hidden lg:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-full border border-slate-200 dark:border-slate-700/50 pr-3">
                        <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm border border-slate-100 dark:border-slate-800">
                            Q
                        </div>
                        <Select value={exportQuality} onValueChange={(v: any) => setExportQuality(v)}>
                            <SelectTrigger className="h-7 text-[10px] w-28 bg-transparent border-none shadow-none font-black uppercase tracking-tight focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end" alignOffset={-20} className="rounded-lg mt-1 !w-48 border-slate-200 dark:border-slate-800">
                                <SelectItem value="standard" className="text-[10px] font-bold">Standard (Fast)</SelectItem>
                                <SelectItem value="high" className="text-[10px] font-bold">High (Best)</SelectItem>
                                <SelectItem value="ultra" className="text-[10px] font-bold">Ultra (HD)</SelectItem>
                                <SelectItem value="max" className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Maximum (8K)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="hidden sm:block h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

                    {/* Export Actions */}
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            onClick={handleDownloadImage} 
                            disabled={downloadingImage || !template} 
                            className="h-9 px-4 rounded-full gap-2 font-black text-[10px] uppercase tracking-wider border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all active:scale-95"
                        >
                            {downloadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-blue-500" />}
                            Image
                        </Button>

                        <Button 
                            variant="outline" 
                            onClick={handleDownloadPDF} 
                            disabled={downloadingPdf || !template} 
                            className="h-9 px-4 rounded-full gap-2 font-black text-[10px] uppercase tracking-wider border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all active:scale-95"
                        >
                            {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-rose-500" />}
                            PDF
                        </Button>

                        <Button 
                            onClick={handlePrint} 
                            disabled={!template} 
                            className="h-9 px-6 rounded-full gap-2 font-black text-[10px] uppercase tracking-wider bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-lg shadow-slate-200 dark:shadow-none active:scale-95 ml-2"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            Print Now
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintToolbar;
