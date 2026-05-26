import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';

export const ContactInfoForm: React.FC = () => {
    const { t } = useTranslation();
    const { register } = useFormContext();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <Label htmlFor="address_line_1">{t('address_line_1_label')}</Label>
                    <Input id="address_line_1" {...register('address_line_1')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="address_line_2">{t('address_line_2_label')}</Label>
                    <Input id="address_line_2" {...register('address_line_2')} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                    <Label htmlFor="city">{t('city_label')}</Label>
                    <Input id="city" {...register('city')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="state">{t('state_province_label')}</Label>
                    <Input id="state" {...register('state')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="country">{t('country_label')}</Label>
                    <Input id="country" {...register('country')} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <Label htmlFor="postal_code">{t('postal_code_label')}</Label>
                    <Input id="postal_code" {...register('postal_code')} />
                </div>
            </div>

            <Separator />
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('emergency_contact_title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-2">
                        <Label htmlFor="emergency_contact_name">{t('contact_name_label')}</Label>
                        <Input id="emergency_contact_name" {...register('emergency_contact_name')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="emergency_contact_relationship">{t('relationship_label')}</Label>
                        <Input id="emergency_contact_relationship" {...register('emergency_contact_relationship')} placeholder={t('relationship_placeholder')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="emergency_contact_phone">{t('phone_label')}</Label>
                        <Input id="emergency_contact_phone" type="tel" {...register('emergency_contact_phone')} />
                    </div>
                </div>
            </div>
        </div>
    );
};
