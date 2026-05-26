import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { IconX } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
    showClose?: boolean;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
    isOpen,
    onClose,
    title,
    children,
    className,
    showClose = true
}) => {
    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay 
                    className={cn(
                        "fixed inset-0 bg-black/50 z-100",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200"
                    )} 
                />
                <Dialog.Content 
                    className={cn(
                        "fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[24px] z-101 flex flex-col max-h-[90vh] shadow-2xl overflow-hidden",
                        "md:max-w-xl md:left-1/2 md:-translate-x-1/2",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full duration-300 ease-out",
                        className
                    )}
                >
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto my-3 shrink-0" />

                    <div className="flex items-center justify-between px-6 pb-2">
                        {title && (
                            <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-white truncate">
                                {title}
                            </Dialog.Title>
                        )}
                        {showClose && (
                            <Dialog.Close asChild>
                                <button className="p-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <IconX className="w-5 h-5 text-slate-500" />
                                </button>
                            </Dialog.Close>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 pb-8 focus:outline-none">
                        {children}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default BottomSheet;