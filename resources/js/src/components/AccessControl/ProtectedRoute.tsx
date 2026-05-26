import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isEmployeeAppRoute, isTmaRoute } from '../../utils/routeHelper';
import AccessDenied from '../AccessDenied';

interface ProtectedRouteProps {
    children: React.ReactNode;
    permission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, permission }) => {
    const { user, hasPermission, isLoading } = useAuth();
    const location = useLocation();

    // While checking auth status
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white dark:bg-black">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    const pathname = location.pathname;
    const isAuthRoute = pathname.includes('/auth/');
    const isPublicRoute = pathname === '/' || pathname.includes('/public/') || pathname.includes('/scan/');
    const isEmployeeApp = isEmployeeAppRoute(pathname);
    const isEmployeeLogin = pathname.includes('/employee/login');
    const isTma = isTmaRoute(pathname);
    const isTmaAuth = pathname.includes('/crm/tma/auth');

    // Check for sessions
    const hasEmployeeSession = !!localStorage.getItem('employee_auth_token');
    const hasTmaSession = !!localStorage.getItem('tma_token');

    if (!user && !isAuthRoute && !isPublicRoute && !isTmaAuth) {
        // If it's an employee app route and we have an employee session, we're good
        if (isEmployeeApp && (hasEmployeeSession || isEmployeeLogin)) {
            return <>{children}</>;
        }

        // If it's a TMA route and we have a TMA session, we're good
        if (isTma && (hasTmaSession || isTmaAuth)) {
            return <>{children}</>;
        }
        
        // Otherwise, redirect to login
        // If they are on an employee app route but no session, go to employee login
        if (isEmployeeApp) {
            return <Navigate to="/employee/login" replace />;
        }

        // If they are on a TMA route but no session, go to TMA auth
        if (isTma) {
            return <Navigate to="/crm/tma/auth" replace />;
        }

        // Default to admin login for any other non-public route
        return <Navigate to="/auth/login" replace />;
    }

    // If permission is required but user doesn't have it
    if (permission && !hasPermission(permission)) {
        return <AccessDenied />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
