import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client'
import { Loader } from './components/ui/Loader';
import App from './App';

// Perfect Scrollbar
import 'react-perfect-scrollbar/dist/css/styles.css';

// Tailwind css
import './tailwind.css';

// i18n (needs to be bundled)
import './i18n';

// Router
import { RouterProvider } from 'react-router-dom';
import router from './router/index';

import { Provider } from 'react-redux';
import store from './store/index';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

// Initialize Echo for Real-time WebSockets
import '../echo';

// Global listener for Job Card updates
window.Echo.channel('job-cards')
    .listen('.JobCardUpdated', (e: any) => {
        console.log('Real-time sync: Job Card Updated', e.jobCardId);
        queryClient.invalidateQueries({ queryKey: ['job-cards'] });
        queryClient.invalidateQueries({ queryKey: ['job-card', e.jobCardId] });
    });

// Global listener for Sales Order updates
window.Echo.channel('sales-orders')
    .listen('.SalesOrderUpdated', (e: any) => {
        console.log('Real-time sync: Sales Order Updated', e.salesOrder?.id);
        queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    });


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <Provider store={store}>
        <QueryClientProvider client={queryClient}>
            <App>
                <Suspense fallback={<Loader fullPage />}>
                    <RouterProvider router={router} />
                </Suspense>
            </App>
        </QueryClientProvider>
    </Provider>
);

// Register Service Worker for PWA & Push Notifications
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}


