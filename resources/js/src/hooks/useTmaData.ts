import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import api from '@/utils/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export interface TmaBroadcast {
    id: number;
    message: string;
    image_url: string | null;
    button_text: string | null;
    button_url: string | null;
    total_recipients: number;
    delivered_count: number;
    failed_count: number;
    click_count: number;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * TMA Dashboard Data Hook
 * Fetches vehicles, history, banners, customer info, and active services.
 */
export const useTmaDashboard = () => {
  const navigate = useNavigate();
  return useQuery({
    queryKey: ['tma', 'dashboard'],
    queryFn: async () => {
      const token = localStorage.getItem('tma_token');
      if (!token) {
        navigate('/crm/tma/auth');
        throw new Error('No TMA token found');
      }
      
      try {
        const response = await api.get('/crm/tma/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 401) {
          localStorage.removeItem('tma_token');
          navigate('/crm/tma/auth');
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * Mark Broadcasts as Viewed Mutation
 */
export const useTmaMarkViewed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
        const token = localStorage.getItem('tma_token');
        return api.post('/crm/tma/mark-as-viewed', {}, {
             headers: { Authorization: `Bearer ${token}` }
        });
    },
    onSuccess: () => {
        // Optionally refetch dashboard if banners are dismissed or similar
        queryClient.invalidateQueries({ queryKey: ['tma', 'dashboard'] });
    }
  });
};

/**
 * Convenience hooks to extract specific data from the dashboard query
 */
export const useTmaVehicles = () => {
    const { data, ...rest } = useTmaDashboard();
    return { data: data?.vehicles || [], ...rest };
};

export const useTmaHistory = () => {
    const { data, ...rest } = useTmaDashboard();
    return { data: data?.history || [], ...rest };
};

export const useTmaCustomer = () => {
    const { data, ...rest } = useTmaDashboard();
    return { data: data?.customer || null, ...rest };
};

export interface TmaBooking {
    id: number;
    booking_number: string | null;
    customer_id: number;
    branch_id: number;
    service_id: number | null;
    customer_vehicle_id: number | null;
    new_vehicle_info: any | null;
    booking_date: string;
    booking_time: string;
    status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Rescheduled' | 'Completed';
    notes: string | null;
    internal_notes: string | null;
    created_at: string;
    updated_at: string;
    customer?: any;
    branch?: any;
    service?: any;
    vehicle?: any;
}

/**
 * Fetch All Bookings (Admin)
 */
export const useTmaAllBookings = (params: any) => {
    return useQuery({
        queryKey: ['tma', 'bookings', params],
        queryFn: async () => {
            const { data } = await api.get('/crm/tma/bookings', { params });
            return data;
        },
        placeholderData: (previousData) => previousData,
    });
};

/**
 * Update Booking Status (Admin)
 */
export const useUpdateTmaBookingStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            const response = await api.patch(`/crm/tma/bookings/${id}/status`, data);
            return response.data;
        },
        onSuccess: (data) => {
            toast.success(data.message || 'Booking updated successfully');
            queryClient.invalidateQueries({ queryKey: ['tma', 'bookings'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to update booking');
        }
    });
};

/**
 * TMA Broadcasts List Hook (Portal)
 */
export const useTmaBroadcasts = (params: any) => {
    return useQuery({
        queryKey: ['tma', 'broadcasts', params],
        queryFn: async () => {
            const { data } = await api.get('/crm/tma/broadcasts', { params });
            return data;
        },
        placeholderData: (previousData) => previousData,
    });
};

/**
 * Archive/Restore Broadcast Mutation
 */
export const useArchiveTmaBroadcast = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ ids, archive }: { ids: number[], archive: boolean }) => {
            return api.post('/crm/tma/broadcasts/archive', { ids, archive });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tma', 'broadcasts'] });
            toast.success('Archive status updated successfully');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to update archive status');
        }
    });
};

/**
 * Bulk Delete Broadcasts Mutation
 */
export const useBulkDeleteTmaBroadcasts = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (ids: number[]) => {
            return api.post('/crm/tma/broadcasts/bulk-delete', { ids });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tma', 'broadcasts'] });
            toast.success('Selected broadcasts deleted forever');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to delete broadcasts');
        }
    });
};

/**
 * TMA Submit Job Rating Mutation
 */
export const useTmaSubmitRating = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { job_card_id: number; service_rating: number; technical_rating: number; comment?: string }) => {
            const token = localStorage.getItem('tma_token');
            const response = await api.post('/crm/tma/job-cards/rate', {
                job_card_id: data.job_card_id,
                service_rating: data.service_rating,
                technical_rating: data.technical_rating,
                comment: data.comment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tma', 'dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['tma', 'job', variables.job_card_id.toString()] });
            queryClient.invalidateQueries({ queryKey: ['tma', 'job', variables.job_card_id] });
            toast.success('Thank you for your feedback!');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error || 'Failed to submit rating');
        }
    });
};

/**
 * Update Customer Settings Mutation
 */
export const useTmaUpdateSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (settings: { tma_notifications_enabled: boolean }) => {
            const token = localStorage.getItem('tma_token');
            const response = await api.post('/crm/tma/profile/settings', settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['tma', 'dashboard'], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    customer: data.customer
                };
            });
            toast.success('Settings updated');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error || 'Failed to update settings');
        }
    });
};

/**
 * TMA Job Detail Hook
 * Fetches full details for a specific job card.
 */
export const useTmaJobDetail = (id: string | number | undefined) => {
    return useQuery({
        queryKey: ['tma', 'job', id],
        queryFn: async () => {
            if (!id) return null;
            const token = localStorage.getItem('tma_token');
            const response = await api.get(`/crm/tma/job-cards/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        },
        enabled: !!id,
    });
};

export const useTmaBookingHistory = () => {
    return useQuery({
        queryKey: ['tma', 'booking-history'],
        queryFn: async () => {
            const token = localStorage.getItem('tma_token');
            const { data } = await api.get('/crm/tma/bookings/history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return data;
        },
    });
};

/**
 * Fetch Customer Types for Targeting (Admin)
 */
export const useTmaCustomerTypes = () => {
    return useQuery({
        queryKey: ['tma', 'customer-types'],
        queryFn: async () => {
            const { data } = await api.get('/crm/tma/customer-types');
            return data;
        },
    });
};

/**
 * Search Linked Customers for Specific Targeting (Admin)
 */
export const useTmaLinkedCustomers = (search?: string) => {
    return useQuery({
        queryKey: ['tma', 'linked-customers', search],
        queryFn: async () => {
            const { data } = await api.get('/crm/tma/linked-customers', { params: { search } });
            return data;
        },
    });
};

/**
 * TMA Services - Infinite Scroll
 */
export const useInfiniteTmaServices = (params: { search?: string, tag?: string } = {}) => {
  return useInfiniteQuery({
    queryKey: ['tma', 'services', params],
    queryFn: async ({ pageParam = 1 }) => {
      const token = localStorage.getItem('tma_token');
      const { data } = await api.get('/crm/tma/services', {
        params: { ...params, page: pageParam },
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.current_page < lastPage.last_page ? lastPage.current_page + 1 : undefined,
  });
};

/**
 * TMA Service Detail
 */
export const useTmaServiceDetail = (id: string | number | undefined) => {
  return useQuery({
    queryKey: ['tma', 'service', id],
    queryFn: async () => {
      if (!id) return null;
      const token = localStorage.getItem('tma_token');
      const { data } = await api.get(`/crm/tma/services/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    },
    enabled: !!id,
  });
};

/**
 * TMA Products - Infinite Scroll
 */
export const useInfiniteTmaProducts = (params: { search?: string, tag?: string } = {}) => {
  return useInfiniteQuery({
    queryKey: ['tma', 'products', params],
    queryFn: async ({ pageParam = 1 }) => {
      const token = localStorage.getItem('tma_token');
      const { data } = await api.get('/crm/tma/products', {
        params: { ...params, page: pageParam },
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.current_page < lastPage.last_page ? lastPage.current_page + 1 : undefined,
  });
};

/**
 * TMA Product Detail
 */
export const useTmaProductDetail = (id: string | number | undefined) => {
  return useQuery({
    queryKey: ['tma', 'product', id],
    queryFn: async () => {
      if (!id) return null;
      const token = localStorage.getItem('tma_token');
      const { data } = await api.get(`/crm/tma/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    },
    enabled: !!id,
  });
};
