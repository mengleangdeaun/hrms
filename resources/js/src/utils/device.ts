/**
 * Device Identification Utility for PWA Device Binding.
 * Generates a persistent UUID and stores it in LocalStorage.
 */

const DEVICE_ID_KEY = 'pwa_device_uuid';

/**
 * Get the existing Device ID or generate a new one if missing.
 */
export function getDeviceId(): string {
    // 1. Try LocalStorage
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    
    // 2. Fallback to Cookie (more persistent across PWA/Safari boundaries on some OSs)
    if (!deviceId) {
        deviceId = getCookie(DEVICE_ID_KEY);
    }
    
    if (!deviceId) {
        deviceId = generateUUID();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
        setCookie(DEVICE_ID_KEY, deviceId, 365 * 2); // 2 years
    } else {
        // Ensure both are in sync
        if (!localStorage.getItem(DEVICE_ID_KEY)) localStorage.setItem(DEVICE_ID_KEY, deviceId);
        if (!getCookie(DEVICE_ID_KEY)) setCookie(DEVICE_ID_KEY, deviceId, 365 * 2);
    }
    
    return deviceId;
}

/**
 * Cookie Helpers
 */
function setCookie(name: string, value: string, days: number) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "; expires=" + date.toUTCString();
    document.cookie = name + "=" + (value || "")  + expires + "; path=/; SameSite=Lax";
}

function getCookie(name: string) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

/**
 * Generate a cryptographically secure UUID v4.
 */
function generateUUID(): string {
    // Check if crypto.randomUUID is available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Checks if the device has been bound to an account.
 * (This is just a local indicator, backend check is final).
 */
export function isDeviceRegistered(): boolean {
    return !!localStorage.getItem('device_registered_at');
}

export function markDeviceAsRegistered() {
    localStorage.setItem('device_registered_at', new Date().toISOString());
}
