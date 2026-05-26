import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { toast } from 'sonner';

// --- Fetchers ---

const fetchPaymentAccounts = async (params: any = {}) => {
    const { data } = await api.get('/finance/payment-accounts', { params: { ...params, all: true } });
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchTransactions = async (params: any = {}) => {
    const { data } = await api.get('/finance/transactions', { params });
    return data;
};

const fetchIncomes = async (params: any = {}) => {
    const { data } = await api.get('/finance/incomes', { params });
    return data;
};

const fetchExpenses = async (params: any = {}) => {
    const { data } = await api.get('/finance/expenses', { params });
    return data;
};

const fetchIncomeCategories = async (params: any = {}) => {
    const { data } = await api.get('/finance/incomes/categories', { params: { ...params, all: true } });
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchExpenseCategories = async (params: any = {}) => {
    const { data } = await api.get('/finance/expenses/categories', { params: { ...params, all: true } });
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchFinanceDashboardStats = async (params: any = {}) => {
    const { data } = await api.get('/finance/dashboard/stats', { params });
    return data;
};

// --- Queries ---

export const usePaymentAccounts = (params: any = {}, options: any = {}) => {
    return useQuery<any[]>({
        queryKey: ['payment-accounts', params],
        queryFn: () => fetchPaymentAccounts(params),
        ...options
    });
};

export const useTransactions = (params: any = {}, options: any = {}) => {
    return useQuery<any>({
        queryKey: ['transactions', params],
        queryFn: () => fetchTransactions(params),
        ...options
    });
};

export const useIncomes = (params: any = {}, options: any = {}) => {
    return useQuery<any>({
        queryKey: ['incomes', params],
        queryFn: () => fetchIncomes(params),
        ...options
    });
};

export const useExpenses = (params: any = {}, options: any = {}) => {
    return useQuery<any>({
        queryKey: ['expenses', params],
        queryFn: () => fetchExpenses(params),
        ...options
    });
};

export const useIncomeCategories = (params: any = {}, options: any = {}) => {
    return useQuery<any[]>({
        queryKey: ['income-categories', params],
        queryFn: () => fetchIncomeCategories(params),
        ...options
    });
};

export const useExpenseCategories = (params: any = {}, options: any = {}) => {
    return useQuery<any[]>({
        queryKey: ['expense-categories', params],
        queryFn: () => fetchExpenseCategories(params),
        ...options
    });
};

export const useFinanceDashboardStats = (params: any = {}, options: any = {}) => {
    return useQuery<any>({
        queryKey: ['finance-dashboard-stats', params],
        queryFn: () => fetchFinanceDashboardStats(params),
        ...options
    });
};

// --- Mutations ---

export const useDeletePaymentAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (ulid: string) => api.delete(`/finance/payment-accounts/${ulid}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-accounts'] });
            toast.success('Account deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete account');
        }
    });
};

export const useDeleteIncome = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (ulid: string) => api.delete(`/finance/incomes/${ulid}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incomes'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            toast.success('Income deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete income');
        }
    });
};

export const useDeleteExpense = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (ulid: string) => api.delete(`/finance/expenses/${ulid}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            toast.success('Expense deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete expense');
        }
    });
};

export const useDeleteFinanceCategory = (type: 'income' | 'expense') => {
    const queryClient = useQueryClient();
    const endpoint = type === 'income' ? 'incomes' : 'expenses';
    const queryKey = type === 'income' ? 'income-categories' : 'expense-categories';
    
    return useMutation({
        mutationFn: (ulid: string) => api.delete(`/finance/${endpoint}/categories/${ulid}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
            toast.success('Category deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        }
    });
};
