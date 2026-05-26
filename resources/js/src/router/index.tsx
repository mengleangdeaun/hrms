import { createBrowserRouter } from 'react-router-dom';
import BlankLayout from '../components/Layouts/BlankLayout';
import DefaultLayout from '../components/Layouts/DefaultLayout';
import MobileLayout from '../components/Layouts/MobileLayout';
import Error from '../components/Error';
import AppLayout from '../components/AppLayout';

import ProtectedRoute from '../components/AccessControl/ProtectedRoute';
import { isEmployeeAppRoute } from '../utils/routeHelper';
import EmployeePwaError from '../pages/EmployeeApp/Error';

import { employeeRoutes } from './employeeRoutes';
import { adminRoutes } from './adminRoutes';
import { superAdminRoutes } from './superAdminRoutes';

// Dynamic Basename detection for subdirectory support (e.g. Laragon/Apache)
const getBasename = () => {
    const path = window.location.pathname;
    if (path.includes('/s_cool_crm/public')) return '/s_cool_crm/public';
    return '/';
};

const basename = getBasename();
const pathname = window.location.pathname;
const cleanPathname = basename !== '/' ? pathname.replace(basename, '') : pathname;

// Choose routes array depending on URL path prefix to minimize bundle evaluation and keep them clean
const isEmployee = cleanPathname.includes('/employee') || cleanPathname.includes('/attendance');
const isSuperAdmin = cleanPathname.includes('/settings/') || cleanPathname.includes('/access-control/');

const chosenRoutes = isEmployee ? employeeRoutes : (isSuperAdmin ? superAdminRoutes : adminRoutes);

const finalRoutes = chosenRoutes.map((route: any) => {
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
    const currentPath = window.location.pathname;
    const isPwa = isEmployeeAppRoute(currentPath) || currentPath.includes('/attendance/');
    
    if (isPwa) {
        return <BlankLayout><EmployeePwaError /></BlankLayout>;
    }
    
    return <BlankLayout><Error /></BlankLayout>;
};

// Create router using the segregated configuration
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
export { chosenRoutes };
