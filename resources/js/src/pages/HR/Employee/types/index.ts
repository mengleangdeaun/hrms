export interface Branch {
    id: number;
    name: string;
}

export interface Department {
    id: number;
    name: string;
    branches?: Branch[];
}

export interface Designation {
    id: number;
    name: string;
    departments?: Department[];
}

export interface WorkingShift {
    id: number;
    name: string;
}

export interface AttendancePolicy {
    id: number;
    name: string;
}

export interface DocumentType {
    id: number;
    name: string;
    is_required: boolean;
}

export interface EmployeeDocument {
    id: number;
    document_type_id: number;
    document_type?: DocumentType;
    media_url: string;
    media_name: string;
    is_pending?: boolean;
}

export interface Employee {
    id: number;
    ulid: string;
    full_name: string;
    employee_id: string;
    employee_code?: string;
    email: string;
    phone?: string;
    date_of_birth?: string;
    gender?: string;
    branch_id?: string | number;
    department_id?: string | number;
    designation_id?: string | number;
    line_manager_id?: string | number;
    date_of_joining?: string;
    employment_type?: string;
    is_active: boolean;
    is_technician?: boolean;
    is_qc_person?: boolean;
    working_shift_id?: string | number;
    attendance_policy_id?: string | number;
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    emergency_contact_name?: string;
    emergency_contact_relationship?: string;
    emergency_contact_phone?: string;
    bank_name?: string;
    account_holder_name?: string;
    account_number?: string;
    tax_payer_id?: string;
    base_salary?: string | number;
    profile_image_url?: string;
    documents?: EmployeeDocument[];
}
