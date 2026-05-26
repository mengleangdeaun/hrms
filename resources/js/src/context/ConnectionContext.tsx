import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { offlineDB } from '@/lib/offline-db';
import { playSuccessSound } from '@/lib/audio';
import { pwaFetch } from '@/lib/pwa-fetch';

interface ConnectionContextType {
    isOnline: boolean;
    syncOfflineActivities: () => Promise<void>;
}

const ConnectionContext = createContext<ConnectionContextType>({ 
    isOnline: true,
    syncOfflineActivities: async () => {}
});

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);

    const syncOfflineActivities = async () => {
        const token = localStorage.getItem('employee_auth_token');
        if (!navigator.onLine || !token || isSyncing) return;

        setIsSyncing(true);
        try {
            const pending = await offlineDB.getPendingActivities();
            if (pending.length === 0) {
                setIsSyncing(false);
                return;
            }

            console.log(`🔄 Syncing ${pending.length} offline activities...`);
            
            for (const activity of pending) {
                try {
                    const form = new FormData();
                    form.append('activity_type', activity.activity_type);
                    activity.attachments.forEach((file, index) => {
                        form.append('attachments[]', file, `offline_img_${index}.jpg`);
                    });
                    if (activity.comment) form.append('comment', activity.comment);
                    if (activity.latitude) form.append('latitude', activity.latitude);
                    if (activity.longitude) form.append('longitude', activity.longitude);
                    if (activity.location_name) form.append('location_name', activity.location_name);
                    
                    // Historical timestamps
                    form.append('activity_date', activity.activity_date);
                    form.append('submitted_at', activity.submitted_at);

                    const res = await pwaFetch('/api/employee-app/activities', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: form,
                    });

                    if (res.ok) {
                        await offlineDB.deleteActivity(activity.id!);
                        console.log(`✅ Activity ${activity.id} synced successfully`);
                    } else {
                        console.error(`❌ Activity ${activity.id} sync failed with status ${res.status}`);
                    }
                } catch (itemError) {
                    console.error(`❌ Error syncing activity ${activity.id}:`, itemError);
                }
            }

            playSuccessSound();
            toast.success('Sync Complete', {
                description: `${pending.length} activities have been synchronized with the server.`,
                duration: 5000
            });

            // Notify pages to refresh
            window.dispatchEvent(new CustomEvent('activity-synced'));
        } catch (error) {
            console.error('❌ Sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast.success('Connection restored', {
                description: 'You are back online. Starting synchronization...',
                duration: 4000
            });
            syncOfflineActivities();
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.warning('Offline Mode', {
                description: 'Your connection was lost. Activities will be saved locally.',
                duration: 5000
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial sync check if online
        if (navigator.onLine) {
            syncOfflineActivities();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []); // No more token dependency, we fetch it inside sync

    return (
        <ConnectionContext.Provider value={{ isOnline, syncOfflineActivities }}>
            {children}
        </ConnectionContext.Provider>
    );
};

export const useConnection = () => useContext(ConnectionContext);
