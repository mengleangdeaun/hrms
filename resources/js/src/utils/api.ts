import axios from 'axios';
import nprogress from 'nprogress';

nprogress.configure({ showSpinner: false });

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    }
});

api.interceptors.request.use(config => {
    // @ts-ignore
    if (config.showProgress !== false) {
        nprogress.start();
    }

    // Automatically attach TMA Token IF it's a TMA portal request
    const tmaToken = localStorage.getItem('tma_token');
    if (tmaToken && config.url?.includes('/tma/')) {
        config.headers.Authorization = `Bearer ${tmaToken}`;
    }

    // Attach regular Auth Token if available
    const authToken = localStorage.getItem('auth_token');
    if (authToken && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }

    return config;
});

api.interceptors.response.use(
    response => {
        // @ts-ignore
        if (response.config.showProgress !== false) {
            nprogress.done();
        }
        return response;
    },
    error => {
        // @ts-ignore
        if (error.config?.showProgress !== false) {
            nprogress.done();
        }

        // Global 401 handling
        if (error.response?.status === 401) {
            const isAuthPath = window.location.pathname.includes('/login') || 
                               window.location.pathname.includes('/verify-2fa') ||
                               error.config?.url?.includes('/login');

            if (!isAuthPath) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('employee_auth_token');
                localStorage.removeItem('user_info');
            }
        }

        return Promise.reject(error);
    }
);

export default api;
