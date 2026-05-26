import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

export const BankingInfoForm: React.FC = () => {
    const { t } = useTranslation();
    const { register } = useFormContext();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <Label htmlFor="bank_name">{t('bank_name_label')}</Label>
                    <Input id="bank_name" {...register('bank_name')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="account_holder_name">{t('account_holder_label')}</Label>
                    <Input id="account_holder_name" {...register('account_holder_name')} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                    <Label htmlFor="account_number">{t('account_number_label')}</Label>
                    <Input id="account_number" {...register('account_number')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="tax_payer_id">{t('tax_id_label')}</Label>
                    <Input id="tax_payer_id" {...register('tax_payer_id')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="base_salary">{t('base_salary_label')}</Label>
                    <Input id="base_salary" type="number" step="0.01" {...register('base_salary')} />
                </div>
            </div>
        </div>
    );
};
