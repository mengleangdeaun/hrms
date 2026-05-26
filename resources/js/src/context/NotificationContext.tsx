import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { toast } from 'sonner';
import { IconBell } from '@tabler/icons-react';
import { pwaFetch } from '@/lib/pwa-fetch';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    data: any;
    read_at: string | null;
    created_at: string;
}

declare interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    refresh: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteAllNotifications: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [echoInstance, setEchoInstance] = useState<any | null>(null);

    const token = localStorage.getItem('employee_auth_token');

    const refresh = useCallback(async () => {
        // Pull token directly from localStorage during every call for reactivity
        const currentToken = localStorage.getItem('employee_auth_token');
        if (!currentToken) {
            setLoading(false);
            return;
        }

        try {
            // 1. Fetch unread count for the count badge
            const countRes = await pwaFetch('/api/employee-app/notifications/unread-count?category=pwa', {
                headers: { Accept: 'application/json', Authorization: `Bearer ${currentToken}` },
            });
            if (countRes.ok) {
                const countData = await countRes.json();
                setUnreadCount(countData.count || 0);
            }

            // 2. Fetch notifications list
            const listRes = await pwaFetch('/api/employee-app/notifications?category=pwa&limit=50', {
                headers: { Accept: 'application/json', Authorization: `Bearer ${currentToken}` },
            });
            if (listRes.ok) {
                const listData = await listRes.json();
                const rawList = Array.isArray(listData) ? listData : listData.data || [];
                
                // Deduplicate by ID just in case the backend returns duplicates
                const uniqueNotifs = Array.from(
                    new Map(rawList.map((n: any) => [n.id, n])).values()
                ) as Notification[];
                
                setNotifications(uniqueNotifs);
            }
        } catch (err) {
            console.error('Failed to refresh notifications:', err);
        } finally {
            setLoading(false);
        }
    }, []); // Removed token dependency since we pull it inside

    const markAsRead = async (id: string) => {
        const currentToken = localStorage.getItem('employee_auth_token');
        if (!currentToken) return;
        try {
            const res = await pwaFetch(`/api/employee-app/notifications/${id}/read`, {
                method: 'POST',
                headers: { Accept: 'application/json', Authorization: `Bearer ${currentToken}` },
            });
            if (res.ok) {
                setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (err) {
            toast.error('Failed to mark as read');
        }
    };

    const markAllAsRead = async () => {
        const currentToken = localStorage.getItem('employee_auth_token');
        if (!currentToken) return;
        try {
            const res = await pwaFetch('/api/employee-app/notifications/mark-all-read', {
                method: 'POST',
                headers: { Accept: 'application/json', Authorization: `Bearer ${currentToken}` },
            });
            if (res.ok) {
                setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
                setUnreadCount(0);
                toast.success('All marked as read');
            }
        } catch (err) {
            toast.error('Failed to mark all as read');
        }
    };

    const deleteNotification = async (id: string) => {
        const currentToken = localStorage.getItem('employee_auth_token');
        if (!currentToken) return;
        try {
            const res = await pwaFetch(`/api/employee-app/notifications/${id}?category=pwa`, {
                method: 'DELETE',
                headers: { Accept: 'application/json', Authorization: `Bearer ${currentToken}` },
            });
            if (res.ok) {
                setNotifications((prev) => prev.filter((n) => n.id !== id));
                setUnreadCount((prev) => {
                    const notif = notifications.find((n) => n.id === id);
                    return !notif?.read_at && prev > 0 ? prev - 1 : prev;
                });
                toast.success('Notification deleted');
            }
        } catch (err) {
            toast.error('Failed to delete notification');
        }
    };

    const deleteAllNotifications = async () => {
        const currentToken = localStorage.getItem('employee_auth_token');
        if (!currentToken) return;
        try {
            const res = await pwaFetch('/api/employee-app/notifications?category=pwa', {
                method: 'DELETE',
                headers: { Accept: 'application/json', Authorization: `Bearer ${currentToken}` },
            });
            if (res.ok) {
                setNotifications([]);
                setUnreadCount(0);
                toast.success('All notifications deleted');
            }
        } catch (err) {
            toast.error('Failed to delete notifications');
        }
    };

    // Initialize Real-time (Echo)
    useEffect(() => {
        const currentToken = localStorage.getItem('employee_auth_token');
        if (!currentToken || echoInstance) return;

        const initEcho = async () => {
            try {
                const res = await pwaFetch('/api/employee-app/me', {
                    headers: { Authorization: `Bearer ${currentToken}`, Accept: 'application/json' },
                });
                if (res.ok) {
                    const data = await res.json();
                    const employeeId = data.id;

                    if (employeeId) {
                        const echo = new Echo({
                            broadcaster: 'reverb',
                            key: import.meta.env.VITE_REVERB_APP_KEY,
                            wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
                            wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
                            wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
                            forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
                            enabledTransports: ['ws', 'wss'],
                            authEndpoint: '/api/broadcasting/auth',
                            auth: {
                                headers: {
                                    Authorization: `Bearer ${currentToken}`,
                                    Accept: 'application/json',
                                },
                            },
                        });

                        const channel = `App.Models.HR.Employee.${employeeId}`;

                        echo.private(channel).notification((notification: any) => {
                            console.log('🔔 RECEIVED PWA EVENT:', notification);

                            const payload = notification.data || notification;

                            // Show Toast
                            toast(payload.title || 'New Notification', {
                                description: payload.message || '',
                                icon: <IconBell className="text-primary" size={18} />,
                            });

                            // HEARTBEAT SYNC: Wait 500ms for DB to finish commit before refreshing state
                            setTimeout(() => {
                                refresh();
                                window.dispatchEvent(new Event('pwa-new-notification'));
                            }, 500);
                        });

                        setEchoInstance(echo);
                    }
                }
            } catch (err) {
                console.error('Echo init error:', err);
            }
        };

        initEcho();

        return () => {
            if (echoInstance) {
                echoInstance.disconnect();
            }
        };
    }, [token, refresh]);

    // Initial fetch
    useEffect(() => {
        refresh();

        const handlePwaRefresh = () => refresh();
        window.addEventListener('pwa-refresh', handlePwaRefresh);
        return () => window.removeEventListener('pwa-refresh', handlePwaRefresh);
    }, [refresh]);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead, deleteAllNotifications, deleteNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
