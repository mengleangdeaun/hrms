import Echo from 'laravel-echo';

import Pusher from 'pusher-js';
window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
    wsPort: import.meta.env.VITE_REVERB_PORT || 80,
    wssPort: import.meta.env.VITE_REVERB_PORT || 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME === 'https') || window.location.protocol === 'https:',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: window.location.pathname.includes('/employee') ? '/api/broadcasting/auth' : '/broadcasting/auth',
    auth: {
        headers: {
            Authorization: (function() {
                const token = window.location.pathname.includes('/employee') 
                    ? (localStorage.getItem('employee_auth_token') || localStorage.getItem('token'))
                    : localStorage.getItem('token');
                return token ? `Bearer ${token}` : undefined;
            })(),
            Accept: 'application/json',
        },
    },
});
