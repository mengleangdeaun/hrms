import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    IconBrandTelegram, IconDeviceFloppy, IconPlugConnected,
    IconPlugConnectedX, IconEye, IconEyeOff, IconSettings,
    IconInfoCircle, IconLoader2, IconShieldCheck, IconMessage,
    IconBroadcast, IconBuildingStore
} from '@tabler/icons-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useBranches } from '@/hooks/useInventoryData';
import BroadcastSettingsIndex from './BroadcastSettingsIndex';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

const SectionCard = ({
    icon, iconColor, title, description, children, badge
}: {
    icon: React.ReactNode;
    iconColor: string;
    title: string;
    description?: string;
    children: React.ReactNode;
    badge?: string;
}) => (
    <div className="rounded-2xl border shadow-sm border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col h-full">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconColor}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                        {badge && <span className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">{badge}</span>}
                    </div>
                    {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
                </div>
            </div>
        </div>
        <div className="px-6 py-5 flex-1 space-y-6">
            {children}
        </div>
    </div>
);

export default function TelegramSettings() {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        bot_token: '',
        global_chat_id: '',
        global_topic_id: '',
        is_active: false,
    });
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Telegram Settings'));
    }, [dispatch]);

    const { data: branches = [] } = useBranches();
    const [selectedBranchId, setSelectedBranchId] = useState<string | number | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasExistingToken, setHasExistingToken] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);
    const [botUsername, setBotUsername] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('config');

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
    };

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedBranchId) params.append('branch_id', selectedBranchId.toString());

        fetch(`/api/settings/telegram-settings?${params.toString()}`, { headers, credentials: 'include' })
            .then(r => r.json())
            .then((data) => {
                if (data) {
                    setForm({
                        bot_token: '',
                        global_chat_id: data.global_chat_id || '',
                        global_topic_id: data.global_topic_id || '',
                        is_active: data.is_active,
                    });
                    setHasExistingToken(data.has_token);
                    setBotUsername(data.bot_username);
                } else {
                    setForm({
                        bot_token: '',
                        global_chat_id: '',
                        global_topic_id: '',
                        is_active: false,
                    });
                    setHasExistingToken(false);
                    setBotUsername(null);
                }
            })
            .catch(() => toast.error(t('failed_load_settings_msg')))
            .finally(() => setLoading(false));
    }, [selectedBranchId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/sanctum/csrf-cookie');
            const payload: any = { ...form, branch_id: selectedBranchId };
            if (!form.bot_token) delete payload.bot_token;

            const res = await fetch('/api/settings/telegram-settings', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                toast.success(t('telegram_settings_saved_successfully'));
                setHasExistingToken(true);
                setForm(f => ({ ...f, bot_token: '' }));
            } else {
                toast.error(t('failed_to_save_settings'));
            }
        } catch {
            toast.error(t('network_error', 'A network error occurred'));
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setConnectionStatus(null);
        try {
            await fetch('/sanctum/csrf-cookie');
            const res = await fetch('/api/settings/telegram-settings/test', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({ branch_id: selectedBranchId })
            });
            const data = await res.json();
            setConnectionStatus(data);
            if (data.success) {
                setBotUsername(data.bot?.username || null);
                toast.success(t('success_label'), { description: t('test_message_sent_msg') });
            } else {
                toast.error(t('error_label'), { description: data.message || t('failed_send_test_msg') });
            }
        } catch {
            toast.error(t('error_label'), { description: t('failed_send_test_msg') });
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2.5 rounded-xl shadow-sm">
                        <IconBrandTelegram className="text-primary w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight drop-shadow-sm">
                            {t('telegram_settings')}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Global Branch Selector - Moved from Tab Content for better UX */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm animate-in slide-in-from-top-2 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-xl text-amber-600 dark:text-amber-400">
                            <IconBuildingStore size={22} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{t('config_context', 'Configuration Context')}</h3>
                            <p className="text-[11px] text-gray-500 leading-tight">{t('config_context_desc', 'Select whether to configure a global bot or a branch-specific override.')}</p>
                        </div>
                    </div>
                    <div className="w-full md:w-80">
                        <SearchableSelect
                            options={[
                                { value: '', label: t('global_default_system', 'Global (Default System)') },
                                ...branches.map((b: any) => ({ value: b.id.toString(), label: b.name }))
                            ]}
                            value={selectedBranchId?.toString() || ''}
                            onChange={(val) => setSelectedBranchId(val ? parseInt(val.toString()) : null)}
                            placeholder={t('select_branch_placeholder', 'Select Branch...')}
                        />
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1 h-10 border border-slate-200 dark:border-slate-800 w-max">
                        <TabsTrigger value="config" className="px-6 font-bold flex gap-2 items-center">
                            <IconSettings size={16} />
                            {t('bot_configuration_title')}
                        </TabsTrigger>
                        <TabsTrigger value="broadcast" className="px-6 font-bold flex gap-2 items-center">
                            <IconBroadcast size={16} />
                            {t('broadcast_channels', 'Broadcast Channels')}
                        </TabsTrigger>
                    </TabsList>

                    {activeTab === 'config' && (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                            <Button 
                                variant="outline" 
                                onClick={handleTest} 
                                disabled={testing || (!hasExistingToken && !form.bot_token)} 
                                className="gap-2 h-10 bg-white dark:bg-gray-900 transition-all font-bold border-slate-200 dark:border-slate-800"
                            >
                                {testing ? <IconLoader2 size={16} className="animate-spin" /> : <IconPlugConnected size={16} />}
                                {testing ? t('testing_label') : t('test_connection_btn')}
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="gap-2 h-10 font-bold"
                            >
                                {saving ? <IconLoader2 size={16} className="animate-spin" /> : <IconDeviceFloppy size={16} />}
                                {saving ? t('saving_label') : t('save_changes_btn')}
                            </Button>
                        </div>
                    )}
                </div>

                <TabsContent value="config" className="space-y-6 animate-in fade-in duration-300">
                    {!selectedBranchId && (
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex items-center gap-3 text-xs text-blue-700 dark:text-blue-300">
                            <IconInfoCircle size={18} className="shrink-0" />
                            <p>{t('global_config_info', 'You are managing the Global Configuration. Branches without their own settings will inherit these credentials.')}</p>
                        </div>
                    )}
                    {selectedBranchId && !hasExistingToken && (
                        <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4 flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300">
                            <IconInfoCircle size={18} className="shrink-0" />
                            <p>{t('branch_inheriting_info', 'This branch is currently Inheriting global settings. Providing a token here will create a priority override.')}</p>
                        </div>
                    )}

                    {loading ? (
                        /* Skeleton Loader */
                        <div className="animate-pulse">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2].map((i) => (
                                    <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm h-[320px]">
                                        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                                                <div className="space-y-2">
                                                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32" />
                                                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-48" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6 space-y-6">
                                            <div className="space-y-2">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24" />
                                                <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg w-full" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24" />
                                                <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg w-full" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {botUsername && (
                                <div className="flex items-center gap-3 mb-6 px-5 py-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm animate-in fade-in">
                                    <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
                                        <IconBrandTelegram className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-sm text-blue-800 dark:text-blue-300">
                                        {t('successfully_authenticated_as')} <span className="font-bold text-blue-900 dark:text-blue-200">@{botUsername}</span>
                                    </span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SectionCard
                                    icon={<IconShieldCheck size={18} className="text-purple-600 dark:text-purple-400" />}
                                    iconColor="bg-purple-100 dark:bg-purple-900/40"
                                    title={t('bot_configuration_title')}
                                    description={t('bot_configuration_desc')}
                                >
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between group">
                                            <div className="space-y-1 pr-6">
                                                <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100 !mb-0">
                                                    {t('enable_notifications_label')}
                                                </Label>
                                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                                                    {t('activate_telegram_alerts_desc')}
                                                </p>
                                            </div>
                                            <Switch 
                                                checked={form.is_active} 
                                                onCheckedChange={(checked) => setForm(f => ({ ...f, is_active: checked }))} 
                                                className="data-[state=checked]:bg-primary"
                                            />
                                        </div>

                                        <div className="h-px bg-gray-100 dark:bg-gray-800/60" />

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                    {t('bot_api_token_label')}
                                                </Label>
                                                {hasExistingToken && (
                                                    <span className="text-[10px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 flex items-center py-0.5 rounded border border-emerald-100 dark:border-emerald-500/20">
                                                        {t('token_configured_badge')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    type={showToken ? 'text' : 'password'}
                                                    value={form.bot_token}
                                                    onChange={e => setForm(f => ({ ...f, bot_token: e.target.value }))}
                                                    placeholder={hasExistingToken ? '••••••••••••••••••••' : t('bot_token_placeholder')}
                                                    className="font-mono pr-12 h-10 bg-gray-50/50 dark:bg-gray-950/50 focus-visible:ring-primary"
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => setShowToken(s => !s)} 
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 rounded-md transition-colors"
                                                >
                                                    {showToken ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1.5 flex gap-1.5 items-center">
                                                <IconInfoCircle className="w-3.5 h-3.5 shrink-0" />
                                                {t('obtain_token_desc')}
                                            </p>
                                        </div>
                                    </div>
                                </SectionCard>

                                <SectionCard
                                    icon={<IconMessage size={18} className="text-sky-600 dark:text-sky-400" />}
                                    iconColor="bg-sky-100 dark:bg-sky-900/40"
                                    title={t('global_chat_target_title')}
                                    description={t('global_chat_target_desc')}
                                >
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                {t('global_chat_id_label')}
                                            </Label>
                                            <Input
                                                value={form.global_chat_id}
                                                onChange={e => setForm(f => ({ ...f, global_chat_id: e.target.value }))}
                                                placeholder="-100123456789"
                                                className="font-mono h-10 bg-gray-50/50 dark:bg-gray-950/50 focus-visible:ring-primary"
                                            />
                                            <p className="text-xs text-gray-500 mt-1.5">
                                                {t('global_chat_id_desc')}
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                {t('global_topic_id_label')} <span className="text-gray-400 font-normal">({t('global_topic_id_optional')})</span>
                                            </Label>
                                            <Input
                                                value={form.global_topic_id}
                                                onChange={e => setForm(f => ({ ...f, global_topic_id: e.target.value }))}
                                                placeholder="123"
                                                className="font-mono h-10 bg-gray-50/50 dark:bg-gray-950/50 focus-visible:ring-primary"
                                            />
                                            <p className="text-xs text-gray-500 mt-1.5">
                                                {t('global_topic_id_desc')}
                                            </p>
                                        </div>
                                    </div>
                                </SectionCard>
                            </div>

                            <div className="bg-amber-50/50 dark:bg-amber-950/50 border border-amber-100/60 dark:border-amber-900/40 rounded-2xl p-6 shadow-sm">
                                <div className="flex gap-4">
                                    <div className="mt-1 bg-amber-100 dark:bg-amber-900/50 p-2 rounded-xl h-max">
                                        <IconSettings className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-amber-800 dark:text-amber-300">{t('targeted_setup_title')}</h3>
                                        <p className="text-sm text-amber-700/80 dark:text-amber-500 text-pretty">
                                            {t('targeted_setup_desc', 'You can also set up granular Telegram notifications that go exclusively to specific branches or departments.')}
                                        </p>
                                        <ol className="text-sm text-amber-700/80 dark:text-amber-500 space-y-2 list-decimal list-outside ml-4">
                                            <li className="pl-1">{t('targeted_setup_step1', 'Add your configured bot to the specific Telegram group or channel.')}</li>
                                            <li className="pl-1">{t('targeted_setup_step2', 'Navigate to HR → Branches or HR → Departments in the sidebar.')}</li>
                                            <li className="pl-1">{t('targeted_setup_step3', 'Edit the branch/department and insert its specific Chat ID and Topic ID.')}</li>
                                            <li className="pl-1">{t('targeted_setup_step4', 'When composing a new announcement, select the target audience, and the message will automatically reach the correct group.')}</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="broadcast" className="animate-in fade-in duration-300">
                    <BroadcastSettingsIndex selectedBranchId={selectedBranchId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
