import React, { useEffect, useState, useCallback } from 'react';
import api from '@/utils/api';
import {
    IconSettings,
    IconRefresh,
    IconDeviceFloppy,
    IconInfoCircle,
    IconShieldLock,
    IconFileText,
    IconLoader2
} from '@tabler/icons-react';
import { toast } from 'sonner';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import FilterBar from '@/components/ui/FilterBar';
import { CustomQuillEditor } from '@/components/ui/custom-quill-editor';
import { Loader } from '@/components/ui/Loader'
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

interface PwaSettingsData {
    version: string;
    privacy_policy: string;
    terms_of_service: string;
}

const PwaSettings = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [data, setData] = useState<PwaSettingsData>({
        version: '',
        privacy_policy: '',
        terms_of_service: ''
    });

    useEffect(() => {
        dispatch(setPageTitle(t('PWA Settings')));
    }, [dispatch, t]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/settings/pwa-settings');
            setData(response.data);
        } catch (error) {
            toast.error(t('failed_load_settings', 'Failed to load PWA settings'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/settings/pwa-settings', data);
            toast.success(t('pwa_settings_updated', 'PWA settings updated successfully'));
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('failed_update_settings', 'Failed to update settings'));
        } finally {
            setSubmitting(false);
        }
    };

    const removeColors = (field: 'privacy_policy' | 'terms_of_service') => {
        const content = data[field];
        if (!content) return;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        const elementsWithStyle = tempDiv.querySelectorAll('[style]');
        elementsWithStyle.forEach(el => {
            const element = el as HTMLElement;
            element.style.color = '';
            element.style.backgroundColor = '';
            
            if (!element.getAttribute('style')?.trim()) {
                element.removeAttribute('style');
            }
        });
        
        setData({ ...data, [field]: tempDiv.innerHTML });
        toast.success(t('colors_removed', 'Text colors removed for dark mode support'));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader/>
            </div>
        );
    }

    return (
        <div>
            <FilterBar
                title={t('pwa_settings', 'PWA Settings')}
                description={t('pwa_settings_desc', 'Manage PWA versioning, privacy policy, and terms of service.')}
                icon={<IconSettings className="w-6 h-6 text-primary" />}
                onRefresh={fetchData}
                search={search}
                setSearch={setSearch}
                itemsPerPage={10}
                setItemsPerPage={() => { }}
                hideFilter={true}
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                    <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
                        <CardTitle className="text-md flex items-center gap-2">
                            <IconInfoCircle className="w-5 h-5 text-primary" />
                            {t('app_versioning', 'App Versioning')}
                        </CardTitle>
                        <CardDescription>
                            {t('app_versioning_desc', 'Set the current version of the PWA application.')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="max-w-md space-y-2">
                            <Label htmlFor="version" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                                {t('current_version', 'Current Version')}
                            </Label>
                            <Input
                                id="version"
                                value={data.version}
                                onChange={e => setData({ ...data, version: e.target.value })}
                                placeholder="1.0.0"
                                className="h-11 border-slate-200 dark:border-slate-800 font-mono"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-6">
                    <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                        <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4 flex flex-row items-start justify-between">
                            <div>
                                <CardTitle className="text-md flex items-center gap-2">
                                    <IconShieldLock className="w-5 h-5 text-primary" />
                                    {t('privacy_policy', 'Privacy Policy')}
                                </CardTitle>
                                <CardDescription>
                                    {t('privacy_policy_desc', 'Draft and update the privacy policy for PWA users.')}
                                </CardDescription>
                            </div>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => removeColors('privacy_policy')}
                                className="text-xs h-8"
                            >
                                <IconRefresh className="w-3 h-3 mr-1" />
                                {t('reset_colors', 'Reset Colors')}
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <CustomQuillEditor
                                value={data.privacy_policy}
                                onChange={(val: string) => setData({ ...data, privacy_policy: val })}
                            />
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                        <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4 flex flex-row items-start justify-between">
                            <div>
                                <CardTitle className="text-md flex items-center gap-2">
                                    <IconFileText className="w-5 h-5 text-primary" />
                                    {t('terms_of_service', 'Terms of Service')}
                                </CardTitle>
                                <CardDescription>
                                    {t('terms_of_service_desc', 'Draft and update the terms and conditions for PWA users.')}
                                </CardDescription>
                            </div>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => removeColors('terms_of_service')}
                                className="text-xs h-8"
                            >
                                <IconRefresh className="w-3 h-3 mr-1" />
                                {t('reset_colors', 'Reset Colors')}
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <CustomQuillEditor
                                value={data.terms_of_service}
                                onChange={(val: string) => setData({ ...data, terms_of_service: val })}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        disabled={submitting}
                        className="gap-2 px-8 h-12 font-bold shadow-lg shadow-primary/20"
                    >
                        {submitting ? <IconRefresh className="w-5 h-5 animate-spin" /> : <IconDeviceFloppy className="w-5 h-5" />}
                        {t('save_settings', 'Save Settings')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default PwaSettings;
