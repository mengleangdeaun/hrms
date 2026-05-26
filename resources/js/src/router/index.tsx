import { createBrowserRouter } from 'react-router-dom';
import BlankLayout from '../components/Layouts/BlankLayout';
import DefaultLayout from '../components/Layouts/DefaultLayout';
import MobileLayout from '../components/Layouts/MobileLayout';
import Error from '../components/Error';
import { routes } from './routes';
import AppLayout from '../components/AppLayout';

import ProtectedRoute from '../components/AccessControl/ProtectedRoute';
import { isEmployeeAppRoute, isTmaRoute } from '../utils/routeHelper';
import EmployeePwaError from '../pages/EmployeeApp/Error';

// Dynamic Basename detection for subdirectory support (e.g. Laragon/Apache)
const getBasename = () => {
    const path = window.location.pathname;
    if (path.includes('/s_cool_crm/public')) return '/s_cool_crm/public';
    return '/';
};

const basename = getBasename();

const finalRoutes = routes.map((route: any) => {
    return {
        ...route,
        element: (
            <ProtectedRoute permission={route.permission}>
                {route.layout === 'blank' ? (
                    <BlankLayout>{route.element}</BlankLayout>
                ) : route.layout === 'mobile' ? (
                    <MobileLayout>{route.element}</MobileLayout>
                ) : (
                    <DefaultLayout>{route.element}</DefaultLayout>
                )}
            </ProtectedRoute>
        ),
    };
});

// Context-aware error boundary for PWA/Admin distinction
const GlobalErrorBoundary = () => {
    const pathname = window.location.pathname;
    const isPwa = isEmployeeAppRoute(pathname) || pathname.includes('/attendance/');
    
    if (isPwa) {
        return <BlankLayout><EmployeePwaError /></BlankLayout>;
    }
    
    return <BlankLayout><Error /></BlankLayout>;
};

// A single, top-level route to provide the global error boundary
const router = createBrowserRouter([
    {
        element: <AppLayout />,
        errorElement: <GlobalErrorBoundary />,
        children: finalRoutes
    }
], {
    basename: basename === '/' ? undefined : basename
});

export default router;
