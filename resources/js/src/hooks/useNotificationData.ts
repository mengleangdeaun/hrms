import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export const useNotifications = () => {
    const hasToken = !!localStorage.getItem('employee_auth_token');
    return useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const { data } = await api.get('/employee-app/notifications?category=crm');
            return Array.isArray(data) ? data : (data.data || []);
        },
        enabled: hasToken,
    });
};

export const useUnreadNotificationCount = () => {
    const hasToken = !!localStorage.getItem('employee_auth_token');
    return useQuery({
        queryKey: ['notifications_unread_count'],
        queryFn: async () => {
            const { data } = await api.get('/employee-app/notifications/unread-count?category=crm');
            return data.unread_count || 0;
        },
        enabled: hasToken,
    });
};

export const useMarkNotificationRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.post(`/employee-app/notifications/${id}/read`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications_unread_count'] });
        },
    });
};

export const useMarkAllNotificationsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const { data } = await api.post('/employee-app/notifications/mark-all-read?category=crm');
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications_unread_count'] });
        },
    });
};

export const useDeleteNotification = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete(`/employee-app/notifications/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications_unread_count'] });
        },
    });
};

export const useDeleteAllNotifications = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const { data } = await api.delete('/employee-app/notifications?category=crm');
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications_unread_count'] });
        },
    });
};
