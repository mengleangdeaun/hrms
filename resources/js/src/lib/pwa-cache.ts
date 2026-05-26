/**
 * PWA Hydration Cache
 * A lightweight singleton to persist state between page navigations
 * to provide a zero-latency "Stale-While-Revalidate" feel.
 */

class PwaCache {
    private cache: Record<string, any> = {};
    private STORAGE_KEY = 'pwa_hydration_cache';

    constructor() {
        this.hydrate();
    }

    private hydrate() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.cache = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('PWA Cache hydration failed', e);
        }
    }

    private persist() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cache));
        } catch (e) {
            console.warn('PWA Cache persistence failed', e);
        }
    }

    set(key: string, data: any) {
        this.cache[key] = {
            data,
            timestamp: Date.now()
        };
        this.persist();
    }

    get(key: string) {
        return this.cache[key]?.data || null;
    }

    getTimestamp(key: string) {
        return this.cache[key]?.timestamp || null;
    }

    clear(key?: string) {
        if (key) {
            delete this.cache[key];
        } else {
            this.cache = {};
        }
        this.persist();
    }

    isFresh(key: string, ttlMs: number = 300000) {
        const ts = this.getTimestamp(key);
        if (!ts) return false;
        return (Date.now() - ts) < ttlMs;
    }
}

export const pwaCache = new PwaCache();
