/**
 * Converts a base64 string to a Uint8Array for the PushManager subscription.
 */
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Subscribes the current user to WebPush.
 */
export async function subscribeUser(vapidPublicKey: string, token: string) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push messaging is not supported');
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });

        // Send the subscription to the backend
        const response = await fetch('/api/employee-app/push-subscriptions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(subscription)
        });

        if (!response.ok) {
            throw new Error('Failed to store subscription on server');
        }

        return true;
    } catch (error) {
        console.error('Subscription failed:', error);
        throw error;
    }
}

/**
 * Unsubscribes the current user from WebPush.
 */
export async function unsubscribeUser(token: string) {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();

            // Notify the backend
            await fetch('/api/employee-app/push-subscriptions', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ endpoint: subscription.endpoint })
            });
        }
        return true;
    } catch (error) {
        console.error('Unsubscription failed:', error);
        throw error;
    }
}

/**
 * Checks if the user is already subscribed.
 */
export async function getSubscriptionStatus() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return false;
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
}
