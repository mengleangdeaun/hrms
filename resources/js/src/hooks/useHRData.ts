import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

// --- Fetchers ---

// Attendance
const fetchAttendanceRecords = async (params: any) => {
    const { data } = await api.get('/attendance/records', { params });
    return data;
};

// Employees
const fetchEmployees = async (params?: any) => {
    const { data } = await api.get('/hr/employees', { params });
    return data;
};

const fetchTechnicians = async (params?: any) => {
    const { data } = await api.get('/hr/technicians', { params });
    return data;
};

const fetchQCPersons = async (params?: any) => {
    const { data } = await api.get('/hr/qc-persons', { params });
    return data;
};

// Activities
const fetchActivities = async (params?: any) => {
    const { data } = await api.get('/hr/activities', { params });
    return data;
};

// Announcements
const fetchAnnouncements = async () => {
    const { data } = await api.get('/hr/announcements');
    return Array.isArray(data) ? data : (data.data || []);
};

// Leave Records
const fetchLeaveRecords = async (params?: any) => {
    const { data } = await api.get('/hr/leave-requests', { params });
    return data;
};

// Leave Balances
const fetchLeaveBalances = async (params?: any) => {
    const { data } = await api.get('/hr/leave-balances', { params });
    return data;
};

// Leave Allocations
const fetchLeaveAllocations = async () => {
    const { data } = await api.get('/hr/leave-allocations');
    return Array.isArray(data) ? data : (data.data || []);
};

// Day Off
const fetchDayOffAssignments = async (params?: any) => {
    const { data } = await api.get('/hr/day-offs', { params });
    return data;
};

const fetchDayOffRequests = async (params?: any) => {
    const { data } = await api.get('/hr/day-off-requests', { params });
    return data;
};

// Supporting Data
const fetchLeaveTypes = async () => {
    const { data } = await api.get('/hr/leave-types');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchLeavePolicies = async () => {
    const { data } = await api.get('/hr/leave-policies');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchDepartments = async () => {
    const { data } = await api.get('/hr/departments');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchBranches = async (compact = false) => {
    const { data } = await api.get('/hr/branches', { params: compact ? { compact: true } : {} });
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchDesignations = async () => {
    const { data } = await api.get('/hr/designations');
    return Array.isArray(data) ? data : (data.data || []);
};

// Attendance Employee Config
async function fetchEmployeeConfigs(): Promise<any[]> {
    const { data } = await api.get('/attendance/employee-config');
    return Array.isArray(data) ? data : (data.data || []);
}

async function fetchWorkingShifts(): Promise<any[]> {
    const { data } = await api.get('/attendance/working-shifts');
    return Array.isArray(data) ? data : (data.data || []);
}

async function fetchAttendancePolicies(): Promise<any[]> {
    const { data } = await api.get('/attendance/attendance-policies');
    return Array.isArray(data) ? data : (data.data || []);
}

const fetchAttendanceSummary = async (filters: any) => {
    const { data } = await api.get('/attendance/report/summary', { params: filters });
    return data;
};

const fetchAttendanceTimeline = async (ulid: string, filters: any) => {
    const { data } = await api.get(`/attendance/report/timeline/${ulid}`, { params: filters });
    return data;
};

// --- Hooks ---

// Attendance
export const useAttendanceRecords = (filters: { start_date?: string; end_date?: string; employee_id?: string }) => {
    return useQuery({
        queryKey: ['attendance-records', filters],
        queryFn: () => fetchAttendanceRecords(filters),
        placeholderData: (previousData) => previousData,
    });
};

// Employees
export const useHREmployees = (params?: any) => {
    return useQuery({
        queryKey: ['hr-employees', params],
        queryFn: () => fetchEmployees(params),
        placeholderData: (previousData) => previousData,
    });
};

export const useHRFilterEmployees = (compact = false) => {
    return useQuery({
        queryKey: ['hr-employees-filter', compact],
        queryFn: () => fetchEmployees(compact ? { compact: true } : {}),
        staleTime: 5 * 60 * 1000,
    });
};

export const useTechnicians = (params?: any) => {
    return useQuery({
        queryKey: ['technicians', params],
        queryFn: () => fetchTechnicians(params),
        staleTime: 5 * 60 * 1000,
    });
};

export const useQCPersons = (params?: any) => {
    return useQuery({
        queryKey: ['qc-persons', params],
        queryFn: () => fetchQCPersons(params),
        staleTime: 5 * 60 * 1000,
    });
};

// Activities
export const useHRActivities = (params?: any) => {
    return useQuery({
        queryKey: ['hr-activities', params],
        queryFn: () => fetchActivities(params),
        placeholderData: (previousData) => previousData,
    });
};

// Announcements
export const useHRAnnouncements = () => {
    return useQuery({
        queryKey: ['hr-announcements'],
        queryFn: fetchAnnouncements,
    });
};

// Leave Records
export const useLeaveRecords = (params?: any) => {
    return useQuery({
        queryKey: ['hr-leave-records', params],
        queryFn: () => fetchLeaveRecords(params),
        placeholderData: (prev) => prev
    });
};

// Leave Balances
export const useHRLeaveBalances = (params?: any) => {
    return useQuery({
        queryKey: ['hr-leave-balances', params],
        queryFn: () => fetchLeaveBalances(params),
        placeholderData: (previousData) => previousData,
    });
};

// Leave Allocations
export const useHRLeaveAllocations = () => {
    return useQuery({
        queryKey: ['hr-leave-allocations'],
        queryFn: fetchLeaveAllocations,
    });
};

// Day Off
export const useDayOffAssignments = (params?: any) => {
    return useQuery({
        queryKey: ['hr-day-off-assignments', params],
        queryFn: () => fetchDayOffAssignments(params),
    });
};

export const useDayOffRequests = (params?: any) => {
    return useQuery({
        queryKey: ['hr-day-off-requests', params],
        queryFn: () => fetchDayOffRequests(params),
    });
};

// Supporting Data
export const useHRLeaveTypes = () => {
    return useQuery({
        queryKey: ['hr-leave-types'],
        queryFn: fetchLeaveTypes,
    });
};

export const useHRLeavePolicies = () => {
    return useQuery({
        queryKey: ['hr-leave-policies'],
        queryFn: fetchLeavePolicies,
    });
};

export const useHRDepartments = () => {
    return useQuery({
        queryKey: ['hr-departments'],
        queryFn: fetchDepartments,
    });
};

export const useHRBranches = (compact = false) => {
    return useQuery({
        queryKey: ['hr-branches', compact],
        queryFn: () => fetchBranches(compact),
    });
};

export const useHRDesignations = () => {
    return useQuery({
        queryKey: ['hr-designations'],
        queryFn: fetchDesignations,
    });
};

// Attendance Employee Config
export const useHREmployeeConfigs = () => {
    return useQuery({
        queryKey: ['attendance-employee-configs'],
        queryFn: fetchEmployeeConfigs,
    });
};

export const useWorkingShifts = () => {
    return useQuery({
        queryKey: ['working-shifts'],
        queryFn: fetchWorkingShifts
    });
};

export const useAttendanceSummary = (filters: any) => {
    return useQuery({
        queryKey: ['attendance-summary', filters],
        queryFn: () => fetchAttendanceSummary(filters),
        placeholderData: (prev) => prev
    });
};

export const useAttendanceTimeline = (ulid: string, filters: any) => {
    return useQuery({
        queryKey: ['attendance-timeline', ulid, filters],
        queryFn: () => fetchAttendanceTimeline(ulid, filters),
        enabled: !!ulid
    });
};

export const useHRAttendancePolicies = () => {
    return useQuery({
        queryKey: ['attendance-policies'],
        queryFn: fetchAttendancePolicies,
    });
};

export const useHRActionReport = (params: { employee_id: string; start_date: string; end_date: string }) => {
    return useQuery({
        queryKey: ['hr-action-report', params],
        queryFn: async () => {
            const { data } = await api.get('/hr/action-report', { params });
            return data;
        },
        enabled: !!params.employee_id && !!params.start_date && !!params.end_date,
    });
};

export const useHRActionOverview = (params: { 
    start_date: string; 
    end_date: string; 
    search?: string; 
    branch_id?: string; 
    designation_id?: string; 
    employee_id?: string | string[];
    page?: number; 
    per_page?: number 
}) => {
    return useQuery({
        queryKey: ['hr-action-overview', params],
        queryFn: async () => {
            const { data } = await api.get('/hr/action-report/overview', { params });
            return data;
        },
        placeholderData: (prev) => prev
    });
};

export const exportHRActionOverview = (params: { 
    start_date: string; 
    end_date: string; 
    search?: string; 
    branch_id?: string; 
    designation_id?: string; 
    employee_id?: string | string[];
}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== 'all') {
            if (Array.isArray(value)) {
                queryParams.append(key, value.join(','));
            } else {
                queryParams.append(key, String(value));
            }
        }
    });

    window.open(`/api/hr/action-report/overview/export?${queryParams.toString()}`, '_blank');
};

// --- Mutations ---

// Employees
export const useHREmployeeQr = () => {
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.get(`/attendance/employee-qr/${id}`);
            return data;
        },
    });
};

export const useAttendanceDashboardData = (filters: any) => {
    return useQuery({
        queryKey: ['attendance-dashboard', filters],
        queryFn: async () => {
            const { data } = await api.get('/attendance/dashboard-stats', { params: filters });
            return data;
        },
    });
};

export const useDeleteAttendanceRecord = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number | string) => {
            const { data } = await api.delete(`/attendance/records/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
        },
    });
};

export const useHRDeleteEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number | string) => {
            const { data } = await api.delete(`/hr/employees/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
            queryClient.invalidateQueries({ queryKey: ['hr-employees-filter'] });
        },
    });
};

const cleanParams = (params: any): Record<string, string> => {
    return Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== null && v !== '' && v !== 'all').map(([k, v]) => [k, String(v)])
    );
};


export const exportEmployees = async (params?: any) => {
    const query = new URLSearchParams(cleanParams(params)).toString();
    const url = `/api/hr/employees/export${query ? `?${query}` : ''}`;
    
    // We use a direct fetch or anchor tag approach so browser handles file download properly via stream
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error('Export failed');
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'employees.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
};

export const useHRImportEmployees = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await api.post('/hr/employees/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
            queryClient.invalidateQueries({ queryKey: ['hr-employees-filter'] });
        },
    });
};

// Activities
export const useHRUpdateActivityStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status, admin_note }: { id: number; status: string; admin_note: string }) => {
            const { data } = await api.put(`/hr/activities/${id}/status`, { status, admin_note });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-activities'] });
        },
    });
};

export const useHRDeleteActivity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/hr/activities/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-activities'] });
        },
    });
};

// Announcements
export const useHRUpdateAnnouncementStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, is_published }: { id: number; is_published: boolean }) => {
            const { data } = await api.put(`/hr/announcements/${id}`, { is_published });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-announcements'] });
        },
    });
};

export const useHRDeleteAnnouncement = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/hr/announcements/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-announcements'] });
        },
    });
};

// Leave Records (Existing)
export const useApproveLeave = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.post(`/hr/leave-requests/${id}/approve`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-leave-records'] });
        },
    });
};

export const useRejectLeave = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
            const { data } = await api.post(`/hr/leave-requests/${id}/reject`, { rejection_reason: reason });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-leave-records'] });
        },
    });
};

export const useDeleteLeaveRecord = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/hr/leave-requests/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-leave-records'] });
        },
    });
};

// Day Off Mutations
export const useAssignDayOff = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post('/hr/day-offs', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-day-off-assignments'] });
        },
    });
};

export const useUpdateDayOff = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }: { id: number; [key: string]: any }) => {
            const { data } = await api.put(`/hr/day-offs/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-day-off-assignments'] });
        },
    });
};

export const useDeleteDayOff = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/hr/day-offs/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-day-off-assignments'] });
        },
    });
};

export const useApproveDayOffRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.post(`/hr/day-off-requests/${id}/approve`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-day-off-requests'] });
            queryClient.invalidateQueries({ queryKey: ['hr-day-off-assignments'] });
        },
    });
};

export const useRejectDayOffRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
            const { data } = await api.post(`/hr/day-off-requests/${id}/reject`, { rejection_reason: reason });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-day-off-requests'] });
        },
    });
};

// Leave Balances
export const useHRCreateLeaveBalance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post('/hr/leave-balances', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-leave-balances'] });
        },
    });
};

export const useHRUpdateLeaveBalance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }: any) => {
            const { data } = await api.put(`/hr/leave-balances/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-leave-balances'] });
        },
    });
};

// Leave Allocations
export const useHRDeleteLeaveAllocation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/hr/leave-allocations/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-leave-allocations'] });
        },
    });
};

export const useHRCreateLeaveAllocation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post('/hr/leave-allocations', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-leave-allocations'] });
        },
    });
};

export const useHRUpdateLeaveAllocation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }: any) => {
            const { data } = await api.put(`/hr/leave-allocations/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-leave-allocations'] });
        },
    });
};

// Attendance Employee Config Mutations
export const useHRAttendanceUpdateEmployeeConfig = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }: { id: string; [key: string]: any }) => {
            const { data } = await api.put(`/attendance/employee-config/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance-employee-configs'] });
        },
    });
};

export const useHRAttendanceEmployeeQr = () => {
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.get(`/attendance/employee-qr/${id}`);
            return data;
        },
    });
};

export const useHRImportChunk = () => {
    return useMutation({
        mutationFn: async (rows: any[]) => {
            const { data } = await api.post('/hr/employees/import-chunk', { rows });
            return data;
        },
    });
};
export const exportAttendanceRecords = async (params?: any) => {
    const query = new URLSearchParams(cleanParams(params)).toString();
    const url = `/api/attendance/records/export${query ? `?${query}` : ''}`;

    
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error('Export failed');
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `attendance_records_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
};

export const exportAttendanceSummary = async (params?: any) => {
    const query = new URLSearchParams(cleanParams(params)).toString();
    const url = `/api/attendance/report/summary/export${query ? `?${query}` : ''}`;

    const token = localStorage.getItem('token');
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error('Export failed');
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `attendance_summary_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
};

export const exportHRActivities = async (params?: any) => {
    const query = new URLSearchParams(cleanParams(params)).toString();
    const url = `/api/hr/activities/export${query ? `?${query}` : ''}`;

    
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error('Export failed');
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `hr_activity_log_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
};

export const exportHRActionReport = async (params: { employee_id: string; start_date: string; end_date: string }) => {
    const query = new URLSearchParams(cleanParams(params)).toString();
    const url = `/api/hr/action-report/export${query ? `?${query}` : ''}`;

    const token = localStorage.getItem('token');
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error('Export failed');
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `action_report_${params.employee_id}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
};

export const exportLeaveRecords = async (params?: any) => {
    const query = new URLSearchParams(cleanParams(params)).toString();
    const url = `/api/hr/leave-requests/export${query ? `?${query}` : ''}`;

    const token = localStorage.getItem('token');
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error('Export failed');
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `leave_records_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
};
