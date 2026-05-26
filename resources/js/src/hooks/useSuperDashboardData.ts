import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { toast } from 'sonner';

// --- Fetchers ---

const fetchSuperDashboardStats = async (params: any = {}) => {
    const { data } = await api.get('/dashboard/super/stats', { params });
    return data;
};

// --- Queries ---

export const useSuperDashboardStats = (params: any = {}, options: any = {}) => {
    return useQuery<any>({
        queryKey: ['super-dashboard-stats', params],
        queryFn: () => fetchSuperDashboardStats(params),
        enabled: !!params.branch_id,
        ...options
    });
};

// --- Mutations ---

export const useSubmitDailyReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: { branch_id: number, date: string, data: any }) => 
            api.post('/dashboard/super/report', payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['super-dashboard-stats', { branch_id: variables.branch_id, date: variables.date }] });
            toast.success('Daily report submitted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to submit report');
        }
    });
};
