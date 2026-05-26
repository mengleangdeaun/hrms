import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../utils/api';

/* ── CUSTOMERS ── */

export const useCRMCustomers = (params: any) => {
    return useQuery({
        queryKey: ['crm_customers', params],
        queryFn: async () => {
            const { data } = await api.get('/crm/customers', { params });
            return data;
        },
        placeholderData: keepPreviousData,
    });
};

export const useCRMCustomer = (id: number | null, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['crm_customer', id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await api.get(`/crm/customers/${id}`);
            return data;
        },
        enabled: enabled && !!id,
    });
};

export const useCRMCustomersMinimal = () => {
    return useQuery({
        queryKey: ['crm_customers_minimal'],
        queryFn: async () => {
            const { data } = await api.get('/crm/customers?all=true');
            return data;
        },
    });
};

export const useCRMCustomerTypes = () => {
    return useQuery({
        queryKey: ['crm_customer_types'],
        queryFn: async () => {
            const { data } = await api.get('/crm/customer-types');
            return data;
        },
    });
};

export const useCRMCustomerNextCode = () => {
    return useQuery({
        queryKey: ['crm_customer_next_code'],
        queryFn: async () => {
            const { data } = await api.get('/crm/customers/next-code');
            return data;
        },
        enabled: false,
        staleTime: 0,
        gcTime: 0,
    });
};

export const useCRMCreateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (customerData: any | FormData) => {
            const config = customerData instanceof FormData 
                ? { headers: { 'Content-Type': 'multipart/form-data' } } 
                : {};
            const { data } = await api.post('/crm/customers', customerData, config);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_customers'] });
            queryClient.invalidateQueries({ queryKey: ['crm_customers_minimal'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
};

export const useCRMUpdateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data: customerData }: { id: number; data: any | FormData }) => {
            if (customerData instanceof FormData) {
                if (!customerData.has('_method')) customerData.append('_method', 'PUT');
                const { data } = await api.post(`/crm/customers/${id}`, customerData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                return data;
            } else {
                const { data } = await api.put(`/crm/customers/${id}`, customerData);
                return data;
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['crm_customers'] });
            queryClient.invalidateQueries({ queryKey: ['crm_customers_minimal'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['crm_customer', variables.id] });
        },
    });
};

export const useCRMDeleteCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/crm/customers/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_customers'] });
            queryClient.invalidateQueries({ queryKey: ['crm_customers_minimal'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
};

/* ── CUSTOMER TYPES ── */

export const useCRMCustomerTypeCreate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (typeData: any) => {
            const { data } = await api.post('/crm/customer-types', typeData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_customer_types'] });
        },
    });
};

export const useCRMCustomerTypeUpdate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data: typeData }: { id: number; data: any }) => {
            const { data } = await api.put(`/crm/customer-types/${id}`, typeData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_customer_types'] });
        },
    });
};

export const useCRMCustomerTypeDelete = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/crm/customer-types/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_customer_types'] });
        },
    });
};

/* ── CUSTOMER VEHICLES ── */

export const useCRMCustomerVehicles = (params: any) => {
    return useQuery({
        queryKey: ['crm_customer_vehicles', params],
        queryFn: async () => {
            const { data } = await api.get('/crm/customer-vehicles', { params });
            return data;
        },
        placeholderData: keepPreviousData,
    });
};

export const useCRMVehicleBrands = () => {
    return useQuery({
        queryKey: ['crm_vehicle_brands'],
        queryFn: async () => {
            const { data } = await api.get('/services/vehicle-brands');
            return data;
        },
    });
};

export const useCRMVehicleModels = (brandId: number | null) => {
    return useQuery({
        queryKey: ['crm_vehicle_models', brandId],
        queryFn: async () => {
            const { data } = await api.get(`/services/vehicle-models?brand_id=${brandId}`);
            return data;
        },
        enabled: !!brandId,
    });
};

export const useCRMCreateVehicle = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (vehicleData: any) => {
            const { data } = await api.post('/crm/customer-vehicles', vehicleData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_customer_vehicles'] });
            queryClient.invalidateQueries({ queryKey: ['customerVehicles'] });
        },
    });
};

export const useCRMUpdateVehicle = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data: vehicleData }: { id: number; data: any }) => {
            const { data } = await api.put(`/crm/customer-vehicles/${id}`, vehicleData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_customer_vehicles'] });
            queryClient.invalidateQueries({ queryKey: ['customerVehicles'] });
        },
    });
};

export const useCRMDeleteVehicle = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/crm/customer-vehicles/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_customer_vehicles'] });
            queryClient.invalidateQueries({ queryKey: ['customerVehicles'] });
        },
    });
};

/* ── BANNERS ── */

export const useCRMBanners = (params: any) => {
    return useQuery({
        queryKey: ['crm_banners', params],
        queryFn: async () => {
            const { data } = await api.get('/crm/banners', { params });
            return data;
        },
    });
};

export const useCRMCreateBanner = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData: FormData) => {
            const { data } = await api.post('/crm/banners', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_banners'] });
        },
    });
};

export const useCRMUpdateBanner = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data: formData }: { id: number; data: FormData }) => {
            // Laravel requires _method=PUT for multipart updates
            if (!(formData instanceof FormData)) {
                const fd = new FormData();
                Object.keys(formData).forEach(key => fd.append(key, (formData as any)[key]));
                formData = fd;
            }
            if (!formData.has('_method')) formData.append('_method', 'PUT');

            const { data } = await api.post(`/crm/banners/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_banners'] });
        },
    });
};

export const useCRMDeleteBanner = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/crm/banners/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_banners'] });
        },
    });
};

/* ── CONTACT CATEGORIES ── */

export const useCRMContactCategories = () => {
    return useQuery({
        queryKey: ['crm_contact_categories'],
        queryFn: async () => {
            const { data } = await api.get('/crm/contact-categories');
            return data;
        },
    });
};

export const useCRMCreateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const { data: response } = await api.post('/crm/contact-categories', data);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_contact_categories'] });
        },
    });
};

export const useCRMUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            const { data: response } = await api.put(`/crm/contact-categories/${id}`, data);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_contact_categories'] });
        },
    });
};

export const useCRMDeleteCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/crm/contact-categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_contact_categories'] });
        },
    });
};

/* ── CONTACTS ── */

export const useCRMContacts = (params: any) => {
    return useQuery({
        queryKey: ['crm_contacts', params],
        queryFn: async () => {
            const { data } = await api.get('/crm/contacts', { params });
            return data;
        },
    });
};

export const useCRMContactsMinimal = () => {
    return useQuery({
        queryKey: ['crm_contacts_minimal'],
        queryFn: async () => {
            const { data } = await api.get('/crm/contacts', { params: { paginate: 'false' } });
            return data;
        },
    });
};

export const useCRMContact = (id: string | undefined) => {
    return useQuery({
        queryKey: ['crm_show_contact', id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await api.get(`/crm/contacts/${id}`);
            return data;
        },
        enabled: !!id,
        staleTime: 60 * 1000, // Keep data fresh for 1 minute
        gcTime: 5 * 60 * 1000, // Cache for 5 minutes
        refetchOnWindowFocus: false // Reduce background reloads
    });
};

export const useCRMCreateContact = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData: FormData) => {
            const { data } = await api.post('/crm/contacts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_contacts'] });
            queryClient.invalidateQueries({ queryKey: ['crm_contacts_minimal'] });
        },
    });
};

export const useCRMUpdateContact = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data: formData }: { id: number; data: FormData }) => {
            if (!(formData instanceof FormData)) {
                const fd = new FormData();
                Object.keys(formData).forEach(key => fd.append(key, (formData as any)[key]));
                formData = fd;
            }
            if (!formData.has('_method')) formData.append('_method', 'PUT');

            const { data } = await api.post(`/crm/contacts/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['crm_contacts'] });
            queryClient.invalidateQueries({ queryKey: ['crm_contacts_minimal'] });
            queryClient.invalidateQueries({ queryKey: ['crm_show_contact', variables.id] });
        },
    });
};

export const useCRMDeleteContactAttachment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ contactUlid, attachmentId }: { contactUlid: string; attachmentId: number }) => {
            await api.delete(`/crm/contacts/${contactUlid}/attachments/${attachmentId}`);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['crm_show_contact', variables.contactUlid] });
        },
    });
};

export const useCRMDeleteContact = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete(`/crm/contacts/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_contacts'] });
            queryClient.invalidateQueries({ queryKey: ['crm_contacts_minimal'] });
        },
    });
};

export const useCRMPromoteContact = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.post(`/crm/contacts/${id}/promote`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_customers'] });
            queryClient.invalidateQueries({ queryKey: ['crm_customers_minimal'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['crm_contacts'] });
            queryClient.invalidateQueries({ queryKey: ['crm_contacts_minimal'] });
            queryClient.invalidateQueries({ queryKey: ['crm_leads'] });
            queryClient.invalidateQueries({ queryKey: ['crm_lead'] });
        },
    });
};

export const useCRMSyncContactHierarchy = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, child_ulids }: { id: string; child_ulids: string[] }) => {
            const { data } = await api.post(`/crm/contacts/${id}/sync-hierarchy`, { child_ulids });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['crm_contacts'] });
            queryClient.invalidateQueries({ queryKey: ['crm_contacts_minimal'] });
            queryClient.invalidateQueries({ queryKey: ['crm_show_contact', variables.id] });
        },
    });
};

/* ── LEADS ── */

export const useCRMLeads = (params: any) => {
    return useQuery({
        queryKey: ['crm_leads', params],
        queryFn: async () => {
            const { data } = await api.get('/crm/leads', { params });
            return data;
        },
        placeholderData: keepPreviousData,
    });
};

export const useCRMLeadsMinimal = () => {
    return useQuery({
        queryKey: ['crm_leads_minimal'],
        queryFn: async () => {
            const { data } = await api.get('/crm/leads', { params: { compact: true } });
            return data;
        },
    });
};

export const useCRMLead = (id: string | number) => {
    return useQuery({
        queryKey: ['crm_lead', id],
        queryFn: async () => {
            const { data } = await api.get(`/crm/leads/${id}`);
            return data;
        },
        enabled: !!id,
    });
};

export const useCRMCreateLead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (leadData: any) => {
            const { data } = await api.post('/crm/leads', leadData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_leads'] });
        },
    });
};

export const useCRMUpdateLead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data: leadData }: { id: number | string; data: any }) => {
            const { data } = await api.post(`/crm/leads/${id}`, {
                ...leadData,
                _method: 'PUT'
            });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['crm_leads'] });
            queryClient.invalidateQueries({ queryKey: ['crm_lead', String(variables.id)] });
            queryClient.invalidateQueries({ queryKey: ['crm_lead', Number(variables.id)] });
        },
    });
};

export const useCRMDeleteLead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number | string) => {
            const { data } = await api.delete(`/crm/leads/${id}`);
            return data;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['crm_leads'] });
            queryClient.invalidateQueries({ queryKey: ['crm_lead', String(id)] });
            queryClient.invalidateQueries({ queryKey: ['crm_lead', Number(id)] });
        },
    });
};

export const useCRMAddLeadNote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, content }: { id: number | string; content: string }) => {
            const { data } = await api.post(`/crm/leads/${id}/notes`, { content });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['crm_leads'] });
            queryClient.invalidateQueries({ queryKey: ['crm_lead', String(variables.id)] });
            queryClient.invalidateQueries({ queryKey: ['crm_lead', Number(variables.id)] });
        },
    });
};

export const useCRMBulkUpdateLeads = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { ids: number[] | string[]; is_active?: boolean; stage_id?: number }) => {
            const { data } = await api.post('/crm/leads/bulk-update', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_leads'] });
        },
    });
};

/* ── PIPELINES ── */

export const useCRMPipelines = () => {
    return useQuery({
        queryKey: ['crm_pipelines'],
        queryFn: async () => {
            const { data } = await api.get('/crm/pipelines');
            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useUsers = () => {
    return useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data } = await api.get('/access-control/users?selection=1');
            return data.data || data;
        },
    });
};

export const useCRMPipelineUpdateStages = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, stages }: { id: number; stages: any[] }) => {
            const { data } = await api.put(`/crm/pipelines/${id}/stages`, { stages });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_pipelines'] });
            queryClient.invalidateQueries({ queryKey: ['crm_leads'] });
        },
    });
};
