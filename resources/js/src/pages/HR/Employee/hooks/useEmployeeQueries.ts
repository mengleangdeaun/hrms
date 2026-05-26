import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import { Employee, Branch, Department, Designation, WorkingShift, AttendancePolicy, DocumentType } from '../types';

export const useEmployeeDropdowns = () => {
    return useQuery({
        queryKey: ['employee-dropdowns'],
        queryFn: async () => {
            const [
                branches,
                departments,
                designations,
                workingShifts,
                attendancePolicies,
                employees,
                documentTypes
            ] = await Promise.all([
                api.get('/hr/branches?compact=true').then(r => r.data),
                api.get('/hr/departments?compact=true').then(r => r.data),
                api.get('/hr/designations?compact=true').then(r => r.data),
                api.get('/attendance/working-shifts?compact=true').then(r => r.data),
                api.get('/attendance/attendance-policies?compact=true').then(r => r.data),
                api.get('/hr/employees?compact=true').then(r => r.data),
                api.get('/hr/document-types?compact=true').then(r => r.data),
            ]);

            return {
                branches: (branches || []) as Branch[],
                departments: (departments || []) as Department[],
                designations: (designations || []) as Designation[],
                workingShifts: (workingShifts || []) as WorkingShift[],
                attendancePolicies: (attendancePolicies || []) as AttendancePolicy[],
                employees: (employees || []) as any[],
                documentTypes: (documentTypes || []) as DocumentType[],
            };
        },
        staleTime: 5 * 60 * 1000,
    });
};

export const useEmployee = (idOrUlid?: string | number) => {
    return useQuery({
        queryKey: ['employee', idOrUlid],
        queryFn: async () => {
            if (!idOrUlid) return null;
            const { data } = await api.get(`/hr/employees/${idOrUlid}`);
            return data as Employee;
        },
        enabled: !!idOrUlid,
    });
};

export const useEmployeeMutation = (idOrUlid?: string | number) => {
    const queryClient = useQueryClient();
    const isEdit = !!idOrUlid;

    return useMutation({
        mutationFn: async (payload: any) => {
            if (isEdit) {
                // If it's a FormData (for files), we need to append _method: PUT
                if (payload instanceof FormData) {
                    payload.append('_method', 'PUT');
                    const { data } = await api.post(`/hr/employees/${idOrUlid}`, payload);
                    return data;
                }
                const { data } = await api.put(`/hr/employees/${idOrUlid}`, payload);
                return data;
            } else {
                const { data } = await api.post('/hr/employees', payload);
                return data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
            if (isEdit) {
                queryClient.invalidateQueries({ queryKey: ['employee', idOrUlid] });
            }
        },
    });
};
