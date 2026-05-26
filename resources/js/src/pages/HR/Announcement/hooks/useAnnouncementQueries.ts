import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import { AnnouncementFormData, AnnouncementDropdowns } from '../types';

export const useAnnouncementDropdowns = () => {
    return useQuery({
        queryKey: ['announcement-form-data'],
        queryFn: async () => {
            const { data } = await api.get('/hr/announcements-form-data');
            return data as AnnouncementDropdowns;
        },
        staleTime: 5 * 60 * 1000,
    });
};

export const useAnnouncement = (id: string | undefined) => {
    return useQuery({
        queryKey: ['announcement', id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await api.get(`/hr/announcements/${id}`);
            return data;
        },
        enabled: !!id,
    });
};

export const useAnnouncementMutation = (id: string | undefined) => {
    const queryClient = useQueryClient();
    const isEdit = !!id;

    return useMutation({
        mutationFn: async (payload: FormData) => {
            if (isEdit) {
                // For updates via FormData, we simulate PUT with _method
                payload.append('_method', 'PUT');
                const { data } = await api.post(`/hr/announcements/${id}`, payload);
                return data;
            } else {
                const { data } = await api.post('/hr/announcements', payload);
                return data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-announcements'] });
            if (isEdit) {
                queryClient.invalidateQueries({ queryKey: ['announcement', id] });
            }
        },
    });
};
