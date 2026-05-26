import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { toast } from 'sonner';

// @ts-ignore
window.Pusher = Pusher;

export const useTmaRealtime = (customerId?: number) => {
    const queryClient = useQueryClient();
    const echoRef = useRef<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('tma_token');
        if (token && customerId) {
            if (echoRef.current) echoRef.current.disconnect();

            echoRef.current = new Echo({
                broadcaster: 'reverb',
                key: import.meta.env.VITE_REVERB_APP_KEY,
                wsHost: import.meta.env.VITE_REVERB_HOST,
                wsPort: import.meta.env.VITE_REVERB_PORT,
                wssPort: import.meta.env.VITE_REVERB_PORT,
                forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
                enabledTransports: ['ws', 'wss'],
                authEndpoint: '/api/broadcasting/auth',
                auth: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            });

            echoRef.current.private(`customer.${customerId}`)
                .listen('.job.status.updated', (e: any) => {
                    toast.info(`Service Status Updated: ${e.jobCard?.status || 'Active'}`, {
                        position: 'top-center',
                        icon: '🚀'
                    });
                    // Refresh all TMA data
                    queryClient.invalidateQueries({ queryKey: ['tma'] });
                });
        }

        return () => {
            if (echoRef.current) {
                echoRef.current.disconnect();
                echoRef.current = null;
            }
        };
    }, [customerId, queryClient]);
};
