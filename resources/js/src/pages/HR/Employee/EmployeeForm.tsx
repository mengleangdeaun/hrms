import React, { useState, useEffect } from 'react';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { 
    IconArrowNarrowLeft, 
    IconDeviceFloppy, 
    IconLoader2,
    IconUser,
    IconBriefcase,
    IconPhone,
    IconBuildingBank,
    IconFileDescription,
    IconCircleCheck,
    IconAlertCircle
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import nProgress from 'nprogress';

import { getEmployeeSchema, EmployeeFormValues } from './schema/employeeSchema';
import { useEmployee, useEmployeeMutation, useEmployeeDropdowns } from './hooks/useEmployeeQueries';
import { BasicInfoForm } from './components/BasicInfoForm';
import { EmploymentDetailsForm } from './components/EmploymentDetailsForm';
import { ContactInfoForm } from './components/ContactInfoForm';
import { BankingInfoForm } from './components/BankingInfoForm';
import { DocumentsForm } from './components/DocumentsForm';
import { cn } from '@/lib/utils';

const SECTIONS = [
    { key: 'basic_info_tab', icon: IconUser, component: BasicInfoForm },
    { key: 'employment_details_tab', icon: IconBriefcase, component: EmploymentDetailsForm },
    { key: 'contact_info_tab', icon: IconPhone, component: ContactInfoForm },
    { key: 'banking_info_tab', icon: IconBuildingBank, component: BankingInfoForm },
    { key: 'documents_tab', icon: IconFileDescription, component: DocumentsForm },
];

const STEP_FIELDS = [
    ['full_name', 'employee_id', 'email', 'password', 'phone', 'gender', 'profile_image'],
    ['branch_id', 'department_id', 'designation_id', 'line_manager_id', 'working_shift_id', 'attendance_policy_id', 'employment_type', 'is_active', 'hide_celebration', 'is_technician', 'is_qc_person'],
    ['address_line_1', 'address_line_2', 'city', 'state', 'country', 'postal_code', 'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone'],
    ['bank_name', 'account_holder_name', 'account_number', 'tax_payer_id', 'base_salary'],
    ['documents'],
];

export const EmployeeForm = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams(); // ULID in edit mode
    const isEdit = !!id;
    const queryClient = useQueryClient();

    const [activeSection, setActiveSection] = useState(0);

    // Queries
    const { data: employee, isLoading: isLoadingEmployee } = useEmployee(id);
    const mutation = useEmployeeMutation(id);
    const { data: dropdowns } = useEmployeeDropdowns();
    const requiredTypeIds = React.useMemo(() => {
        return (dropdowns?.documentTypes || [])
            .filter((t: any) => t.is_required === true || t.is_required === 1 || t.is_required === "1")
            .map(t => t.id);
    }, [dropdowns]);

    const dynamicSchema = React.useMemo(() => {
        return getEmployeeSchema(requiredTypeIds, dropdowns?.documentTypes || [], isEdit);
    }, [requiredTypeIds, dropdowns, isEdit]);

    // Form Setup
    const methods = useForm<EmployeeFormValues>({
        resolver: zodResolver(dynamicSchema),
        mode: 'all',
        defaultValues: {
            full_name: '',
            employee_id: '',
            employee_code: '',
            email: '',
            password: '',
            phone: '',
            date_of_birth: '',
            gender: '',
            branch_id: '',
            department_id: '',
            designation_id: '',
            line_manager_id: '',
            date_of_joining: '',
            employment_type: '',
            is_active: true,
            hide_celebration: false,
            is_technician: false,
            is_qc_person: false,
            working_shift_id: '',
            attendance_policy_id: '',
            address_line_1: '',
            address_line_2: '',
            city: '',
            state: '',
            country: '',
            postal_code: '',
            emergency_contact_name: '',
            emergency_contact_relationship: '',
            emergency_contact_phone: '',
            bank_name: '',
            account_holder_name: '',
            account_number: '',
            tax_payer_id: '',
            base_salary: '',
            profile_image: '',
            documents: [],
        }
    });

    const { handleSubmit, reset, watch, control, formState: { isDirty, isSubmitting } } = methods;

    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: 'documents'
    });

    // Auto-append required document types if not present
    useEffect(() => {
        if (dropdowns?.documentTypes && dropdowns.documentTypes.length > 0) {
            const requiredDocTypes = dropdowns.documentTypes.filter((dt: any) => dt.is_required === true || dt.is_required === 1 || dt.is_required === "1");
            const currentDocs = methods.getValues('documents') || [];
            
            requiredDocTypes.forEach((rdt: any) => {
                const exists = currentDocs.some((d: any) => String(d.document_type_id) === String(rdt.id));
                if (!exists) {
                    append({
                        document_type_id: rdt.id,
                        document_type: rdt,
                        media_url: '',
                        media_name: '',
                        is_pending: true
                    });
                }
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dropdowns?.documentTypes?.length, append]);

    // Load data in edit mode
    useEffect(() => {
        if (employee) {
            reset({
                ...employee,
                branch_id: employee.branch_id ? String(employee.branch_id) : '',
                department_id: employee.department_id ? String(employee.department_id) : '',
                designation_id: employee.designation_id ? String(employee.designation_id) : '',
                line_manager_id: employee.line_manager_id ? String(employee.line_manager_id) : '',
                working_shift_id: employee.working_shift_id ? String(employee.working_shift_id) : '',
                attendance_policy_id: employee.attendance_policy_id ? String(employee.attendance_policy_id) : '',
                base_salary: employee.base_salary ? String(employee.base_salary) : '',
                profile_image: employee.profile_image_url || '',
                // Keep password empty by default
                password: '',
            });
        }
    }, [employee, reset]);

    const onSubmit = async (values: EmployeeFormValues) => {
        nProgress.start();
        const tid = toast.loading(isEdit ? t('updating_employee') : t('creating_employee'));
        
        try {
            // Prepare payload
            const formData = new FormData();
            
            // Append basic fields
            Object.entries(values).forEach(([key, val]) => {
                if (key === 'documents' || key === 'profile_image') return;
                if (val === null || val === undefined) return;
                
                // Special handling for boolean
                if (typeof val === 'boolean') {
                    formData.append(key, val ? '1' : '0');
                } else {
                    formData.append(key, String(val));
                }
            });

            // Profile Image (handle both File and String)
            if (values.profile_image instanceof File) {
                formData.append('profile_image', values.profile_image);
            } else if (typeof values.profile_image === 'string' && values.profile_image) {
                // If it's a selection from media library (URL), we send it as profile_image string
                formData.append('profile_image', values.profile_image);
            }

            // Documents
            const documents = values.documents || [];
            documents.forEach((doc: any, index: number) => {
                if (doc.media_url instanceof File) {
                    formData.append(`documents[${index}][media_file]`, doc.media_url);
                } else if (typeof doc.media_url === 'string' && doc.media_url) {
                    formData.append(`documents[${index}][media_url]`, doc.media_url);
                }
                
                if (doc.id) {
                    formData.append(`documents[${index}][id]`, String(doc.id));
                }
                
                formData.append(`documents[${index}][document_type_id]`, String(doc.document_type_id));
                if (doc.media_name) {
                    formData.append(`documents[${index}][media_name]`, doc.media_name);
                }
            });

            await mutation.mutateAsync(formData);
            
            toast.success(isEdit ? t('success_update_employee') : t('success_create_employee'), { id: tid });
            navigate('/hr/employees');
        } catch (err: any) {
            const msg = err.response?.data?.message || t('error_occurred');
            toast.error(msg, { id: tid });
        } finally {
            nProgress.done();
        }
    };

    if (isEdit && isLoadingEmployee) {
        return (
            <div className="flex flex-col items-center justify-center h-80 gap-3">
                <IconLoader2 className="animate-spin text-primary" size={40} />
                <p className="text-sm font-medium text-muted-foreground">{t('loading_employee_data')}</p>
            </div>
        );
    }

    const onFormError = (errors: any) => {
        console.error("Form Validation Errors:", errors);
        toast.error(t('fix_errors_before_proceeding') || 'Please fix the highlighted errors before proceeding.', { duration: 3000 });
        
        // Auto-navigate to the first tab that has an error
        const sectionHasError = SECTIONS.findIndex(section => {
            if (section.key === 'documents_tab') return !!errors.documents;
            const fieldsInTab = STEP_FIELDS[SECTIONS.indexOf(section)];
            return fieldsInTab.some(field => !!errors[field as keyof EmployeeFormValues]);
        });
        
        if (sectionHasError !== -1) {
            setActiveSection(sectionHasError);
        }
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit, onFormError)} className="space-y-6 mx-auto pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-20 bg-transparent py-4 pt-0 border-b">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isEdit ? t('edit_employee') : t('add_new_employee')}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {isEdit ? t('update_employee_desc') : t('create_employee_desc')}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            type="button" 
                            onClick={() => navigate('/hr/employees')}
                            disabled={isSubmitting}
                        >
                            <IconArrowNarrowLeft className="mr-2" size={18} /> {t('back_btn_label')}
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={!isDirty || isSubmitting}
                            className="bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        >
                            {isSubmitting ? (
                                <IconLoader2 className="mr-2 animate-spin" size={18} />
                            ) : (
                                <IconDeviceFloppy className="mr-2" size={18} />
                            )}
                            {isEdit ? t('save_changes') : t('create_employee')}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-8">
                    {/* Navigation Sidebar */}
                    <aside className="space-y-1 sticky top-24 h-fit p-4 rounded-lg bg-card border">
                        {SECTIONS.map((section, idx) => {
                            const Icon = section.icon;
                            const isActive = activeSection === idx;
                            return (
                                <button
                                    key={section.key}
                                    type="button"
                                    onClick={() => setActiveSection(idx)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-all",
                                        isActive 
                                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/10" 
                                            : "hover:bg-accent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Icon size={18} />
                                    {t(section.key)}
                                    {/* Sidebar error or checkmark */}
                                    {(() => {
                                        let hasError = false;
                                        if (section.key === 'documents_tab') {
                                            hasError = !!methods.formState.errors.documents;
                                        } else {
                                            const fieldsInTab = STEP_FIELDS[idx];
                                            hasError = fieldsInTab.some(field => !!methods.formState.errors[field as keyof EmployeeFormValues]);
                                        }

                                        if (hasError) {
                                            return <IconAlertCircle size={14} className="ml-auto text-destructive" />;
                                        }
                                        if (!isActive && isDirty) {
                                            return <IconCircleCheck size={14} className="ml-auto text-emerald-500 opacity-50" />;
                                        }
                                        return null;
                                    })()}
                                </button>
                            );
                        })}
                    </aside>

                    {/* Form Content Area */}
                    <main className="bg-card border rounded-lg p-6 md:p-8 shadow-sm min-h-[500px]">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                {t(SECTIONS[activeSection].key)}
                            </h2>
                            <Separator className="mt-4" />
                        </div>
                        
                        {/* Render active section with props */}
                        {React.createElement(SECTIONS[activeSection].component as any, {
                            fields: fields || [],
                            append,
                            remove,
                            dropdowns
                        })}

                        {/* Navigation Buttons inside content */}
                        <div className="flex justify-between mt-12 pt-6 border-t">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setActiveSection(prev => Math.max(0, prev - 1))}
                                disabled={activeSection === 0}
                            >
                                {t('previous')}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={async () => {
                                    const fields = STEP_FIELDS[activeSection];
                                    const isValid = await methods.trigger(fields as any);
                                    
                                    if (isValid) {
                                        if (activeSection < SECTIONS.length - 1) {
                                            setActiveSection(prev => prev + 1);
                                        } else {
                                            handleSubmit(onSubmit, onFormError)();
                                        }
                                    } else {
                                        // Scroll to first error if needed
                                        toast.error(t('fix_errors_before_proceeding'), { duration: 2000 });
                                    }
                                }}
                            >
                                {activeSection === SECTIONS.length - 1 ? t('finish_and_save') : t('next_step')}
                            </Button>
                        </div>
                    </main>
                </div>
            </form>
        </FormProvider>
    );
};

// Separator helper (since it's common)
const Separator = ({ className }: { className?: string }) => (
    <div className={cn("h-px bg-border w-full", className)} />
);
