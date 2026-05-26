import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { toast } from 'sonner';

// --- Fetchers ---

const fetchProducts = async () => {
    const { data } = await api.get('/inventory/products?all=true');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchCategories = async () => {
    const { data } = await api.get('/inventory/categories');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchUoms = async () => {
    const { data } = await api.get('/inventory/uoms');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchTags = async () => {
    const { data } = await api.get('/inventory/tags');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchBranches = async () => {
    const { data } = await api.get('/hr/branches');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchBranchProducts = async (branchId: string | number) => {
    const { data } = await api.get(`/hr/branches/${branchId}/products`);
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchBranchServices = async (branchId: string | number) => {
    const { data } = await api.get(`/hr/branches/${branchId}/services`);
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchServices = async () => {
    const { data } = await api.get('/services/list');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchSuppliers = async () => {
    const { data } = await api.get('/inventory/suppliers');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchLocations = async () => {
    const { data } = await api.get('/inventory/locations');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchPurchaseOrders = async (params: any = {}) => {
    const { data } = await api.get('/inventory/purchase-orders', { params });
    return data;
};

const fetchPurchaseOrderPendingItems = async (poId: number | string) => {
    const { data } = await api.get(`/inventory/purchase-orders/${poId}/pending-items`);
    return data;
};

const fetchPurchaseReceives = async (params: any = {}) => {
    const { data } = await api.get('/inventory/purchase-receives', { params });
    return data;
};

const fetchInventoryDashboard = async (branchId?: number | number[] | null, startDate?: string | null, endDate?: string | null) => {
    const { data } = await api.get('/stock/dashboard', {
        params: { 
            branch_id: branchId,
            start_date: startDate,
            end_date: endDate
        }
    });
    return data;
};

const fetchStockBalance = async (params: any = {}) => {
    const { data } = await api.get('/stock/stock-balance', { params });
    return data;
};

const fetchStocks = async (params: any = {}) => {
    const { data } = await api.get('/stock/stocks', { params });
    return Array.isArray(data) ? data : [];
};

const fetchStockMovements = async (params: any = {}) => {
    const { data } = await api.get('/stock/stock-movements', { params });
    return data;
};

const fetchSerialMovements = async (params: any = {}) => {
    const { data } = await api.get('/stock/serial-movements', { params });
    return data;
};

const importProducts = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/inventory/products/import', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data;
};

const fetchStockAdjustments = async (params: any = {}) => {
    const { data } = await api.get('/stock/adjustments', { params });
    return data;
};

const fetchStockTransfers = async (params: any = {}) => {
    const { data } = await api.get('/stock/transfers', { params });
    return data;
};

const fetchOffCutSerials = async (params: any = {}) => {
    const { data } = await api.get('/stock/off-cut-serials', { params });
    return data;
};

// --- Custom Hooks for Fetching ---

export const useInventoryDashboard = (branchId?: number | number[] | null, startDate?: string | null, endDate?: string | null) => {
    return useQuery({
        queryKey: ['stock-dashboard', branchId, startDate, endDate],
        queryFn: () => fetchInventoryDashboard(branchId, startDate, endDate),
    });
};

export const useInventoryProducts = () => {
    return useQuery({
        queryKey: ['stock-products'],
        queryFn: fetchProducts,
        staleTime: 5 * 60_000,
        gcTime: 10 * 60_000,
    });
};

export const useInventoryCategories = () => {
    return useQuery({
        queryKey: ['stock-categories'],
        queryFn: fetchCategories,
    });
};

export const useInventoryUoms = () => {
    return useQuery({
        queryKey: ['stock-uoms'],
        queryFn: fetchUoms,
    });
};

export const useInventoryTags = () => {
    return useQuery({
        queryKey: ['stock-tags'],
        queryFn: fetchTags,
    });
};

export const useBranches = () => {
    return useQuery({
        queryKey: ['hr-branches'],
        queryFn: fetchBranches,
        staleTime: 5 * 60_000,
        gcTime: 10 * 60_000,
    });
};

export const useBranchProducts = (branchId: string | number | null) => {
    return useQuery({
        queryKey: ['branch-products', branchId],
        queryFn: () => branchId ? fetchBranchProducts(branchId) : Promise.resolve([]),
        enabled: !!branchId,
    });
};

export const useBranchServices = (branchId: string | number | null) => {
    return useQuery({
        queryKey: ['branch-services', branchId],
        queryFn: () => branchId ? fetchBranchServices(branchId) : Promise.resolve([]),
        enabled: !!branchId,
    });
};

export const useInventoryServices = () => {
    return useQuery({
        queryKey: ['stock-services'],
        queryFn: fetchServices,
    });
};

export const useInventorySuppliers = () => {
    return useQuery({
        queryKey: ['stock-suppliers'],
        queryFn: fetchSuppliers,
    });
};

export const useInventoryLocations = () => {
    return useQuery({
        queryKey: ['stock-locations'],
        queryFn: fetchLocations,
        staleTime: 5 * 60_000,
        gcTime: 10 * 60_000,
    });
};

export const usePurchaseOrders = (params: any = {}) => {
    return useQuery({
        queryKey: ['purchase-orders', params],
        queryFn: () => fetchPurchaseOrders(params),
    });
};

export const usePurchaseOrderPendingItems = (poId: number | string | null) => {
    return useQuery({
        queryKey: ['purchase-order-pending-items', poId],
        queryFn: () => poId ? fetchPurchaseOrderPendingItems(poId) : Promise.resolve([]),
        enabled: !!poId,
    });
};

export const usePurchaseReceives = (params: any = {}) => {
    return useQuery({
        queryKey: ['purchase-receives', params],
        queryFn: () => fetchPurchaseReceives(params),
    });
};

export const useStockBalance = (params: any = {}) => {
    return useQuery({
        queryKey: ['stock-balance', params],
        queryFn: () => fetchStockBalance(params),
    });
};

export const useInventoryStocks = (params: any = {}) => {
    return useQuery({
        queryKey: ['stock-stocks', params],
        queryFn: () => fetchStocks(params),
    });
};

export const useStockMovements = (params: any = {}) => {
    return useQuery({
        queryKey: ['stock-movements', params],
        queryFn: () => fetchStockMovements(params),
    });
};

export const useSerialMovements = (params: any = {}) => {
    return useQuery({
        queryKey: ['stock-serial-movements', params],
        queryFn: () => fetchSerialMovements(params),
    });
};

export const useStockAdjustments = (params: any = {}) => {
    return useQuery({
        queryKey: ['stock-adjustments', params],
        queryFn: () => fetchStockAdjustments(params),
    });
};

export const useStockAdjustment = (id: number | string | null) => {
    return useQuery({
        queryKey: ['stock-adjustment', id],
        queryFn: () => api.get(`/stock/adjustments/${id}`).then(res => res.data),
        enabled: !!id,
    });
};

export const useStockTransfers = (params: any = {}) => {
    return useQuery({
        queryKey: ['stock-transfers', params],
        queryFn: () => fetchStockTransfers(params),
    });
};

export const useStockTransfer = (id: number | string | null) => {
    return useQuery({
        queryKey: ['stock-transfer', id],
        queryFn: () => api.get(`/stock/transfers/${id}`).then(res => res.data),
        enabled: !!id,
    });
};

export const useOffCutSerials = (params: any = {}) => {
    return useQuery({
        queryKey: ['stock-off-cut-serials', params],
        queryFn: () => fetchOffCutSerials(params),
    });
};

// --- Custom Hooks for Mutations ---

export const useCreateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData: FormData) => {
            const { data } = await api.post('/inventory/products', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-products'] });
            toast.success('Product created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create product');
        },
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
            // Laravel requires _method=PUT for multipart/form-data POST requests to simulate PUT
            formData.append('_method', 'PUT');
            const { data } = await api.post(`/inventory/products/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-products'] });
            toast.success('Product updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update product');
        },
    });
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/inventory/products/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-products'] });
            toast.success('Product deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete product');
        },
    });
};

export const useReorderProducts = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (orders: Array<{ id: number; sort_order: number }>) => {
            const { data } = await api.post('/inventory/reorder-products', { orders });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-products'] });
            toast.success('Products reordered successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reorder products');
        },
    });
};

// --- Categories Mutations ---

export const useCreateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post('/inventory/categories', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-categories'] });
            toast.success('Category created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create category');
        },
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
            const { data } = await api.put(`/inventory/categories/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-categories'] });
            toast.success('Category updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update category');
        },
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/inventory/categories/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-categories'] });
            toast.success('Category deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        },
    });
};

// --- UOM Mutations ---

export const useCreateUom = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post('/inventory/uoms', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-uoms'] });
            toast.success('UOM created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create UOM');
        },
    });
};

export const useUpdateUom = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
            const { data } = await api.put(`/inventory/uoms/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-uoms'] });
            toast.success('UOM updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update UOM');
        },
    });
};

export const useDeleteUom = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/inventory/uoms/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-uoms'] });
            toast.success('UOM deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete UOM');
        },
    });
};

// --- Tag Mutations ---

export const useCreateTag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post('/inventory/tags', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-tags'] });
            toast.success('Tag created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create tag');
        },
    });
};

export const useUpdateTag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
            const { data } = await api.put(`/inventory/tags/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-tags'] });
            toast.success('Tag updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update tag');
        },
    });
};

export const useDeleteTag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/inventory/tags/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-tags'] });
            toast.success('Tag deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete tag');
        },
    });
};

// --- Branch Assignment Mutations ---

export const useSyncBranchProducts = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ branchId, products }: { branchId: string | number; products: Array<{ id: number; reorder_level: number }> }) => {
            const { data } = await api.post(`/hr/branches/${branchId}/products/sync`, { products });
            return data;
        },
        onSuccess: (_, { branchId }) => {
            queryClient.invalidateQueries({ queryKey: ['branch-products', branchId] });
            toast.success('Branch products updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update branch products');
        },
    });
};

export const useSyncBranchServices = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ branchId, services }: { branchId: string | number; services: number[] }) => {
            const { data } = await api.post(`/hr/branches/${branchId}/services/sync`, { services });
            return data;
        },
        onSuccess: (_, { branchId }) => {
            queryClient.invalidateQueries({ queryKey: ['branch-services', branchId] });
            toast.success('Branch services updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update branch services');
        },
    });
};

// --- Purchase Order Mutations ---

export const useCreatePurchaseOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post('/inventory/purchase-orders', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast.success('Purchase Order created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create Purchase Order');
        },
    });
};

export const useUpdatePurchaseOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
            const { data } = await api.put(`/inventory/purchase-orders/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast.success('Purchase Order updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update Purchase Order');
        },
    });
};

export const useDeletePurchaseOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/inventory/purchase-orders/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast.success('Purchase Order deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete Purchase Order');
        },
    });
};

// --- Purchase Receive Mutation ---

export const useCreatePurchaseReceive = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post('/inventory/purchase-receives', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-receives'] });
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast.success('Items received successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to receive items');
        },
    });
};

// --- Stock Mutations ---

export const useAdjustStock = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post('/stock/stocks', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-stocks'] });
            queryClient.invalidateQueries({ queryKey: ['stock-balance'] });
            toast.success('Stock operations tracked correctly!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update ledger records');
        },
    });
};

// --- Stock Adjustment Mutations ---

export const useCreateStockAdjustment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post('/stock/adjustments', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
            queryClient.invalidateQueries({ queryKey: ['stock-stocks'] });
            queryClient.invalidateQueries({ queryKey: ['stock-balance'] });
        },
    });
};

export const useUpdateStockAdjustment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: number | string; payload: any }) => {
            const { data } = await api.put(`/stock/adjustments/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
            queryClient.invalidateQueries({ queryKey: ['stock-stocks'] });
            queryClient.invalidateQueries({ queryKey: ['stock-balance'] });
        },
    });
};

export const useDeleteStockAdjustment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/stock/adjustments/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
            toast.success('Adjustment deleted');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete adjustment');
        },
    });
};

export const useApproveStockAdjustment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.post(`/stock/adjustments/${id}/approve`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
            queryClient.invalidateQueries({ queryKey: ['stock-stocks'] });
            queryClient.invalidateQueries({ queryKey: ['stock-balance'] });
            toast.success('Adjustment approved');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to approve adjustment');
        },
    });
};

export const useRejectStockAdjustment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
            const { data } = await api.post(`/stock/adjustments/${id}/reject`, { reason });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
            queryClient.invalidateQueries({ queryKey: ['stock-stocks'] });
            queryClient.invalidateQueries({ queryKey: ['stock-balance'] });
            toast.success('Adjustment rejected');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reject adjustment');
        },
    });
};

// --- Stock Transfer Mutations ---

export const useCreateStockTransfer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post('/stock/transfers', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
            queryClient.invalidateQueries({ queryKey: ['stock-stocks'] });
            queryClient.invalidateQueries({ queryKey: ['stock-balance'] });
        },
    });
};

export const useUpdateStockTransfer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: number | string; payload: any }) => {
            const { data } = await api.put(`/stock/transfers/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
            queryClient.invalidateQueries({ queryKey: ['stock-stocks'] });
            queryClient.invalidateQueries({ queryKey: ['stock-balance'] });
        },
    });
};

export const useDeleteStockTransfer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/stock/transfers/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
            toast.success('Transfer deleted');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete transfer');
        },
    });
};

export const useApproveStockTransfer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.post(`/stock/transfers/${id}/approve`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
            queryClient.invalidateQueries({ queryKey: ['stock-stocks'] });
            queryClient.invalidateQueries({ queryKey: ['stock-balance'] });
            toast.success('Transfer approved successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to approve transfer');
        },
    });
};

export const useRejectStockTransfer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
            const { data } = await api.post(`/stock/transfers/${id}/reject`, { reason });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
            queryClient.invalidateQueries({ queryKey: ['stock-stocks'] });
            queryClient.invalidateQueries({ queryKey: ['stock-balance'] });
            toast.success('Transfer rejected');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reject transfer');
        },
    });
};

export const useImportProducts = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: importProducts,
        onSuccess: (data) => {
            toast.success(data.message || 'Products imported successfully');
            queryClient.invalidateQueries({ queryKey: ['stock-products'] });
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to import products';
            toast.error(message);
        },
    });
};

export const downloadProductTemplate = async () => {
    try {
        const response = await api.get('/inventory/products/import-template', {
            responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'product_import_template.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        toast.error('Failed to download template');
    }
};
