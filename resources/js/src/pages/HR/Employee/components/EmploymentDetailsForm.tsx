import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { useEmployeeDropdowns } from '../hooks/useEmployeeQueries';

export const EmploymentDetailsForm: React.FC = () => {
    const { t } = useTranslation();
    const { formState: { errors }, setValue, watch } = useFormContext();
    const { data: dropdowns, isLoading } = useEmployeeDropdowns();

    const branchId = watch('branch_id');
    const departmentId = watch('department_id');
    const designationId = watch('designation_id');
    const lineManagerId = watch('line_manager_id');
    const doj = watch('date_of_joining');
    const employmentType = watch('employment_type');
    const isActive = watch('is_active');
    const hideCelebration = watch('hide_celebration');
    const shiftId = watch('working_shift_id');
    const policyId = watch('attendance_policy_id');
    const isTechnician = watch('is_technician');
    const isQCPerson = watch('is_qc_person');

    // Filters
    const filteredDepartments = branchId
        ? dropdowns?.departments.filter(d => d.branches?.some(b => String(b.id) === String(branchId)))
        : dropdowns?.departments;

    const filteredDesignations = departmentId
        ? dropdowns?.designations.filter(d => d.departments?.some(dept => String(dept.id) === String(departmentId)))
        : dropdowns?.designations;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <Label className={errors.branch_id ? 'text-destructive' : ''}>
                        {t('branch_label')} <span className="text-destructive">*</span>
                    </Label>
                    <Select 
                        onValueChange={(val) => {
                            setValue('branch_id', val, { shouldDirty: true });
                            setValue('department_id', '', { shouldDirty: true });
                            setValue('designation_id', '', { shouldDirty: true });
                        }} 
                        value={branchId ? String(branchId) : ''}
                    >
                        <SelectTrigger error={!!errors.branch_id}>
                            <SelectValue placeholder={t('select_branch_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {dropdowns?.branches && dropdowns.branches.length > 0 ? (
                                dropdowns.branches.map(b => (
                                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                ))
                            ) : (
                                <SelectItem value="none" disabled className="text-muted-foreground italic text-xs">
                                    {t('no_data_available', 'No data available')}
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    {errors.branch_id && <p className="text-xs text-destructive">{(errors.branch_id as any).message}</p>}
                </div>

                <div className="space-y-2">
                    <Label className={errors.department_id ? 'text-destructive' : ''}>
                        {t('department_label')} <span className="text-destructive">*</span>
                    </Label>
                    <Select 
                        onValueChange={(val) => {
                            setValue('department_id', val, { shouldDirty: true });
                            setValue('designation_id', '', { shouldDirty: true });
                        }} 
                        value={departmentId ? String(departmentId) : ''}
                        disabled={!branchId}
                    >
                        <SelectTrigger error={!!errors.department_id}>
                            <SelectValue placeholder={t('select_department_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredDepartments && filteredDepartments.length > 0 ? (
                                filteredDepartments.map(d => (
                                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                ))
                            ) : (
                                <SelectItem value="none" disabled className="text-muted-foreground italic text-xs">
                                    {t('no_data_available', 'No data available')}
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    {errors.department_id && <p className="text-xs text-destructive">{(errors.department_id as any).message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <Label className={errors.designation_id ? 'text-destructive' : ''}>
                        {t('designation_label')} <span className="text-destructive">*</span>
                    </Label>
                    <Select 
                        onValueChange={(val) => setValue('designation_id', val, { shouldDirty: true })} 
                        value={designationId ? String(designationId) : ''}
                        disabled={!departmentId}
                    >
                        <SelectTrigger error={!!errors.designation_id}>
                            <SelectValue placeholder={t('select_designation_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredDesignations && filteredDesignations.length > 0 ? (
                                filteredDesignations.map(d => (
                                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                ))
                            ) : (
                                <SelectItem value="none" disabled className="text-muted-foreground italic text-xs">
                                    {t('no_data_available', 'No data available')}
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    {errors.designation_id && <p className="text-xs text-destructive">{(errors.designation_id as any).message}</p>}
                </div>

                <div className="space-y-0.5">
                    <Label>{t('line_manager_label')}</Label>
                    <SearchableSelect
                        options={dropdowns?.employees.map(e => ({ value: String(e.id), label: `${e.full_name} (${e.employee_id})` })) || []}
                        value={lineManagerId ? String(lineManagerId) : ''}
                        onChange={(val) => setValue('line_manager_id', val, { shouldDirty: true })}
                        placeholder={t('select_manager_placeholder')}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-0.5">
                    <Label>{t('doj_label')}</Label>
                    <DatePicker
                        value={doj}
                        onChange={(date) => setValue('date_of_joining', date ? format(date, 'yyyy-MM-dd') : '', { shouldDirty: true })}
                        placeholder={t('select_doj_placeholder')}
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className={errors.employment_type ? 'text-destructive' : ''}>
                        {t('employment_type_label')} <span className="text-destructive">*</span>
                    </Label>
                    <Select onValueChange={(val) => setValue('employment_type', val, { shouldDirty: true, shouldValidate: true })} value={employmentType || ''}>
                        <SelectTrigger error={!!errors.employment_type}>
                            <SelectValue placeholder={t('select_type_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="full_time">{t('full_time')}</SelectItem>
                            <SelectItem value="part_time">{t('part_time')}</SelectItem>
                            <SelectItem value="contract">{t('contract')}</SelectItem>
                            <SelectItem value="intern">{t('intern')}</SelectItem>
                            <SelectItem value="freelance">{t('freelance')}</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.employment_type && <p className="text-xs text-destructive">{(errors.employment_type as any).message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <Label>{t('working_shift_label')}</Label>
                    <Select onValueChange={(val) => setValue('working_shift_id', val, { shouldDirty: true })} value={shiftId ? String(shiftId) : ''}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('select_shift_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {dropdowns?.workingShifts && dropdowns.workingShifts.length > 0 ? (
                                dropdowns.workingShifts.map(s => (
                                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                ))
                            ) : (
                                <SelectItem value="none" disabled className="text-muted-foreground italic text-xs">
                                    {t('no_data_available', 'No data available')}
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>{t('attendance_policy_label')}</Label>
                    <Select onValueChange={(val) => setValue('attendance_policy_id', val, { shouldDirty: true })} value={policyId ? String(policyId) : ''}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('select_policy_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {dropdowns?.attendancePolicies && dropdowns.attendancePolicies.length > 0 ? (
                                dropdowns.attendancePolicies.map(p => (
                                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                ))
                            ) : (
                                <SelectItem value="none" disabled className="text-muted-foreground italic text-xs">
                                    {t('no_data_available', 'No data available')}
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t mt-4">
                <div className="space-y-4">
                    <Label className="text-sm font-bold">{t('active_status_label', 'Account Status')}</Label>
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                                type="radio" 
                                checked={isActive === true} 
                                onChange={() => setValue('is_active', true, { shouldDirty: true })}
                                className="w-4 h-4 text-primary focus:ring-primary border-gray-300 transition-all group-hover:scale-110"
                            />
                            <span className="text-sm font-medium">{t('active', 'Active')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                                type="radio" 
                                checked={isActive === false} 
                                onChange={() => setValue('is_active', false, { shouldDirty: true })}
                                className="w-4 h-4 text-primary focus:ring-primary border-gray-300 transition-all group-hover:scale-110"
                            />
                            <span className="text-sm font-medium">{t('inactive', 'Inactive')}</span>
                        </label>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">
                        {t('active_status_help', 'Controls if this employee can log in to the system.')}
                    </p>
                </div>

                <div className="space-y-4">
                    <Label className="text-sm font-bold text-orange-600 dark:text-orange-400">
                        {t('celebration_privacy_label', 'Celebration Privacy')}
                    </Label>
                    <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-950/20 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30">
                        <Checkbox 
                            id="hide_celebration_toggle"
                            checked={hideCelebration} 
                            onCheckedChange={(checked) => setValue('hide_celebration', checked, { shouldDirty: true })}
                            className="w-5 h-5 rounded border-orange-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                        <div className="flex flex-col">
                            <label htmlFor="hide_celebration_toggle" className="text-sm font-black text-orange-900 dark:text-orange-100 cursor-pointer">
                                {t('hide_from_celebrations', 'Hide from Celebrations')}
                            </label>
                            <p className="text-[10px] text-orange-700/70 dark:text-orange-300/50 leading-tight">
                                {t('hide_celebration_help', 'Enable this for top management or private profiles to hide birthdays/anniversaries from everyone.')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <Label className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {t('staff_roles_label', 'Specialized Roles')}
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <Checkbox 
                                id="is_technician_toggle"
                                checked={isTechnician} 
                                onCheckedChange={(checked) => setValue('is_technician', checked, { shouldDirty: true })}
                                className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="flex flex-col">
                                <label htmlFor="is_technician_toggle" className="text-sm font-black text-blue-900 dark:text-blue-100 cursor-pointer">
                                    {t('is_technician', 'Is Technician')}
                                </label>
                                <p className="text-[10px] text-blue-700/70 dark:text-blue-300/50 leading-tight">
                                    {t('is_technician_help', 'Flag as workshop technician.')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                            <Checkbox 
                                id="is_qc_person_toggle"
                                checked={isQCPerson} 
                                onCheckedChange={(checked) => setValue('is_qc_person', checked, { shouldDirty: true })}
                                className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="flex flex-col">
                                <label htmlFor="is_qc_person_toggle" className="text-sm font-black text-indigo-900 dark:text-indigo-100 cursor-pointer">
                                    {t('is_qc_person', 'Is QC Auditor')}
                                </label>
                                <p className="text-[10px] text-indigo-700/70 dark:text-indigo-300/50 leading-tight">
                                    {t('is_qc_person_help', 'Authorized for quality control.')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
