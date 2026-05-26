import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = '/api/employee-app';

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('employee_auth_token');
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const api = axios.create({
    baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
    config.headers = { ...config.headers, ...getAuthHeaders() } as any;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('employee_auth_token');
            window.location.href = '/employee/login';
        }
        return Promise.reject(error);
    }
);

/**
 * Hook for managing Day Off data in the Employee App.
 */
export function useEmployeeDayOffData() {
    const queryClient = useQueryClient();

    // Fetch current day off info
    const dayOffInfo = useQuery({
        queryKey: ['employee', 'day-off-info'],
        queryFn: async () => {
            const { data } = await api.get('/day-off');
            return data;
        }
    });

    // Fetch team day off requests for managers
    const teamDayOffRequests = useQuery({
        queryKey: ['employee', 'team-day-off-requests'],
        queryFn: async () => {
            const { data } = await api.get('/day-off/approvals');
            return data;
        }
    });

    // Fetch own day off change requests
    const dayOffRequests = useQuery({
        queryKey: ['employee', 'day-off-requests'],
        queryFn: async () => {
            const { data } = await api.get('/day-off-requests');
            return data;
        }
    });

    // Submit a new day off change request
    const submitRequest = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post('/day-off-requests', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee', 'day-off-requests'] });
        }
    });

    // Approve a team request
    const approveTeamRequest = useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.post(`/day-off-requests/${id}/approve`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee', 'team-day-off-requests'] });
            queryClient.invalidateQueries({ queryKey: ['employee', 'day-off-info'] });
        }
    });

    // Reject a team request
    const rejectTeamRequest = useMutation({
        mutationFn: async ({ id, reason }: { id: number, reason: string }) => {
            const { data } = await api.post(`/day-off-requests/${id}/reject`, { rejection_reason: reason });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee', 'team-day-off-requests'] });
        }
    });

    // Cancel a pending request
    const cancelRequest = useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.put(`/day-off-requests/${id}/cancel`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee', 'day-off-requests'] });
        }
    });

    return {
        dayOffInfo,
        dayOffRequests,
        teamDayOffRequests,
        submitRequest,
        approveTeamRequest,
        rejectTeamRequest,
        cancelRequest
    };
}
