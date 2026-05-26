import React, { useRef, useEffect, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { toPng } from 'html-to-image';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import {
  IconQrcode,
  IconX,
  IconMapPin,
  IconCheck,
  IconPrinter,
  IconDownload,
  IconShield,
  IconCopy,
  IconCheck as IconCheckCircle,
} from '@tabler/icons-react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { toast } from 'sonner';

interface QrPosterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrData: any;
  qrLoading: boolean;
}

export const QrPosterModal: React.FC<QrPosterModalProps> = ({
  open,
  onOpenChange,
  qrData,
  qrLoading,
}) => {
  const [qrElement, setQrElement] = useState<HTMLDivElement | null>(null);
  const [qrCode, setQrCode] = useState<QRCodeStyling | null>(null);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate QR code when data is available and modal opens
  useEffect(() => {
    if (!open || !qrData || !qrElement) return;

    qrElement.innerHTML = '';
    setQrGenerated(false);

    const newQrCode = new QRCodeStyling({
      width: 400,
      height: 400,
      data: qrData.url,
      dotsOptions: {
        type: 'rounded',
        color: '#DC2626',
      },
      cornersSquareOptions: {
        type: 'extra-rounded',
        color: '#DC2626',
      },
      cornersDotOptions: {
        type: 'dot',
        color: '#DC2626',
      },
      qrOptions: {
        errorCorrectionLevel: 'H',
      },
      backgroundOptions: {
        color: '#FFFFFF',
      },
    });

    newQrCode.append(qrElement);
    setQrCode(newQrCode);

    const timer = setTimeout(() => {
      setQrGenerated(true);
    }, 150);
    return () => clearTimeout(timer);
  }, [qrData, open, qrElement]);

  const handlePrint = () => {
    if (!qrData) return;

    const printWindow = window.open('', '_blank', 'width=800,height=1100');
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups for this site.');
      return;
    }

    // Create a temporary QR code instance to get the data URL
    const tempQr = new QRCodeStyling({
      width: 400,
      height: 400,
      data: qrData.url,
      dotsOptions: { type: 'rounded', color: '#DC2626' },
      cornersSquareOptions: { type: 'extra-rounded', color: '#DC2626' },
      cornersDotOptions: { type: 'dot', color: '#DC2626' },
      qrOptions: { errorCorrectionLevel: 'H' },
      backgroundOptions: { color: '#FFFFFF' },
    });

    const hiddenDiv = document.createElement('div');
    hiddenDiv.style.position = 'absolute';
    hiddenDiv.style.top = '-9999px';
    hiddenDiv.style.left = '-9999px';
    hiddenDiv.style.width = '400px';
    hiddenDiv.style.height = '400px';
    document.body.appendChild(hiddenDiv);
    tempQr.append(hiddenDiv);

    // Wait for QR code to render
    setTimeout(() => {
      let qrImageSrc = '';
      const canvas = hiddenDiv.querySelector('canvas');
      
      if (canvas) {
        try {
          qrImageSrc = canvas.toDataURL('image/png');
        } catch (e) {
          console.error('Canvas error:', e);
        }
      }
      
      openPrintWindow(qrImageSrc, hiddenDiv, printWindow);
    }, 800);
  };

  const openPrintWindow = (qrImageSrc: string, hiddenDiv: HTMLElement, printWindow: Window) => {
    try {
      document.body.removeChild(hiddenDiv);
    } catch (e) {
      // Already removed
      console.error('Error removing hidden div:', e);
    }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${qrData.branch || 'Attendance'} Poster</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }

              html, body {
                width: 210mm;
                height: 290mm;
                margin: 0;
                padding: 0;
              }

              body {
                background: white;
                font-family: 'Inter', system-ui, sans-serif;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .poster {
                width: 210mm;
                height: 297mm;
                background: white;
                color: #1F2937;
                position: relative;
                display: flex;
                flex-direction: column;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .accent-top {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 12px;
                background: linear-gradient(90deg, #DC2626 0%, #EF4444 100%);
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

.accent-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 250px;
  background: linear-gradient(90deg, #EF4444 0%, #DC2626 100%);
  overflow: hidden;
}

.accent-bottom::before {
  content: "";
  position: absolute;
  top: -80px;            /* move higher = deeper cut */
  left: 50%;
  transform: translateX(-50%);
  width: 110%;           /* wider = smoother curve */
  height: 180px;         /* taller = deeper curve */
  background: white;     /* match your page background */
  border-radius: 50%;
}

              .content {
                flex: 1;
                display: flex;
                flex-direction: column;
                padding: 80px 60px;
                gap: 40px;
                position: relative;
                z-index: 1;
              }

              .header-section {
                text-align: center;
                space-y: 4;
              }

              .icon-badge {
                display: none;
                align-items: center;
                justify-content: center;
                width: 72px;
                height: 72px;
                background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
                border-radius: 18px;
                margin: 0 auto 12px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .icon-badge svg {
                width: 36px;
                height: 36px;
                color: #DC2626;
              }

              .title-main {
                font-family: 'Poppins', sans-serif;
                font-size: 56px;
                font-weight: 800;
                letter-spacing: -0.015em;
                color: #111827;
                margin: 0;
                padding-bottom: 12px;
                line-height: 1.1;
              }

              .title-subtitle {
                font-size: 14px;
                color: #6B7280;
                font-weight: 500;
                letter-spacing: 0.05em;
                text-transform: uppercase;
                margin-top: 6px;
              }

              .divider {
                width: 48px;
                height: 3px;
                background: linear-gradient(90deg, #DC2626, #EF4444);
                margin: 12px auto 0;
                border-radius: 999px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .branch-section {
                display: flex;
                flex-direction: column;
                gap: 16px;
              }

              .branch-card {
                background: white;
                border-radius: 16px;
                padding: 20px;
                text-align: center;
              }

              .branch-name {
                font-family: 'Poppins', sans-serif;
                font-size: 32px;
                font-weight: 700;
                color: #111827;
                margin: 0 0 8px 0;
              }

              .branch-code-badge {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                background: #FFFFFF;
                padding: 8px 16px;
                border-radius: 8px;
                border: 1px solid #D1D5DB;
              }

              .branch-code-label {
                color: #6B7280;
                font-size: 11px;
                font-family: 'Courier New', monospace;
                letter-spacing: 0.12em;
                font-weight: 600;
                text-transform: uppercase;
              }

              .branch-code-value {
                color: #DC2626;
                font-family: 'Courier New', monospace;
                font-size: 13px;
                font-weight: 700;
                letter-spacing: 0.05em;
              }

              .qr-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;
                gap: 12px;
                box-shadow: none !important;
                border: none !important;
              }

              .qr-container {
                background: white;
                padding: 20px;
                border-radius: 16px;
                border: 0px;
                display: inline-flex;
              }

              .qr-image {
                width: 400px;
                height: 400px;
                display: block;
              }

              .security-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
                color: white;
                padding: 8px 20px;
                border-radius: 8px;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .security-dot {
                width: 6px;
                height: 6px;
                background: white;
                border-radius: 50%;
              }

              .instructions {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                width: 100%;
                max-width: 320px;
                margin: 0 auto;
              }

              .instruction-card {
                background: white;
                border: 1px solid #E5E7EB;
                border-radius: 12px;
                padding: 16px;
                text-align: center;
              }

              .instruction-icon {
                color: #DC2626;
                margin-bottom: 8px;
                width: 24px;
                height: 24px;
                margin-left: auto;
                margin-right: auto;
              }

              .instruction-text {
                font-size: 11px;
                font-weight: 700;
                color: #374151;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }

              .footer-section {
                text-align: center;
                padding-top: 12px;
                border-top: 1px solid #E5E7EB;
              }

              .footer-text {
                color: #4B5563;
                font-size: 13px;
                line-height: 1.6;
                margin-bottom: 8px;
              }

              .footer-text strong {
                color: #DC2626;
                font-weight: 600;
              }

              .encryption-info {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
              }

              .encryption-label {
                font-size: 10px;
                color: #9CA3AF;
                font-family: 'Courier New', monospace;
                letter-spacing: 0.15em;
                text-transform: uppercase;
              }

              .encryption-dot {
                width: 6px;
                height: 6px;
                background: #DC2626;
                border-radius: 50%;
              }

              @page {
                size: A4;
                margin: 0;
              }

              @media print {
                html, body {
                  width: 210mm;
                  height: 297mm;
                  margin: 0;
                  padding: 0;
                }
                .poster {
                  box-shadow: none;
                  margin: 0;
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="poster">
              <div class="accent-top"></div>

              <div class="content">
                <!-- Header -->
                <div class="header-section">
                  <div class="icon-badge">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                      <circle cx="12" cy="9" r="2.5" fill="currentColor"/>
                    </svg>
                  </div>
                  <h1 class="title-main">ស្កេនវត្តមាន</h1>
                  <p class="title-subtitle">Attendance System</p>
                  <div class="divider"></div>
                </div>

                <!-- QR Code -->
                <div class="qr-section">
                  <div class="qr-container">
                    ${qrImageSrc ? `<img src="${qrImageSrc}" class="qr-image" alt="QR Code"/>` : '<div class="qr-image" style="background: #f5f5f5;"></div>'}
                  </div>
                </div>

                <!-- Branch Information -->
                <div class="branch-section">
                  <div class="branch-card">
                    <h2 class="branch-name">${qrData.branch}</h2>
                    <div class="branch-code-badge">
                      <span class="branch-code-label">Code</span>
                      <span class="branch-code-value">${qrData.branch_code}</span>
                    </div>
                  </div>
                </div>

              </div>

              <div class="accent-bottom"></div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      }, 500);
    };
  

  const handleDownload = async () => {
    const posterElement = document.getElementById('printable-poster');
    if (posterElement) {
      const toastId = toast.loading('Generating high-resolution image...');
      try {
        // High quality capture
        const dataUrl = await toPng(posterElement, {
          pixelRatio: 4,
          cacheBust: true,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
          }
        });
        
        const link = document.createElement('a');
        link.download = `attendance-poster-${qrData?.branch || 'branch'}.png`;
        link.href = dataUrl;
        link.click();
        toast.success('Poster downloaded successfully', { id: toastId });
      } catch (err) {
        console.error('Download failed:', err);
        toast.error('Failed to generate image. Please try again.', { id: toastId });
      }
    } else {
      toast.error('Poster element not found');
    }
  };

  const handleCopyLink = () => {
    if (qrData?.url) {
      navigator.clipboard.writeText(qrData.url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] w-[95vw] h-auto max-h-[95vh] gap-0 flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden bg-white [&>button]:hidden">
        <style>{`
          @keyframes qr-appear {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
          }
          @media print {
            * { visibility: hidden !important; }
            #printable-poster, #printable-poster * { 
              visibility: visible !important;
              position: relative !important;
            }
            #printable-poster {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 210mm !important;
              height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-shadow: none !important;
            }
            body, html {
              width: 210mm !important;
              height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            @page {
              size: A4;
              margin: 0 !important;
            }
          }
        `}</style>

        {/* Modal Header */}
        <div className="shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl print:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2.5 rounded-xl">
              <IconQrcode className="text-red-600 w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">Attendance Poster</DialogTitle>
              <p className="text-xs text-gray-500">Professional A4 · Optimized for Print</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onOpenChange(false)} 
            className="rounded-full h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <IconX size={18} />
          </Button>
        </div>

        <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1 min-h-0 print:p-0">
          {qrLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-36 h-36">
                  {/* QR Corner Brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-2 border-red-500 rounded-sm opacity-50" />
                  <div className="absolute top-0 left-0 w-4 h-4 m-2 bg-red-600 rounded-[2px] animate-pulse" />
                  
                  <div className="absolute top-0 right-0 w-8 h-8 border-2 border-red-500 rounded-sm opacity-50" />
                  <div className="absolute top-0 right-0 w-4 h-4 m-2 bg-red-600 rounded-[2px] animate-pulse" />
                  
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-2 border-red-500 rounded-sm opacity-50" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 m-2 bg-red-600 rounded-[2px] animate-pulse" />
                  
                  {/* Pulsing Grid */}
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-0.5 p-1">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-[2px] bg-red-500 opacity-0"
                        style={{
                          animation: `qr-appear 0.3s ease-out forwards`,
                          animationDelay: `${Math.floor(Math.random() * 900)}ms`,
                          animationIterationCount: "infinite",
                          animationDuration: `${900 + (i * 37) % 600}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-sm font-semibold text-gray-900">Generating secure payload</p>
                  <p className="text-xs text-gray-500">Building your professional poster...</p>
                </div>
              </div>
            </div>
          ) : qrData ? (
            <div className="flex justify-center items-center py-12 px-6 min-h-full">
              {/* Preview A4 Poster */}
              <div
                id="printable-poster"
                className="w-[210mm] h-[297mm] bg-white text-[#1F2937] shadow-2xl border border-gray-100 overflow-hidden flex flex-col relative shrink-0 print:shadow-none print:border-0"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                {/* Top Accent */}
                <div className="absolute top-0 left-0 right-0 h-[12px] bg-gradient-to-r from-[#DC2626] to-[#EF4444]" />
                
                {/* Content Area */}
                <div className="relative z-10 flex-1 flex flex-col px-16 py-20 gap-10">
                  {/* Header */}
                  <div className="text-center">
                    <h1 className="font-['Poppins'] text-[56px] font-extrabold leading-[1.1] tracking-tight text-[#111827] pb-3 m-0">
                      ស្កេនវត្តមាន
                    </h1>
                    <p className="text-sm font-medium tracking-[0.1em] uppercase text-gray-500 mt-2">
                      Attendance System
                    </p>
                    <div className="w-12 h-1 bg-gradient-to-r from-[#DC2626] to-[#EF4444] mx-auto mt-4 rounded-full" />
                  </div>

                  {/* QR Code Section */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-white p-5 rounded-2xl inline-flex relative">
                      <div ref={setQrElement} className="w-[400px] h-[400px]" />
                      {!qrGenerated && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/95 z-20">
                          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Branch Information */}
                  <div className="flex flex-col gap-4 mt-4">
                    <div className="bg-white rounded-2xl p-6 text-center">
                      <h2 className="font-['Poppins'] text-3xl font-bold text-[#111827] m-0 mb-2">
                        {qrData.branch}
                      </h2>
                      <div className="inline-flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl border border-gray-200">
                        <span className="text-gray-500 text-xs font-mono font-semibold tracking-widest uppercase">
                          Branch Code
                        </span>
                        <span className="text-[#DC2626] text-sm font-mono font-bold tracking-wider">
                          {qrData.branch_code}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-[250px] bg-gradient-to-r from-[#EF4444] to-[#DC2626] overflow-hidden">
                  <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[120%] h-[200px] bg-white rounded-[50%]" />
                </div>
              </div>
            </div>
          ) : null}
        </PerfectScrollbar>

        {/* Action Buttons */}
        <div className="shrink-0 flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-200 bg-white rounded-b-2xl print:hidden">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            className="h-10 px-6 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            Cancel
          </Button>
          {qrData && !qrLoading && (
            <>
              <Button 
                variant="outline"
                onClick={handleCopyLink}
                className="h-10 px-4 gap-2"
              >
                {copied ? (
                  <>
                    <IconCheckCircle size={16} className="text-green-600" /> Copied
                  </>
                ) : (
                  <>
                    <IconCopy size={16} /> Copy Link
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDownload} 
                className="h-10 px-4 gap-2 "
              >
                <IconDownload size={16} /> Download PNG
              </Button>
              <Button 
                onClick={handlePrint} 
                className="h-10 px-6 gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md hover:shadow-lg transition-all"
              >
                <IconPrinter size={16} /> Print Poster (A4)
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};