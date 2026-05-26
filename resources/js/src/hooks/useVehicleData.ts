import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import { toast } from 'sonner';

/* ── VEHICLE BRANDS ── */

export const useVehicleBrands = () => {
    return useQuery({
        queryKey: ['vehicle_brands'],
        queryFn: async () => {
            const { data } = await api.get('/services/vehicle-brands');
            return data || [];
        },
    });
};

export const useCreateVehicleBrand = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData: FormData) => {
            const { data } = await api.post('/services/vehicle-brands', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle_brands'] });
        },
    });
};

export const useUpdateVehicleBrand = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data: formData }: { id: number; data: FormData }) => {
            // Laravel requires _method=PUT for multipart updates
            if (!formData.has('_method')) formData.append('_method', 'PUT');

            const { data } = await api.post(`/services/vehicle-brands/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle_brands'] });
        },
    });
};

export const useDeleteVehicleBrand = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/services/vehicle-brands/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle_brands'] });
        },
    });
};

/* ── VEHICLE MODELS ── */

export const useVehicleModels = (brandId: string | null = null) => {
    return useQuery({
        queryKey: ['vehicle_models', { brandId }],
        queryFn: async () => {
            const params = brandId && brandId !== 'all' ? { brand_id: brandId } : {};
            const { data } = await api.get('/services/vehicle-models', { params });
            return data || [];
        },
    });
};

export const useCreateVehicleModel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (modelData: any) => {
            const { data } = await api.post('/services/vehicle-models', modelData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle_models'] });
        },
    });
};

export const useUpdateVehicleModel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data: modelData }: { id: number; data: any }) => {
            const { data } = await api.put(`/services/vehicle-models/${id}`, modelData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle_models'] });
        },
    });
};

export const useDeleteVehicleModel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/services/vehicle-models/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle_models'] });
        },
    });
};
