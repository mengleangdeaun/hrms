import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Hook to fetch sales dashboard stats and payment accounts
 */
export const useSaleDashboardStats = (params?: { branch_id?: number | number[] | null; from_date?: string; to_date?: string }) => {
    return useQuery({
        queryKey: ['sales-dashboard-stats', params],
        queryFn: async () => {
            const queryParams = new URLSearchParams();
            if (params?.branch_id) {
                if (Array.isArray(params.branch_id)) {
                    params.branch_id.forEach(id => queryParams.append('branch_id[]', id.toString()));
                } else {
                    queryParams.append('branch_id', params.branch_id.toString());
                }
            }
            if (params?.from_date) queryParams.append('from_date', params.from_date);
            if (params?.to_date) queryParams.append('to_date', params.to_date);
            
            const response = await fetch(`/api/sales/dashboard/stats?${queryParams.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch sales stats');
            return response.json();
        }
    });
};

/**
 * Hook to fetch current active shift for a branch
 */
export const useCurrentSaleShift = (branchId?: number | number[] | null) => {
    const isSingleBranch = typeof branchId === 'number' && !!branchId;

    return useQuery({
        queryKey: ['active-sale-shift', branchId],
        queryFn: async () => {
            if (!isSingleBranch) return { shift: null };
            const response = await fetch(`/api/sales/dashboard/shift?branch_id=${branchId}`);
            if (!response.ok) throw new Error('Failed to fetch active shift');
            return response.json();
        },
        enabled: isSingleBranch
    });
};

/**
 * Hook to open a new sales shift
 */
export const useOpenSaleShift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (branchId: number) => {
            const response = await fetch('/api/sales/dashboard/shift/open', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify({ branch_id: branchId }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to open shift');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['active-sale-shift'] });
        },
        onError: () => {
            // Error handling can be managed by the call site (e.g. toast.promise)
        }
    });
};

/**
 * Hook to close an active sales shift
 */
export const useCloseSaleShift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (shiftId: number) => {
            const response = await fetch(`/api/sales/dashboard/shift/${shiftId}/close`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to close shift');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['active-sale-shift'] });
            queryClient.invalidateQueries({ queryKey: ['sales-dashboard-stats'] });
        },
        onError: () => {
            // Error handling can be managed by the call site
        }
    });
};
