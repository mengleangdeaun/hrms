
/**
 * Detects the application base URL for API requests.
 * This ensures fetches work correctly when hosted in subdirectories (e.g. Laragon/Apache).
 */
export const getApiBase = () => {
    const path = window.location.pathname;
    const markers = ['/employee', '/attendance', '/crm/tma', '/auth', '/public'];
    
    let base = '/';
    for (const marker of markers) {
        if (path.includes(marker)) {
            base = path.split(marker)[0];
            break;
        }
    }

    // Normalize to ensure it doesn't end with a slash unless it's just '/'
    return base === '/' ? '' : base.replace(/\/$/, '');
};

/**
 * Enhanced fetch wrapper that automatically handles subdirectory base paths.
 */
export const pwaFetch = async (url: string, options: RequestInit = {}) => {
    const apiBase = getApiBase();
    
    // If the URL starts with /api/, we prefix it with the detected base
    const normalizedUrl = url.startsWith('/api/') ? `${apiBase}${url}` : url;
    
    return fetch(normalizedUrl, options);
};
