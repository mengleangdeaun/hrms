import React, { useEffect, useState, useCallback } from 'react';
import api from '@/utils/api';
import {
    IconPhoto,
    IconBuilding,
    IconPhone,
    IconMail,
    IconWorld,
    IconMapPin,
    IconCreditCard,
    IconHierarchy,
    IconSettings,
    IconRefresh,
    IconDeviceFloppy,
    IconEdit,
    IconTrash,
    IconUpload,
    IconLink,
    IconLoader2
} from '@tabler/icons-react';
import MediaSelector, { MediaFile } from '@/components/MediaSelector';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import FilterBar from '@/components/ui/FilterBar';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

interface GlobalSettings {
    company_name: string;
    company_logo: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    company_website: string;
    company_bank_details: string;
    company_footer_text: string;
    default_payment_account_id: string | number | null;
    [key: string]: any;
}

interface PaymentAccount {
    id: number;
    name: string;
    account_no: string;
    branch_id: number | null;
}

interface Branch {
    id: number;
    name: string;
    code: string;
    logo_url: string | null;
    footer_text: string | null;
    payment_account_id: number | null;
    payment_account?: {
        id: number;
        name: string;
        account_no: string;
    };
}

const BrandingIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle(t('Branding Settings')));
    }, [dispatch, t]);

    // Data states
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
        company_name: '',
        company_logo: '',
        company_address: '',
        company_phone: '',
        company_email: '',
        company_website: '',
        company_tin: '',
        company_bank_details: '',
        company_footer_text: '',
        default_payment_account_id: null
    });
    const [branches, setBranches] = useState<Branch[]>([]);
    const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Contextual filtering components
    const globalAccounts = paymentAccounts.filter(acc => acc.branch_id === null);
    const getBranchAccounts = (branchId: number) => paymentAccounts.filter(acc => acc.branch_id === branchId);

    // Modal states
    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [activeTab, setActiveTab] = useState('global');
    const [mediaOpen, setMediaOpen] = useState(false);
    const [mediaTarget, setMediaTarget] = useState<'global' | 'branch' | null>(null);
    const [branchFormData, setBranchFormData] = useState<any>({
        logo_url: '',
        footer_text: '',
        payment_account_id: '' as string | number
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [globalRes, branchesRes, accountsRes] = await Promise.all([
                api.get('/settings/branding/global'),
                api.get('/settings/branding/branches'),
                api.get('/settings/branding/payment-accounts')
            ]);

            setGlobalSettings(globalRes.data);
            setBranches(branchesRes.data);
            setPaymentAccounts(accountsRes.data);
        } catch (error) {
            toast.error(t('failed_load_settings'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleGlobalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const formData = new FormData();
            Object.keys(globalSettings).forEach(key => {
                const value = globalSettings[key];
                if (key === 'company_logo') {
                    if (value instanceof File) {
                        formData.append(key, value);
                    } else if (value) {
                        formData.append(key, value);
                    }
                } else if (value !== null) {
                    formData.append(key, value as string);
                }
            });

            await api.post('/settings/branding/global', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(t('settings_updated_successfully'));
            fetchData(); // Refresh to get the actual URL if a file was uploaded
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('failed_update_settings'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditBranch = (branch: Branch) => {
        setSelectedBranch(branch);
        setBranchFormData({
            logo_url: branch.logo_url || '',
            footer_text: branch.footer_text || '',
            payment_account_id: branch.payment_account_id || 'none'
        });
        setIsBranchModalOpen(true);
    };

    const handleBranchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBranch) return;

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('_method', 'PUT'); // Spoofing for multipart PUT
            
            if (branchFormData.logo_url instanceof File) {
                formData.append('logo_url', branchFormData.logo_url);
            } else if (branchFormData.logo_url) {
                formData.append('logo_url', branchFormData.logo_url);
            }

            formData.append('footer_text', branchFormData.footer_text || '');
            formData.append('payment_account_id', branchFormData.payment_account_id === 'none' ? '' : branchFormData.payment_account_id.toString());

            await api.post(`/settings/branding/branches/${selectedBranch.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            toast.success(t('settings_updated_successfully'));
            setIsBranchModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('failed_update_branch'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleMediaSelect = (file: MediaFile) => {
        if (mediaTarget === 'global') {
            setGlobalSettings({ ...globalSettings, company_logo: file.url });
        } else if (mediaTarget === 'branch') {
            setBranchFormData({ ...branchFormData, logo_url: file.url });
        }
        setMediaOpen(false);
    };

    const LogoPicker = ({ value, onChange, onOpenMedia }: { value: any, onChange: (val: any) => void, onOpenMedia: () => void }) => {
        const [activeTab, setActiveTab] = useState(() => {
            if (value instanceof File) return 'upload';
            if (typeof value === 'string' && value.length > 0) {
                // If it contains '/storage/branding' or matches our library pattern, it might be media
                // But defaulting to 'url' for existing strings is often what users want if they didn't just pick it from media
                return value.includes('/storage/') ? 'media' : 'url';
            }
            return 'media';
        });

        return (
            <div className="flex items-start gap-4">
                <div className="relative w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-hidden group bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                    {value ? (
                        <>
                            <img
                                src={typeof value === 'string' ? value : URL.createObjectURL(value)}
                                className="w-full h-full object-contain p-2"
                                alt="Logo Preview"
                            />
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            >
                                <IconTrash className="text-white w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center text-slate-400 p-2 text-center">
                            <IconPhoto size={24} className="mb-1 opacity-50" />
                            <span className="text-[10px]">{t('no_logo', 'No Logo')}</span>
                        </div>
                    )}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                    <TabsList className="grid w-full grid-cols-3 h-9 bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
                        <TabsTrigger value="media" className="text-[9px] uppercase font-bold py-1">
                            <IconPhoto size={14} className="mr-1" /> Media
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="text-[9px] uppercase font-bold py-1">
                            <IconUpload size={14} className="mr-1" /> Upload
                        </TabsTrigger>
                        <TabsTrigger value="url" className="text-[9px] uppercase font-bold py-1">
                            <IconLink size={14} className="mr-1" /> URL
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="media" className="mt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full gap-2 text-[10px] h-8 border-dashed hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all font-bold"
                            onClick={onOpenMedia}
                        >
                            <IconPhoto size={14} /> {t('media_library')}
                        </Button>
                    </TabsContent>
                    <TabsContent value="upload" className="mt-2">
                        <div className="relative">
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={e => {
                                    if (e.target.files?.[0]) {
                                        onChange(e.target.files[0]);
                                    }
                                }}
                                className="h-8 text-[10px] py-1 opacity-0 absolute inset-0 cursor-pointer z-10"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full gap-2 text-[10px] h-8 border-dashed font-bold"
                            >
                                <IconUpload size={14} /> {t('choose_file', 'Choose File')}
                            </Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="url" className="mt-2">
                        <Input
                            placeholder="https://..."
                            value={typeof value === 'string' ? value : ''}
                            onChange={(e) => onChange(e.target.value)}
                            className="h-8 text-[10px]"
                        />
                    </TabsContent>
                </Tabs>
            </div>
        );
    };

    const baseTriggerClass =
        "px-4 py-1 h-7 sm:h-8 gap-2 text-xs font-bold rounded-md transition-colors " +
        "data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-dark " +
        "data-[state=active]:shadow-sm";

    return (
        <div className="font-google_sans space-y-4">
            <Tabs defaultValue="global" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <FilterBar
                    title={t('branding_management', 'Branding Management')}
                    description={t('branding_desc', 'Configure company identity and branch-specific overrides for documents.')}
                    icon={<IconSettings className="w-6 h-6 text-primary" />}
                    search={searchQuery}
                    setSearch={setSearchQuery}
                    placeholder={t('search_branches_placeholder', 'Search branches...')}
                    onRefresh={fetchData}
                    itemsPerPage={10}
                    setItemsPerPage={() => { }}
                    hideFilter={activeTab === 'global'}
                    extraActions={
                        <TabsList className="inline-flex h-9 sm:h-10 w-auto rounded-md border border-slate-200/50 bg-white p-1 dark:border-slate-700/50 dark:bg-slate-900">
                            <TabsTrigger value="global" className={cn(baseTriggerClass, "rounded-l-md")}>
                                <IconSettings className="h-3.5 w-3.5" />
                                {t("global", "Global")}
                            </TabsTrigger>
                            <TabsTrigger value="branches" className={cn(baseTriggerClass, "rounded-r-md")}>
                                <IconHierarchy className="h-3.5 w-3.5" />
                                {t("branches", "Branches")}
                            </TabsTrigger>
                        </TabsList>
                    }
                />

                <TabsContent value="global">
                    <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                        <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
                            <CardTitle className="text-md flex items-center gap-2">
                                <IconBuilding className="w-5 h-5 text-primary" />
                                {t('company_information')}
                            </CardTitle>
                            <CardDescription>
                                {t('company_info_fallback')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {loading ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />)}
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleGlobalSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Left Column */}
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="company_name" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                                                    {t('company_name', 'Company Name')}
                                                </Label>
                                                <div className="relative">
                                                    <IconBuilding className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                    <Input
                                                        id="company_name"
                                                        value={globalSettings.company_name}
                                                        onChange={e => setGlobalSettings({ ...globalSettings, company_name: e.target.value })}
                                                        placeholder="SCC Group Co., Ltd."
                                                        className="pl-10 h-11 border-slate-200 dark:border-slate-800"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                                                    {t('logo_branding')}
                                                </Label>
                                                <LogoPicker
                                                    value={globalSettings.company_logo}
                                                    onChange={(val) => setGlobalSettings({ ...globalSettings, company_logo: val })}
                                                    onOpenMedia={() => {
                                                        setMediaTarget('global');
                                                        setMediaOpen(true);
                                                    }}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="company_phone" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                                                    {t('phone_number', 'Phone Number')}
                                                </Label>
                                                <div className="relative">
                                                    <IconPhone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                    <Input
                                                        id="company_phone"
                                                        value={globalSettings.company_phone}
                                                        onChange={e => setGlobalSettings({ ...globalSettings, company_phone: e.target.value })}
                                                        placeholder="+1 (555) 000-0000"
                                                        className="pl-10 h-11 border-slate-200 dark:border-slate-800"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="company_email" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                                                    {t('email_address', 'Email Address')}
                                                </Label>
                                                <div className="relative">
                                                    <IconMail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                    <Input
                                                        id="company_email"
                                                        type="email"
                                                        value={globalSettings.company_email}
                                                        onChange={e => setGlobalSettings({ ...globalSettings, company_email: e.target.value })}
                                                        placeholder="contact@example.com"
                                                        className="pl-10 h-11 border-slate-200 dark:border-slate-800"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="company_website" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                                                    {t('website_url', 'Website URL')}
                                                </Label>
                                                <div className="relative">
                                                    <IconWorld className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                    <Input
                                                        id="company_website"
                                                        value={globalSettings.company_website}
                                                        onChange={e => setGlobalSettings({ ...globalSettings, company_website: e.target.value })}
                                                        placeholder="www.example.com"
                                                        className="pl-10 h-11 border-slate-200 dark:border-slate-800"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="company_tin" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                                                    {t('vat_tin_number', 'VAT/TIN Number')}
                                                </Label>
                                                <div className="relative">
                                                    <IconCreditCard className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                    <Input
                                                        id="company_tin"
                                                        value={globalSettings.company_tin || ''}
                                                        onChange={e => setGlobalSettings({ ...globalSettings, company_tin: e.target.value })}
                                                        placeholder="L001-902200000"
                                                        className="pl-10 h-11 border-slate-200 dark:border-slate-800"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="company_address" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                                                    {t('address', 'Physical Address')}
                                                </Label>
                                                <div className="relative">
                                                    <IconMapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                    <Textarea
                                                        id="company_address"
                                                        value={globalSettings.company_address}
                                                        onChange={e => setGlobalSettings({ ...globalSettings, company_address: e.target.value })}
                                                        placeholder="123 Business Avenue, Suite 100..."
                                                        className="pl-10 min-h-[110px] py-2 border-slate-200 dark:border-slate-800"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="global_payment_account" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                                                    {t('default_payment_account', 'Default Bank Account')}
                                                </Label>
                                                <Select
                                                    value={globalSettings.default_payment_account_id?.toString() || 'none'}
                                                    onValueChange={val => setGlobalSettings({ ...globalSettings, default_payment_account_id: val === 'none' ? null : val })}
                                                >
                                                    <SelectTrigger id="global_payment_account" className="h-11 border-slate-200 dark:border-slate-800">
                                                        <div className="flex items-center gap-2">
                                                            <IconCreditCard className="w-4 h-4 text-slate-400" />
                                                            <SelectValue placeholder={t('select_bank_account', 'Select a bank account')} />
                                                        </div>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">{t('no_default', 'No default account')}</SelectItem>
                                                        {globalAccounts.map(account => (
                                                            <SelectItem key={account.id} value={account.id.toString()}>
                                                                {account.name} ({account.account_no})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="company_footer_text" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 font-google_sans">
                                            {t('document_footer_global')}
                                        </Label>
                                        <Textarea
                                            id="company_footer_text"
                                            value={globalSettings.company_footer_text}
                                            onChange={e => setGlobalSettings({ ...globalSettings, company_footer_text: e.target.value })}
                                            placeholder="Thank you for your business! All payments are due within 15 days."
                                            className="min-h-[80px] border-slate-200 dark:border-slate-800"
                                        />
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button
                                            type="submit"
                                            disabled={submitting}
                                            className="gap-2 px-6 h-10 font-bold"
                                        >
                                            {submitting ? <IconRefresh className="w-5 h-5 animate-spin" /> : <IconDeviceFloppy className="w-5 h-5" />}
                                            {t('save_global_identity')}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="branches" className="space-y-4 pt-1">
                    {loading ? (
                        <TableSkeleton columns={4} rows={10} />
                    ) : branches.filter(b =>
                        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        b.code.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                            <p className="text-slate-400">
                                {searchQuery ? t('no_search_results', 'No matches found for your search.') : t('no_branches_found', 'No branches found. Manage branches in HR Management.')}
                            </p>
                        </div>
                    ) : (
                        <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                    <TableRow>
                                        <TableHead className="font-bold text-slate-800 dark:text-slate-200">{t('branch_name', 'Branch Name')}</TableHead>
                                        <TableHead className="font-bold text-slate-800 dark:text-slate-200">{t('logo_override', 'Logo')}</TableHead>
                                        <TableHead className="font-bold text-slate-800 dark:text-slate-200">{t('payment_account', 'Payment Account')}</TableHead>
                                        <TableHead className="text-right font-bold text-slate-800 dark:text-slate-200">{t('actions', 'Actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {branches
                                        .filter(b =>
                                            b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            b.code.toLowerCase().includes(searchQuery.toLowerCase())
                                        )
                                        .map(branch => (
                                            <TableRow key={branch.id} className="border-slate-100 dark:border-slate-800 transition-colors">
                                                <TableCell className="font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                                    {branch.name}
                                                    <span className="ml-2 py-0.5 px-2 bg-slate-100 dark:bg-slate-800 rounded text-[10px] text-slate-500 font-mono tracking-tight uppercase">
                                                        {branch.code}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {branch.logo_url ? (
                                                        <img src={branch.logo_url} alt="Logo" className="w-8 h-8 object-contain rounded border border-slate-100 bg-white" title="Branch Override" />
                                                    ) : (
                                                        <Badge variant="secondary" className="font-normal text-[10px] opacity-60">{t('global_default', 'Global default')}</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {branch.payment_account ? (
                                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                            <IconCreditCard className="w-3.5 h-3.5" />
                                                            {branch.payment_account.name}
                                                        </div>
                                                    ) : (
                                                        <Badge variant="secondary" className="font-normal text-[10px] opacity-60">{t('global_default', 'Global default')}</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEditBranch(branch)}
                                                        className="gap-1.5 h-8 font-bold border-slate-200 dark:border-slate-800"
                                                    >
                                                        <IconEdit className="w-3.5 h-3.5 text-primary" />
                                                        {t('configure', 'Configure')}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    }
                                </TableBody>
                            </Table>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Branch Override Modal */}
            <Dialog open={isBranchModalOpen} onOpenChange={setIsBranchModalOpen}>
                <DialogContent className="sm:max-w-[500px] font-google_sans">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <IconHierarchy className="w-5 h-5 text-primary" />
                            {selectedBranch ? `${t('configure_branding_for', 'Branding for')} ${selectedBranch.name}` : ''}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleBranchSubmit} className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                                {t('logo_override')}
                            </Label>
                            <LogoPicker
                                value={branchFormData.logo_url}
                                onChange={(val) => setBranchFormData({ ...branchFormData, logo_url: val })}
                                onOpenMedia={() => {
                                    setMediaTarget('branch');
                                    setMediaOpen(true);
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="branch_account" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                                {t('bank_account_override', 'Bank Account Override')}
                            </Label>
                            <Select
                                value={branchFormData.payment_account_id?.toString() || 'none'}
                                onValueChange={val => setBranchFormData({ ...branchFormData, payment_account_id: val })}
                            >
                                <SelectTrigger id="branch_account" className="h-11 border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <IconCreditCard className="w-4 h-4 text-slate-400" />
                                        <SelectValue placeholder={t('use_global_default', 'Use global default')} />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{t('use_global_default', 'Use Global Default')}</SelectItem>
                                    {selectedBranch && getBranchAccounts(selectedBranch.id).map(account => (
                                        <SelectItem key={account.id} value={account.id.toString()}>
                                            {account.name} ({account.account_no})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="branch_footer" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                                {t('footer_text_override')}
                            </Label>
                            <Textarea
                                id="branch_footer"
                                value={branchFormData.footer_text}
                                onChange={e => setBranchFormData({ ...branchFormData, footer_text: e.target.value })}
                                placeholder={t('leave_empty_default', 'Leave empty to use global footer')}
                                className="min-h-[100px] border-slate-200 dark:border-slate-800"
                            />
                        </div>

                        <DialogFooter className="gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsBranchModalOpen(false)}
                                className="px-6 font-bold text-xs h-11 dark:border-slate-700"
                            >
                                {t('cancel', 'Cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="px-8 font-bold text-xs h-11 shadow-lg shadow-primary/20"
                            >
                                {submitting ? (
                                    <IconRefresh className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <IconDeviceFloppy className="w-4 h-4 mr-2" />
                                )}
                                {t('update_branch')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <MediaSelector
                open={mediaOpen}
                onOpenChange={setMediaOpen}
                onSelect={handleMediaSelect}
                acceptedType="photo"
            />
        </div>
    );
};

export default BrandingIndex;
