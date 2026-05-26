/// <reference types="vite/client" />

interface Window {
    Telegram: {
        WebApp: {
            initData: string;
            initDataUnsafe: any;
            ready: () => void;
            expand: () => void;
            close: () => void;
            MainButton: {
                text: string;
                color: string;
                textColor: string;
                isVisible: boolean;
                isActive: boolean;
                show: () => void;
                hide: () => void;
                onClick: (callback: () => void) => void;
                offClick: (callback: () => void) => void;
            };
            BackButton: {
                isVisible: boolean;
                show: () => void;
                hide: () => void;
                onClick: (callback: () => void) => void;
            };
            onEvent: (eventType: string, eventHandler: (...args: any[]) => void) => void;
            sendData: (data: string) => void;
            showAlert: (message: string) => void;
            showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
        };
    };
    Echo: any;
}
