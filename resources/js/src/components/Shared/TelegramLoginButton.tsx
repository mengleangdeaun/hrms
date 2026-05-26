import React, { useEffect, useRef, memo } from 'react';

interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
}

interface Props {
    botName: string;
    onAuth: (user: TelegramUser) => void;
    buttonSize?: 'large' | 'medium' | 'small';
    cornerRadius?: number;
    requestAccess?: boolean;
    usePic?: boolean;
    className?: string;
}

declare global {
    interface Window {
        onTelegramAuth: (user: TelegramUser) => void;
    }
}

const TelegramLoginButtonComponent: React.FC<Props> = ({
    botName,
    onAuth,
    buttonSize = 'large',
    cornerRadius,
    requestAccess = true,
    usePic = true,
    className
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        window.onTelegramAuth = (user: TelegramUser) => {
            onAuth(user);
        };

        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.setAttribute('data-telegram-login', botName);
        script.setAttribute('data-size', buttonSize);
        if (cornerRadius !== undefined) {
            script.setAttribute('data-radius', cornerRadius.toString());
        }
        script.setAttribute('data-onauth', 'onTelegramAuth(user)');
        script.setAttribute('data-request-access', requestAccess ? 'write' : '');
        if (!usePic) {
            script.setAttribute('data-userpic', 'false');
        }
        script.async = true;

        if (containerRef.current) {
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(script);
        }

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [botName, onAuth, buttonSize, cornerRadius, requestAccess, usePic]);

    return <div ref={containerRef} className={className} />;
};

const TelegramLoginButton = memo(TelegramLoginButtonComponent);
export default TelegramLoginButton;
