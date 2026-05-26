import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { isEmployeeAppRoute, isTmaRoute } from '../utils/routeHelper';

export interface User {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    is_active: boolean;
    roles: Array<{ id: number; name: string; slug: string }>;
    permissions: string[];
    branches: Array<{ id: number; name: string; pivot?: { is_primary: boolean } }>;
    employee: {
        id: number;
        branch_id: number;
    } | null;
}

export const useAuth = () => {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const isSpecialRoute = isEmployeeAppRoute(pathname) || isTmaRoute(pathname);

    const getAuthToken = () => {
        const token = localStorage.getItem('auth_token');
        if (!token || token === 'null' || token === 'undefined') return null;
        return token.trim();
    };

    const hasAuthToken = typeof window !== 'undefined' ? !!getAuthToken() : false;

    const { data: user, isLoading, error, refetch } = useQuery<User>({
        queryKey: ['user'],
        queryFn: async () => {
            const response = await api.get('/user');
            // Support both wrapped and unwrapped responses
            return response.data?.data || response.data;
        },
        enabled: !isSpecialRoute && hasAuthToken,
        retry: false,
        staleTime: Infinity,
    });

    const hasPermission = useCallback((permission: string) => {
        if (!user) return false;
        // Super admin has all permissions
        if (user.roles.some(role => role.slug === 'super-admin')) return true;
        return user.permissions.includes(permission);
    }, [user]);

    const hasRole = useCallback((role: string) => {
        if (!user) return false;
        return user.roles.some(r => r.slug === role);
    }, [user]);

    return useMemo(() => ({
        user,
        isLoading: !isSpecialRoute && isLoading,
        error,
        refetch,
        hasPermission,
        hasRole,
        isAuthenticated: !!user,
    }), [user, isLoading, isSpecialRoute, error, refetch, hasPermission, hasRole]);
};
