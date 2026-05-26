import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
    IconSend, 
    IconSettings, 
    IconLoader2,
    IconBroadcast,
    IconTools,
    IconShoppingCart,
    IconUsers,
    IconClock,
    IconDeviceFloppy,
    IconArrowBackUp,
    IconAlertCircle
} from '@tabler/icons-react';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import TableSkeleton from '@/components/ui/TableSkeleton';

interface BroadcastAction {
    id: number;
    action_key: string;
    label: string;
    category: string;
    chat_id: string | null;
    topic_id: string | null;
    is_enabled: boolean;
    custom_remark: string | null;
    is_override?: boolean;
}

interface Props {
    selectedBranchId?: string | number | null;
}

const BroadcastSettingsIndex = ({ selectedBranchId }: Props) => {
    const { t } = useTranslation();
    const [actions, setActions] = useState<BroadcastAction[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [testingId, setTestingId] = useState<number | null>(null);
    const [resettingId, setResettingId] = useState<number | null>(null);

    const fetchSettings = async () => {
        setLoading(true);
        setActions([]); // Reset to show skeleton clearly
        try {
            const params = new URLSearchParams();
            if (selectedBranchId) params.append('branch_id', selectedBranchId.toString());
            
            const res = await fetch(`/api/settings/broadcast-settings?${params.toString()}`);
            const data = await res.json();
            setActions(data);
        } catch {
            toast.error(t('failed_load_broadcast_settings', 'Failed to load broadcast settings'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, [selectedBranchId]);

    const handleUpdate = async (action: BroadcastAction, updates: Partial<BroadcastAction>) => {
        const previousActions = [...actions];
        
        // Optimistic UI update
        const updatedAction = { ...action, ...updates };
        setActions(prev => prev.map(a => a.id === action.id ? updatedAction : a));
        
        setSavingId(action.id);
        try {
            const res = await fetch(`/api/settings/broadcast-settings/${action.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...updatedAction, branch_id: selectedBranchId }),
            });
            
            const data = await res.json();
            
            if (res.ok && data.action) {
                // Sync with server response to get correct ID and override status
                setActions(prev => prev.map(a => a.action_key === action.action_key ? {
                    ...a,
                    ...data.action,
                    is_override: data.action.branch_id ? true : false,
                    // If we created a branch override, the ID changed from the global one to the new branch one
                    id: data.action.id 
                } : a));

                toast.success(t('broadcast_setting_updated', 'Broadcast setting updated'), {
                    description: t('broadcast_setting_updated_desc', 'Changes to {{label}} have been saved.', { label: action.label })
                });
            } else {
                setActions(previousActions); // Rollback
                toast.error(t('failed_save_changes', 'Failed to save changes'));
            }
        } catch {
            setActions(previousActions); // Rollback
            toast.error(t('connection_error', 'Connection error'));
        } finally {
            setSavingId(null);
        }
    };

    const handleTest = async (action: BroadcastAction) => {
        setTestingId(action.id);
        try {
            const res = await fetch(`/api/settings/broadcast-settings/${action.id}/test`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Send current UI values so user can test before saving
                body: JSON.stringify({ 
                    branch_id: selectedBranchId,
                    chat_id: action.chat_id,
                    topic_id: action.topic_id,
                    is_enabled: action.is_enabled
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(t('test_connection_successful', 'Test connection successful'), {
                    description: data.message
                });
            } else {
                toast.error(t('test_failed', 'Test failed'), {
                    description: data.message || t('check_chat_id_config', 'Check your Chat ID configuration.')
                });
            }
        } catch (err: any) {
            toast.error(t('network_error', 'Network Error'), {
                description: t('failed_reach_telegram_api', 'Failed to reach the telegram API via our server.')
            });
        } finally {
            setTestingId(null);
        }
    };

    const handleReset = async (action: BroadcastAction) => {
        if (!confirm(t('confirm_reset_broadcast', 'Are you sure you want to reset this setting to the global default?'))) {
            return;
        }

        setResettingId(action.id);
        try {
            const res = await fetch(`/api/settings/broadcast-settings/${action.id}`, {
                method: 'DELETE',
            });
            
            if (res.ok) {
                toast.success(t('reset_successful', 'Reset successful'), {
                    description: t('broadcast_reset_desc', '{{label}} has been reset to global settings.', { label: action.label })
                });
                fetchSettings(); // Easier to just refetch after a structural change like delete
            } else {
                toast.error(t('failed_reset', 'Failed to reset setting'));
            }
        } catch {
            toast.error(t('connection_error', 'Connection error'));
        } finally {
            setResettingId(null);
        }
    };

    const categories = Array.from(new Set(actions.map(a => a.category)));

    const getIcon = (category: string) => {
        switch (category) {
            case 'Sales': return <IconShoppingCart size={14} className="text-blue-500" />;
            case 'Procurement': return <IconBroadcast size={14} className="text-purple-500" />;
            case 'Services': return <IconTools size={14} className="text-amber-500" />;
            case 'HR': return <IconUsers size={14} className="text-emerald-500" />;
            case 'Attendance': return <IconClock size={14} className="text-rose-500" />;
            default: return <IconSettings size={14} className="text-slate-500" />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        {t('broadcast_channels', 'Broadcast Channels')}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-slate-500">{t('broadcast_channels_desc', 'Configure where automated system notifications are sent.')}</p>
                        {selectedBranchId && (
                            <Badge variant="secondary" className="text-[10px] h-5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                                {t('specific_to_branch', 'Specific to Branch')}
                            </Badge>
                        )}
                        {!selectedBranchId && (
                            <Badge variant="secondary" className="text-[10px] h-5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                {t('global_configuration', 'Global Configuration')}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                    <TableSkeleton columns={6} rows={8} />
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                                <TableRow>
                                    <TableHead className="w-[80px] text-center font-bold">{t('status')}</TableHead>
                                    <TableHead className="min-w-[200px] font-bold">{t('action_event', 'Action / Event')}</TableHead>
                                    <TableHead className="w-[150px] font-bold">{t('category', 'Category')}</TableHead>
                                    <TableHead className="min-w-[280px] font-bold">{t('target_destination', 'Target Destination')}</TableHead>
                                    <TableHead className="min-w-[200px] font-bold">{t('custom_remark')}</TableHead>
                                    <TableHead className="w-[100px] text-right font-bold pr-6">{t('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map(category => (
                                    <React.Fragment key={category}>
                                        <TableRow className="bg-slate-50/30 dark:bg-slate-800/10 hover:bg-slate-50/30 dark:hover:bg-slate-800/10 border-y">
                                            <TableCell colSpan={6} className="py-2 px-4 h-9">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                    {getIcon(category)}
                                                    {category}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {actions.filter(a => a.category === category).map(action => (
                                            <TableRow 
                                                key={action.id} 
                                                className={`transition-opacity duration-200 ${!action.is_enabled ? 'bg-slate-50/20 dark:bg-slate-950/10' : ''}`}
                                            >
                                                <TableCell className="text-center">
                                                    <Switch 
                                                        checked={action.is_enabled}
                                                        onCheckedChange={(checked) => handleUpdate(action, { is_enabled: checked })}
                                                        disabled={savingId === action.id}
                                                        className="mx-auto"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-0.5">
<div className={`font-bold transition-colors flex items-center gap-2 ${action.is_enabled ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
                                                            {action.label}
                                                            {selectedBranchId && (
                                                                action.is_override ? (
                                                                    <span className="inline-flex items-center gap-1 px-1.5 h-4 rounded text-[10px] font-semibold tracking-wide bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-500/20">
                            
                                                                        {t('override', 'Override')}
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-1.5 h-4 rounded text-[10px] font-medium tracking-wide bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 ring-1 ring-slate-200 dark:ring-slate-700">
                    
                                                                        {t('inherited', 'Inherited')}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">
                                                            {action.action_key}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`gap-1.5 font-bold py-0.5 h-6 opacity-80 ${!action.is_enabled && 'grayscale opacity-40'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            category === 'Sales' ? 'bg-blue-500' :
                                                            category === 'Procurement' ? 'bg-purple-500' :
                                                            category === 'Services' ? 'bg-amber-500' :
                                                            category === 'HR' ? 'bg-emerald-500' :
                                                            'bg-rose-500'
                                                        }`} />
                                                        {category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <Input 
                                                                className="h-8 text-xs rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50/50 focus:bg-white dark:bg-slate-950/50 focus:ring-1 focus:ring-primary/20"
                                                                value={action.chat_id || ''}
                                                                placeholder={t('chat_id_placeholder', 'Chat ID (e.g. -100...)')}
                                                                onChange={(e) => setActions(prev => prev.map(a => a.id === action.id ? { ...a, chat_id: e.target.value } : a))}
                                                            />
                                                        </div>
                                                        <div className="w-[90px]">
                                                            <Input 
                                                                className="h-8 text-xs rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50/50 focus:bg-white dark:bg-slate-950/50 focus:ring-1 focus:ring-primary/20"
                                                                value={action.topic_id || ''}
                                                                placeholder={t('topic', 'Topic')}
                                                                onChange={(e) => setActions(prev => prev.map(a => a.id === action.id ? { ...a, topic_id: e.target.value } : a))}
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Input 
                                                        className="h-8 text-xs rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50/50 focus:bg-white dark:bg-slate-950/50 focus:ring-1 focus:ring-primary/20"
                                                        value={action.custom_remark || ''}
                                                        placeholder={t('custom_remark_placeholder', 'Custom remark for this event...')}
                                                        onChange={(e) => setActions(prev => prev.map(a => a.id === action.id ? { ...a, custom_remark: e.target.value } : a))}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {selectedBranchId && action.is_override && (
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="h-8 w-8 p-0 rounded-lg hover:bg-amber-500/10 hover:text-amber-600 transition-all"
                                                                onClick={() => handleReset(action)}
                                                                disabled={resettingId === action.id || savingId === action.id || testingId === action.id}
                                                                title={t('reset_to_global', 'Reset to Global Default')}
                                                            >
                                                                {resettingId === action.id ? (
                                                                    <IconLoader2 size={16} className="animate-spin" />
                                                                ) : (
                                                                    <IconArrowBackUp size={16} />
                                                                )}
                                                            </Button>
                                                        )}

                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600 transition-all"
                                                            onClick={() => handleUpdate(action, {})}
                                                            disabled={savingId === action.id || resettingId === action.id}
                                                            title={t('save_changes')}
                                                        >
                                                            {savingId === action.id ? (
                                                                <IconLoader2 size={16} className="animate-spin" />
                                                            ) : (
                                                                <IconDeviceFloppy size={16} />
                                                            )}
                                                        </Button>

                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                                                            onClick={() => handleTest(action)}
                                                            disabled={testingId === action.id || !action.chat_id || !action.is_enabled || savingId === action.id || resettingId === action.id}
                                                            title={t('send_test_broadcast', 'Send Test Broadcast')}
                                                        >
                                                            {testingId === action.id ? (
                                                                <IconLoader2 size={16} className="animate-spin" />
                                                            ) : (
                                                                <IconSend size={16} />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BroadcastSettingsIndex;
