import { toast, ExternalToast } from 'sonner';

/**
 * PWA Native-style Toast Utility
 * Wraps sonner with PWA specific behaviors and icons.
 */
export const pwaToast = {
    success: (message: string | React.ReactNode, options?: string | ExternalToast) => {
        const toastOptions = typeof options === 'string' ? { description: options } : options;
        return toast.success(message, {
            duration: 3000,
            ...toastOptions
        });
    },
    error: (message: string | React.ReactNode, options?: string | ExternalToast) => {
        const toastOptions = typeof options === 'string' ? { description: options } : options;
        return toast.error(message, {
            duration: 4000,
            ...toastOptions
        });
    },
    info: (message: string | React.ReactNode, options?: string | ExternalToast) => {
        const toastOptions = typeof options === 'string' ? { description: options } : options;
        return toast.info(message, {
            duration: 3000,
            ...toastOptions
        });
    },
    warning: (message: string | React.ReactNode, options?: string | ExternalToast) => {
        const toastOptions = typeof options === 'string' ? { description: options } : options;
        return toast.warning(message, {
            duration: 4000,
            ...toastOptions
        });
    },
    loading: (message: string | React.ReactNode, options?: string | ExternalToast) => {
        const toastOptions = typeof options === 'string' ? { description: options } : options;
        return toast.loading(message, {
            ...toastOptions
        });
    },
    dismiss: (id?: string | number) => {
        return toast.dismiss(id);
    },
};
