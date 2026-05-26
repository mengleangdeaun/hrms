import imageCompression from 'browser-image-compression';

export interface ValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[]; // e.g. ['image/jpeg', 'application/pdf']
  preventEmpty?: boolean;
}

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  initialQuality?: number;
}

/**
 * Formats bytes to KB, MB, GB, etc.
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Checks if a file is an image
 */
export const isImage = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Checks if a file is a PDF
 */
export const isPDF = (file: File): boolean => {
  return file.type === 'application/pdf';
};

/**
 * Checks if an extension is an image
 */
export const isImageExt = (ext: string | undefined): boolean => {
  return !!ext && ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif', 'bmp', 'tiff'].includes(ext.toLowerCase());
};

/**
 * Checks if an extension is a PDF
 */
export const isPDFExt = (ext: string | undefined): boolean => {
  return !!ext && ext.toLowerCase() === 'pdf';
};

/**
 * Checks if a file is an SVG
 */
export const isSVG = (file: File): boolean => {
  return file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
};

/**
 * Validates a file against size, type, and empty constraints.
 */
export const validateFile = (
  file: File,
  options: ValidationOptions = {}
): { valid: boolean; error?: string } => {
  if (options.preventEmpty && file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  if (options.maxSize && file.size > options.maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${formatBytes(options.maxSize)}`,
    };
  }

  if (options.allowedTypes && options.allowedTypes.length > 0) {
    const isAllowed = options.allowedTypes.some((type) => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', ''));
      }
      return file.type === type;
    });

    if (!isAllowed) {
      return { valid: false, error: 'File type not allowed' };
    }
  }

  return { valid: true };
};

/**
 * Compresses an image file using hybrid settings.
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  if (!isImage(file) || isSVG(file)) return file;

  const defaultOptions: CompressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.8,
    ...options,
  };

  try {
    const compressedBlob = await imageCompression(file, defaultOptions);
    return new File([compressedBlob], file.name, {
      type: file.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Image compression failed:', error);
    return file; // Return original if compression fails
  }
};

/**
 * Best-effort check to see if a file is corrupted by attempting to read it.
 */
export const isCorrupted = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(false);
    reader.onerror = () => resolve(true);

    // Read just a small chunk to check readability
    reader.readAsArrayBuffer(file.slice(0, 1024));
  });
};
