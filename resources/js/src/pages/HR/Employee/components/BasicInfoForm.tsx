import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { UniversalFilePicker } from '@/components/ui/universal-file-picker';
import { cn } from '@/lib/utils';

export const BasicInfoForm: React.FC = () => {
    const { t } = useTranslation();
    const { register, formState: { errors }, setValue, watch } = useFormContext();

    const fullName = watch('full_name');
    const dob = watch('date_of_birth');
    const gender = watch('gender');
    const profileImage = watch('profile_image');

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Profile Image Section */}
            <div className="flex flex-col md:flex-row items-start gap-6 border-b pb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/10 shadow-sm shrink-0 bg-muted flex items-center justify-center">
                    {profileImage ? (
                        <img 
                            src={typeof profileImage === 'string' ? profileImage : URL.createObjectURL(profileImage)} 
                            alt={t('profile_photo')} 
                            className="w-full h-full object-cover" 
                        />
                    ) : (
                        <span className="text-3xl font-bold text-muted-foreground">
                            {fullName?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                    )}
                </div>
                <div className="flex-1 space-y-2">
                    <Label>{t('profile_photo')}</Label>
                    <UniversalFilePicker
                        value={profileImage}
                        onChange={(val) => setValue('profile_image', val, { shouldDirty: true })}
                        accept="image/*"
                    />
                    <p className="text-[11px] text-muted-foreground">{t('pick_media_library_or_upload')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <Label htmlFor="full_name" className={errors.full_name ? 'text-destructive' : ''}>
                        {t('full_name_label')} <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                        id="full_name" 
                        {...register('full_name')} 
                        className={cn(errors.full_name && "border-destructive/50 bg-destructive/5 focus-visible:ring-destructive/20")}
                    />
                    {errors.full_name && <p className="text-xs text-destructive">{(errors.full_name as any).message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="employee_id" className={errors.employee_id ? 'text-destructive' : ''}>
                        {t('employee_id_label')} <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                        id="employee_id" 
                        {...register('employee_id')} 
                        className={cn(errors.employee_id && "border-destructive/50 bg-destructive/5 focus-visible:ring-destructive/20")}
                    />
                    {errors.employee_id && <p className="text-xs text-destructive">{(errors.employee_id as any).message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <Label htmlFor="employee_code">{t('employee_code_label')}</Label>
                    <Input id="employee_code" {...register('employee_code')} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email" className={errors.email ? 'text-destructive' : ''}>
                        {t('email_label')} <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                        id="email" 
                        type="email" 
                        {...register('email')} 
                        className={cn(errors.email && "border-destructive/50 bg-destructive/5 focus-visible:ring-destructive/20")}
                    />
                    {errors.email && <p className="text-xs text-destructive">{(errors.email as any).message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <Label htmlFor="phone">{t('phone_label')}</Label>
                    <Input id="phone" type="tel" {...register('phone')} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password" className={errors.password ? 'text-destructive' : ''}>
                        {t('password_label')} {window.location.pathname.includes('/edit') ? `(${t('optional')})` : <span className="text-destructive">*</span>}
                    </Label>
                    <Input 
                        id="password" 
                        type="password" 
                        {...register('password')} 
                        placeholder={window.location.pathname.includes('/edit') ? t('leave_blank_to_keep_current') : ''}
                        className={cn(errors.password && "border-destructive/50 bg-destructive/5 focus-visible:ring-destructive/20")}
                    />
                    {window.location.pathname.includes('/edit') && <p className="text-[10px] text-muted-foreground">{t('keep_blank_if_no_change')}</p>}
                    {errors.password && <p className="text-xs text-destructive">{(errors.password as any).message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-0.5">
                    <Label>{t('dob_label')}</Label>
                    <DatePicker
                        value={dob}
                        onChange={(date) => setValue('date_of_birth', date ? format(date, 'yyyy-MM-dd') : '', { shouldDirty: true })}
                        placeholder={t('select_dob_placeholder')}
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label>{t('gender_label')}</Label>
                    <Select onValueChange={(val) => setValue('gender', val, { shouldDirty: true })} value={gender || ''}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('select_gender_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">{t('male')}</SelectItem>
                            <SelectItem value="female">{t('female')}</SelectItem>
                            <SelectItem value="other">{t('other')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
};
