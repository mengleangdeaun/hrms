import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { toast } from 'sonner';

// Basic Fetchers
const fetchCustomers = async () => {
    const { data } = await api.get('/crm/customers?all=true');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchServices = async (branchId: number | null) => {
    const url = `/services/list?all=true&compact=true${branchId ? `&branch_id=${branchId}` : ''}`;
    const { data } = await api.get(url);
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchProducts = async (branchId: number | null) => {
    const url = `/inventory/products?all=true&compact=true${branchId ? `&branch_id=${branchId}` : ''}`;
    const { data } = await api.get(url);
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchBranches = async () => {
    const { data } = await api.get('/hr/branches');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchBrands = async () => {
    const { data } = await api.get('/services/vehicle-brands');
    return data;
};

const fetchCategories = async () => {
    const { data } = await api.get('/inventory/categories');
    return data;
};

const fetchPaymentAccounts = async (branchId?: number | null) => {
    const url = `/finance/payment-accounts?all=true&compact=true${branchId ? `&branch_id=${branchId}` : ''}`;
    const { data } = await api.get(url);
    return data;
};

const fetchCustomerVehicles = async (customerId: number | null) => {
    if (!customerId) return [];
    const { data } = await api.get(`/crm/customer-vehicles?customer_id=${customerId}`);
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchSaleRemarks = async (params: any = {}) => {
    const { data } = await api.get('/sales/remarks', { params });
    return data;
};

const fetchSalesOrders = async (params: any = {}) => {
    const { data } = await api.get('/sales/orders', { params });
    return data;
};

const cancelSalesOrder = async (id: number) => {
    const { data } = await api.post(`/sales/orders/${id}/cancel`);
    return data;
};

const fetchSalesOrder = async (id: number) => {
    const { data } = await api.get(`/sales/orders/${id}`);
    return data;
};

const fetchSalesInvoices = async (params: any = {}) => {
    const { data } = await api.get('/sales/invoices', { params });
    return data;
};

const addSalesOrderDeposit = async ({ id, formData }: { id: number, formData: FormData }) => {
    const { data } = await api.post(`/sales/orders/${id}/deposits`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
};

const updateSalesOrderDeposit = async ({ id, formData }: { id: number, formData: FormData }) => {
    // We use POST with _method=PUT for multipart/form-data support in Laravel for PUT
    if (formData instanceof FormData) {
        formData.append('_method', 'PUT');
    }
    const { data } = await api.post(`/sales/deposits/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
};

const deleteSalesOrderDeposit = async (id: number) => {
    const { data } = await api.delete(`/sales/deposits/${id}`);
    return data;
};

const fetchExchangeRate = async () => {
    const { data } = await api.get('/settings/exchange-rate?compact=true');
    return data;
};

const fetchSalesQuotations = async (params: any = {}) => {
    const { data } = await api.get('/sales/quotations', { params });
    return data;
};

const fetchSalesQuotation = async (id: number) => {
    const { data } = await api.get(`/sales/quotations/${id}`);
    return data;
};

const convertQuotationToOrder = async (id: number) => {
    const { data } = await api.post(`/sales/quotations/${id}/convert`);
    return data;
};

// Custom Hooks
export const useCustomers = () => {
    return useQuery({
        queryKey: ['customers'],
        queryFn: fetchCustomers,
    });
};

export const useServices = (branchId: number | null) => {
    return useQuery({
        queryKey: ['services', branchId],
        queryFn: () => fetchServices(branchId),
        enabled: !!branchId,
    });
};

export const useProducts = (branchId: number | null) => {
    return useQuery({
        queryKey: ['products', branchId],
        queryFn: () => fetchProducts(branchId),
        enabled: !!branchId,
    });
};

export const useBranches = () => {
    return useQuery({
        queryKey: ['branches'],
        queryFn: fetchBranches,
    });
};

export const useBrands = () => {
    return useQuery({
        queryKey: ['brands'],
        queryFn: fetchBrands,
    });
};

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories,
    });
};

export const usePaymentAccounts = (branchId?: number | null) => {
    return useQuery({
        queryKey: ['paymentAccounts', branchId],
        queryFn: () => fetchPaymentAccounts(branchId),
    });
};

export const useCustomerVehicles = (customerId: number | null) => {
    return useQuery({
        queryKey: ['customerVehicles', customerId],
        queryFn: () => fetchCustomerVehicles(customerId),
        enabled: !!customerId,
    });
};

export const useSaleRemarks = (params: any = {}) => {
    return useQuery({
        queryKey: ['saleRemarks', params],
        queryFn: () => fetchSaleRemarks(params),
    });
};

export const useSalesOrders = (params: any = {}) => {
    return useQuery({
        queryKey: ['salesOrders', params],
        queryFn: () => fetchSalesOrders(params),
    });
};

export const useCancelSalesOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: cancelSalesOrder,
        onSuccess: () => {
            toast.success('Order cancelled successfully');
            queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to cancel order');
        }
    });
};

export const useSalesInvoices = (params: any = {}) => {
    return useQuery({
        queryKey: ['salesInvoices', params],
        queryFn: () => fetchSalesInvoices(params),
    });
};

export const useSalesOrder = (id: number | null) => {
    return useQuery({
        queryKey: ['salesOrder', id],
        queryFn: () => fetchSalesOrder(id!),
        enabled: !!id,
    });
};

export const useAddSalesOrderDeposit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addSalesOrderDeposit,
        onSuccess: (data: any) => {
            toast.success('Payment recorded successfully');
            queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
            queryClient.invalidateQueries({ queryKey: ['salesOrder', data.id] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to record payment');
        }
    });
};

export const useUpdateSalesOrderDeposit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateSalesOrderDeposit,
        onSuccess: (data: any) => {
            toast.success('Payment updated successfully');
            queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
            queryClient.invalidateQueries({ queryKey: ['salesOrder', data.id] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update payment');
        }
    });
};

export const useDeleteSalesOrderDeposit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteSalesOrderDeposit,
        onSuccess: (data: any) => {
            toast.success('Payment deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
            queryClient.invalidateQueries({ queryKey: ['salesOrder', data.id] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete payment');
        }
    });
};

export const useExchangeRate = () => {
    return useQuery({
        queryKey: ['exchangeRate'],
        queryFn: fetchExchangeRate,
        refetchInterval: 60000, // Refresh every minute for "real-time" feel
    });
};

export const useSalesQuotations = (params: any = {}) => {
    return useQuery({
        queryKey: ['salesQuotations', params],
        queryFn: () => fetchSalesQuotations(params),
    });
};

export const useSalesQuotation = (id: number | null) => {
    return useQuery({
        queryKey: ['salesQuotation', id],
        queryFn: () => fetchSalesQuotation(id!),
        enabled: !!id,
    });
};

export const useConvertQuotation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: convertQuotationToOrder,
        onSuccess: () => {
            toast.success('Quotation converted successfully');
            queryClient.invalidateQueries({ queryKey: ['salesQuotations'] });
            queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to convert quotation');
        }
    });
};
