import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';

// Precache all compiled Vite assets (CSS, JS, Fonts, Images)
// self.__WB_MANIFEST is injected by vite-plugin-pwa during the build process
precacheAndRoute(self.__WB_MANIFEST || []);

// ============================================================================
// APP SHELL ARCHITECTURE (OFFLINE FALLBACK)
// ============================================================================
// Intercept all navigation requests (e.g., when a user types /employee/dashboard).
// Try to fetch from the network first to get the latest App Shell.
// If offline, serve the generic App Shell from the cache.
registerRoute(
    new NavigationRoute(async ({ request }) => {
        try {
            // Attempt to fetch the latest HTML wrapper from the server
            const networkResponse = await fetch(request);
            
            // If successful, save this generic HTML wrapper into our app-shell cache
            const cache = await caches.open('app-shell-cache');
            await cache.put('/__app_shell', networkResponse.clone());
            
            return networkResponse;
        } catch (error) {
            // Network failed (Offline or Server Down). 
            // Return the cached App Shell wrapper so the React app can boot.
            const cache = await caches.open('app-shell-cache');
            const cachedResponse = await cache.match('/__app_shell');
            
            if (cachedResponse) {
                return cachedResponse;
            }
            
            // If we have nothing in the cache, throw the error (browser will show offline dinosaur)
            throw error;
        }
    })
);

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================
self.addEventListener('push', function (event) {
    if (!event.data) return;

    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        data = { title: 'New Notification', body: event.data.text() };
    }

    const options = {
        body: data.body || '',
        icon: data.icon || '/favicon.svg',
        badge: data.badge || '/favicon.svg',
        data: data.url || '/',
        vibrate: [100, 50, 100],
        actions: data.actions || []
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'SCCG ERP', options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const url = event.notification.data || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
