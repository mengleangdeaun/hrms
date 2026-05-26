import React from 'react';
import Cropper, { Area } from 'react-easy-crop';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';
import { Button } from './button';

export type AspectRatioMode = 'landscape' | 'portrait' | 'square' | 'any';

interface CropperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  aspectRatio: AspectRatioMode;
  onAspectRatioChange: (aspect: AspectRatioMode) => void;
  crop: { x: number; y: number };
  zoom: number;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  onApplyCrop: () => void;
  isProcessing: boolean;
}

export function CropperModal({
  open,
  onOpenChange,
  imageUrl,
  aspectRatio,
  onAspectRatioChange,
  crop,
  zoom,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onApplyCrop,
  isProcessing,
}: CropperModalProps) {
  const getAspect = () => {
    switch (aspectRatio) {
      case 'landscape':
        return 16 / 9;
      case 'portrait':
        return 9 / 16;
      case 'square':
        return 1;
      default:
        return undefined;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-6 rounded-2xl gap-4 bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-gray-800">
        <DialogHeader className="flex flex-col gap-1.5">
          <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 tracking-tight">Crop Image</DialogTitle>
          <DialogDescription className="text-xs text-gray-400 dark:text-gray-500">
            Adjust the crop area and aspect ratio for your announcement's featured image.
          </DialogDescription>
        </DialogHeader>

        {/* Cropper Container */}
        {imageUrl ? (
          <div className="relative w-full h-[320px] bg-gray-950 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={getAspect()}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropComplete}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-[320px] bg-gray-100 dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
            <span className="text-sm text-gray-400">No image loaded</span>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-4">
          {/* Zoom Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Aspect Ratio Selector */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Aspect Ratio
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['landscape', 'portrait', 'square'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onAspectRatioChange(mode)}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border capitalize transition-all duration-200 ${
                    aspectRatio === mode
                      ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                      : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-primary/50'
                  }`}
                >
                  {mode === 'landscape' ? 'Landscape (16:9)' : mode === 'portrait' ? 'Portrait (9:16)' : 'Square (1:1)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-3 mt-2 border-t border-gray-100 dark:border-gray-800/50 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="px-5 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 bg-white dark:bg-black hover:bg-gray-50 font-bold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onApplyCrop}
            isLoading={isProcessing}
            className="px-6 font-black bg-primary hover:bg-primary/90 text-white"
          >
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
