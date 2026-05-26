import { z } from 'zod';

export const getEmployeeSchema = (requiredTypeIds: number[] = [], allDocTypes: any[] = [], isEdit: boolean = false) => {
    return z.object({
        full_name: z.string().min(1, 'Full name is required'),
        employee_id: z.string().min(1, 'Employee ID is required'),
        employee_code: z.string().optional().nullable(),
        email: z.string().min(1, 'Email is required').email('Invalid email address'),
        password: isEdit 
            ? z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal(''))
            : z.string().min(6, 'Password is required and must be at least 6 characters'),
        phone: z.string().optional().nullable(),
        date_of_birth: z.string().optional().nullable(),
        gender: z.string().optional().nullable(),
        
        // Employment
        branch_id: z.string().min(1, 'Branch is required').or(z.number()),
        department_id: z.string().min(1, 'Department is required').or(z.number()),
        designation_id: z.string().min(1, 'Designation is required').or(z.number()),
        line_manager_id: z.string().optional().nullable().or(z.number()),
        date_of_joining: z.string().optional().nullable(),
        employment_type: z.string().min(1, 'Employment type is required'),
        is_active: z.boolean(),
        hide_celebration: z.boolean().optional(),
        is_technician: z.boolean().optional(),
        is_qc_person: z.boolean().optional(),
        working_shift_id: z.string().optional().nullable().or(z.number()),
        attendance_policy_id: z.string().optional().nullable().or(z.number()),

        // Contact
        address_line_1: z.string().optional().nullable(),
        address_line_2: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
        country: z.string().optional().nullable(),
        postal_code: z.string().optional().nullable(),
        emergency_contact_name: z.string().optional().nullable(),
        emergency_contact_relationship: z.string().optional().nullable(),
        emergency_contact_phone: z.string().optional().nullable(),

        // Banking
        bank_name: z.string().optional().nullable(),
        account_holder_name: z.string().optional().nullable(),
        account_number: z.string().optional().nullable(),
        tax_payer_id: z.string().optional().nullable(),
        base_salary: z.string().optional().nullable().or(z.number()),

        // Profile Image
        profile_image: z.any().optional(), // Can be file or url

        // Documents
        documents: z.array(z.object({
            id: z.number().or(z.string()).optional(),
            document_type_id: z.number().or(z.string()),
            media_url: z.any()
                .refine(val => !!val, "File is required")
                .refine(val => {
                    if (val instanceof File) {
                        return val.size <= 30 * 1024 * 1024;
                    }
                    return true;
                }, "File size must be less than 30MB"),
            media_name: z.string().optional().nullable(),
            is_pending: z.boolean().optional(),
            document_type: z.any().optional(),
        })).superRefine((docs, ctx) => {
            requiredTypeIds.forEach(reqId => {
                // Ensure the slot exists structurally; rely on inline validation for the actual file upload
                const hasDoc = docs.some(d => Number(d.document_type_id) === Number(reqId));
                
                if (!hasDoc) {
                    const typeName = allDocTypes.find(t => Number(t.id) === Number(reqId))?.name || reqId;
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: `Document slot "${typeName}" is missing`,
                        path: [] // Global error for the documents array
                    });
                }
            });
        }),
    });
};
export const employeeSchema = getEmployeeSchema();

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

export const getEmployeeDocumentSchema = (requiredDocTypeIds: number[]) => {
    return z.array(z.object({
        document_type_id: z.number().or(z.string()),
        media_url: z.string().min(1, 'File is required'),
        media_name: z.string().min(1),
        is_pending: z.boolean().optional(),
    })).superRefine((docs, ctx) => {
        requiredDocTypeIds.forEach(reqId => {
            const hasDoc = docs.some(d => Number(d.document_type_id) === reqId);
            if (!hasDoc) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Required document type ${reqId} is missing`,
                    path: [docs.length] // Point to the end or handled specifically in UI
                });
            }
        });
    });
};
