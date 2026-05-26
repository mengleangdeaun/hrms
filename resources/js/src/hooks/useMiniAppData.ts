import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../utils/api';
import { toast } from 'sonner';

// --- Types ---

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

export interface CustomerFeedback {
    id: number;
    status: string;
    branch?: {
        name: string;
    };
    created_at: string;
    customer_service_rating: number;
    technical_team_rating: number;
    overall_rating: number;
    issues?: string[];
    other_issue_details?: string;
    improvement_suggestions?: string;
    phone_number?: string;
    allow_contact: boolean;
    service?: {
        name: string;
    };
}

export interface JobCardRating {
    id: number;
    job_card?: {
        job_no: string;
        branch?: {
            name: string;
        };
    };
    customer?: {
        name: string;
    };
    created_at: string;
    service_rating: number;
    technical_rating: number;
    comment?: string;
}

// --- Fetchers ---

const fetchCustomerFeedbacks = async (params: any = {}) => {
    const { data } = await api.get('/crm/customer-feedback', { params });
    return data;
};

const fetchJobCardRatings = async (params: any = {}) => {
    const { data } = await api.get('/crm/job-card-ratings', { params });
    return data;
};

const updateFeedbackStatus = async ({ id, status }: { id: number; status: string }) => {
    const { data } = await api.patch(`/crm/customer-feedback/${id}/status`, { status });
    return data;
};

// --- Hooks ---

/**
 * Fetch Customer Feedbacks with pagination and filters
 */
export const useCustomerFeedbacks = (params: any = {}) => {
    return useQuery<PaginatedResponse<CustomerFeedback>>({
        queryKey: ['miniapp-customer-feedback', params],
        queryFn: () => fetchCustomerFeedbacks(params),
        placeholderData: keepPreviousData,
    });
};

/**
 * Update Customer Feedback Status
 */
export const useUpdateFeedbackStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateFeedbackStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['miniapp-customer-feedback'] });
            toast.success('Feedback status updated');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update feedback status');
        },
    });
};

/**
 * Fetch Job Card Ratings with pagination and filters
 */
export const useJobCardRatings = (params: any = {}) => {
    return useQuery<PaginatedResponse<JobCardRating>>({
        queryKey: ['miniapp-job-card-ratings', params],
        queryFn: () => fetchJobCardRatings(params),
        placeholderData: keepPreviousData,
    });
};
