import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../utils/api';
import { toast } from 'sonner';

/**
 * Hook to fetch serials with filters — server-side pagination/sort/search
 */
export const useSerials = (filters: any = {}) => {
    return useQuery({
        queryKey: ['serials', filters],
        queryFn: async () => {
            // Clean up filters: remove null, undefined, or 'all' strings
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== null && v !== undefined && v !== 'all' && v !== '')
            );
            const { data } = await api.get('/services/inventory/serials', { params: cleanFilters });
            return data;
        },
        staleTime: 30_000,          // treat data fresh for 30s — avoids re-fetch on tab switch
        gcTime: 5 * 60_000,         // keep in cache for 5 min
        placeholderData: keepPreviousData, // no flash when changing filters/page
    });
};

/**
 * Hook to fetch a single serial's details
 */
export const useSerial = (id: number | null) => {
    return useQuery({
        queryKey: ['serial', id],
        queryFn: async () => {
            const { data } = await api.get(`/services/inventory/serials/${id}`);
            return data;
        },
        enabled: !!id,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
    });
};

/**
 * Hook to fetch consumption history for a serial
 */
export const useSerialHistory = (id: number | null) => {
    return useQuery({
        queryKey: ['serial-history', id],
        queryFn: async () => {
            const { data } = await api.get(`/services/inventory/serials/${id}/history`);
            return data;
        },
        enabled: !!id,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
    });
};

/**
 * Hook to register a new serial
 */
export const useCreateSerial = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch('/api/services/inventory/serials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to register serial');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['serials'] });
            queryClient.invalidateQueries({ queryKey: ['stock-stocks'] });
            toast.success('Roll serial registered successfully');
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });
};

/**
 * Hook to update a serial
 */
export const useUpdateSerial = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: { id: number; [key: string]: any }) => {
            const response = await fetch(`/api/services/inventory/serials/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error('Failed to update serial');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['serials'] });
            queryClient.invalidateQueries({ queryKey: ['serial'] });
            toast.success('Serial updated successfully');
        }
    });
};

/**
 * Hook to fetch serial settings for a branch
 */
export const useSerialSettings = (branchId: string | number | null) => {
    return useQuery({
        queryKey: ['serial-settings', branchId],
        queryFn: async () => {
            const { data } = await api.get('/services/inventory/serials/settings', { params: { branch_id: branchId } });
            return data;
        },
    });
};

/**
 * Hook to update serial settings
 */
export const useUpdateSerialSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post('/services/inventory/serials/settings', payload);
            return data;
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['serial-settings', data.branch_id] });
            toast.success('Smart Registration settings updated');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update settings');
        }
    });
};

/**
 * Hook to get the next suggested serial number
 */
export const useNextSerialSuggestion = () => {
    return useMutation({
        mutationFn: async ({ productId, branchId }: { productId: string | number; branchId: string | number | null }) => {
            const { data } = await api.get('/services/inventory/serials/suggest-next', {
                params: { product_id: productId, branch_id: branchId }
            });
            return data.suggestion;
        },
    });
};
