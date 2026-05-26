import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/utils/api';
import { 
    FileText, 
    Copy, 
    Edit, 
    CheckCircle, 
    AlertCircle,
    Plus,
    Trash2,
    Settings2,
    RefreshCcw,
    Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import FilterBar from '@/components/ui/FilterBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { IconTemplate } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import DeleteModal from '@/components/DeleteModal';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

interface DocumentType {
    id: number;
    name: string;
    slug: string;
}

interface Template {
    id: number;
    name: string;
    is_system: boolean;
    is_active_for_print: boolean;
    page_size: string;
    form_document_type_id: number;
    document_type?: DocumentType;
}

const SECTIONS = [
    { title: 'Customer section', types: ['quotation', 'sale_order', 'sale_invoice', 'tax_invoice'] },
    { title: 'Vendor section', types: ['purchase_order', 'purchase_receive'] },
    { title: 'Stock section', types: ['stock_adjustment', 'stock_transfer'] },
];

const TemplateCard = ({ template, onActivate, onClone, onDelete, onRename, onTestPrint, t }: any) => (
    <Card 
        className={cn(
            "group rounded-lg transition-all duration-300 p-6 flex flex-col h-full overflow-hidden border-2 bg-white dark:bg-slate-900",
            template.is_active_for_print ? "border-primary/60 shadow-lg shadow-primary/5" : "border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:shadow-md"
        )}
    >
        <div className="flex justify-between items-start mb-4">
            <div className={cn(
                "p-3 rounded-lg",
                template.is_system ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" : "bg-primary/10 text-primary"
            )}>
                <FileText className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
                {template.is_active_for_print && (
                    <Badge variant="success" dot className="px-3 py-1">
                        {t('active')}
                    </Badge>
                )}
                {!template.is_system && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8 text-slate-400 hover:text-destructive transition-colors shrink-0"
                        onClick={() => onDelete(template.id)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>

        <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors truncate">
                {template.name}
            </h3>
            {!template.is_system && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-7 h-7 text-slate-400 hover:text-primary transition-colors shrink-0"
                    onClick={() => onRename(template)}
                >
                    <Edit className="w-3.5 h-3.5" />
                </Button>
            )}
        </div>
        
        <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-400">
            <Layers className="w-3.5 h-3.5" />
            {template.document_type?.name || t('unknown_type')}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="outline" className="text-[10px] font-bold dark:border-slate-700">
                {template.page_size}
            </Badge>
            <Badge variant={template.is_system ? "secondary" : "default"} className="text-[10px] font-bold">
                {template.is_system ? t('system') : t('custom')}
            </Badge>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-slate-50 dark:border-slate-800">
            {template.is_system ? (
                <Button 
                    variant="outline"
                    onClick={() => onClone(template.id)}
                    className="col-span-2 gap-2 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                    <Copy className="w-4 h-4" />
                    {t('clone_to_edit')}
                </Button>
            ) : (
                <>
                    <Button 
                        asChild
                        variant="soft-default"
                        className="gap-2"
                    >
                        <Link to={`/settings/templates/${template.id}/edit`}>
                            <Edit className="w-4 h-4" />
                            {t('design')}
                        </Link>
                    </Button>
                    {!template.is_active_for_print ? (
                        <Button 
                            variant="outline"
                            onClick={() => onActivate(template.id)}
                            className="gap-2 hover:bg-emerald-500 hover:text-white"
                        >
                            <CheckCircle className="w-4 h-4" />
                            {t('activate')}
                        </Button>
                    ) : (
                        <div className="flex items-center justify-center text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                            {t('active_layout')}
                        </div>
                    )}
                    <Button 
                        variant="outline"
                        onClick={() => onTestPrint(template.id)}
                        className="col-span-2 gap-2 border-primary/20 text-primary hover:bg-primary/5 dark:border-primary/30"
                    >
                        <FileText className="w-4 h-4" />
                        Quick Test Print
                    </Button>
                </>
            )}
        </div>
    </Card>
);

const TemplateIndex = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [itemsPerPage, setItemsPerPage] = useState(15);

    // Modal state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        form_document_type_id: '',
        page_size: 'A4'
    });

    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [templateToRename, setTemplateToRename] = useState<any>(null);
    const [renameValue, setRenameValue] = useState('');

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle(t('Templates')));
    }, [dispatch, t]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [templatesRes, typesRes] = await Promise.all([
                api.get('/templates'),
                api.get('/form-document-types')
            ]);
            setTemplates(templatesRes.data);
            setDocumentTypes(typesRes.data);
        } catch (error) {
            toast.error(t('failed_load_templates'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleActivate = async (id: number) => {
        try {
            await api.put(`/templates/${id}/activate`);
            toast.success(t('template_activated'));
            fetchData();
        } catch (error) {
            toast.error(t('failed_activate_template'));
        }
    };

    const handleClone = async (id: number) => {
        try {
            const response = await api.post(`/templates/${id}/clone`);
            toast.success(t('template_cloned'));
            const newId = response.data.id;
            navigate(`/settings/templates/${newId}/edit`);
        } catch (error) {
            toast.error(t('failed_clone_template'));
        }
    };

    const confirmDelete = (id: number) => {
        setTemplateToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!templateToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/templates/${templateToDelete}`);
            toast.success(t('template_deleted'));
            setIsDeleteModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(t('failed_delete_template'));
        } finally {
            setIsDeleting(false);
            setTemplateToDelete(null);
        }
    };

    const handleRename = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!templateToRename || !renameValue.trim()) return;
        setIsSubmitting(true);
        try {
            await api.put(`/templates/${templateToRename.id}`, { name: renameValue });
            toast.success(t('template_updated'));
            setIsRenameOpen(false);
            fetchData();
        } catch (error) {
            toast.error(t('failed_update_template'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTemplate.form_document_type_id) {
            toast.error(t('select_doc_type_msg'));
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await api.post('/templates', newTemplate);
            toast.success(t('template_created'));
            setIsCreateOpen(false);
            setNewTemplate({ name: '', form_document_type_id: '', page_size: 'A4' });
            navigate(`/settings/templates/${response.data.id}/edit`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('failed_create_template'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTestPrint = (id: number) => {
        window.open(`/settings/templates/${id}/edit?print=true`, '_blank');
    };

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === 'all' || template.form_document_type_id.toString() === typeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <div>
            <FilterBar
                icon={<IconTemplate className="w-6 h-6 text-primary" />}
                title={t('template_builder')}
                description={t('template_builder_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                addLabel={t('create_template')}
                onAdd={() => setIsCreateOpen(true)}
                onRefresh={fetchData}
                extraActions={
                    <Button 
                        variant="soft-default" 
                        size="sm" 
                        className="gap-2 font-bold text-xs h-10 px-4"
                        onClick={() => navigate('/settings/document-types')}
                    >
                        <Settings2 className="w-4 h-4" />
                        Manage Types
                    </Button>
                }
            >
                <div className="w-full">
                    <span className="mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('document_types')}</span>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <SelectValue placeholder={t('all_document_types')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('all_document_types')}</SelectItem>
                            {documentTypes.map(type => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                    {type.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>

            <div className="gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-slate-400">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        Fetching templates...
                    </div>
                ) : (
            <div className="space-y-12">
                {SECTIONS.map((section, sIdx) => {
                    const sectionTemplates = filteredTemplates.filter(t => 
                        section.types.includes(t.document_type?.slug || '')
                    );

                    if (sectionTemplates.length === 0 && typeFilter !== 'all') return null;
                    if (sectionTemplates.length === 0 && search === '') return null;

                    return (
                        <div key={sIdx} className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[.25em] bg-slate-50 dark:bg-slate-900 px-4 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                                    {section.title}
                                </h2>
                                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sectionTemplates.map((template) => (
                                    <TemplateCard 
                                        key={template.id} 
                                        template={template} 
                                        onActivate={handleActivate}
                                        onClone={handleClone}
                                        onDelete={confirmDelete}
                                        onRename={(t: any) => { setTemplateToRename(t); setRenameValue(t.name); setIsRenameOpen(true); }}
                                        onTestPrint={handleTestPrint}
                                        t={t}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* Other/Uncategorized */}
                {filteredTemplates.filter(t => !SECTIONS.some(s => s.types.includes(t.document_type?.slug || ''))).length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[.25em] bg-slate-50 dark:bg-slate-900 px-4 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                                OTHER TEMPLATES
                            </h2>
                            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTemplates.filter(t => !SECTIONS.some(s => s.types.includes(t.document_type?.slug || ''))).map((template) => (
                                <TemplateCard 
                                    key={template.id} 
                                    template={template} 
                                    onActivate={handleActivate}
                                    onClone={handleClone}
                                    onDelete={confirmDelete}
                                    t={t}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
                )}
            </div>
            
            {filteredTemplates.length === 0 && !loading && (
                <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <AlertCircle className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{t('no_templates_found')}</p>
                    <p className="text-slate-500 text-xs mt-1">{t('no_templates_desc')}</p>
                </div>
            )}

            {/* Create Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[425px] font-google_sans">
                    <form onSubmit={handleCreate}>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Plus className="w-5 h-5 text-primary" />
                                {t('create_new_template')}
                            </DialogTitle>
                        </DialogHeader>
                        
                        <div className="grid gap-6 py-6 font-google_sans">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                                    {t('template_name')}
                                </Label>
                                <Input
                                    placeholder={t('template_name_placeholder')}
                                    value={newTemplate.name}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                    required
                                    className="h-11 border-slate-200 dark:border-slate-800 focus:ring-primary/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                                    {t('document_type')}
                                </Label>
                                <Select 
                                    value={newTemplate.form_document_type_id} 
                                    onValueChange={(val) => setNewTemplate({ ...newTemplate, form_document_type_id: val })}
                                    required
                                >
                                    <SelectTrigger className="h-11 border-slate-200 dark:border-slate-800">
                                        <SelectValue placeholder={t('select_type')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {documentTypes.map(type => (
                                            <SelectItem key={type.id} value={type.id.toString()}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                                    {t('page_size')}
                                </Label>
                                <Select 
                                    value={newTemplate.page_size} 
                                    onValueChange={(val) => setNewTemplate({ ...newTemplate, page_size: val })}
                                >
                                    <SelectTrigger className="h-11 border-slate-200 dark:border-slate-800">
                                        <SelectValue placeholder={t('select_size')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="A4">A4 (Standard)</SelectItem>
                                        <SelectItem value="A5">A5 (Half Size)</SelectItem>
                                        <SelectItem value="Letter">Letter</SelectItem>
                                        <SelectItem value="Customize">Customize</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter className="gap-3">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsCreateOpen(false)}
                                className="px-6 font-bold text-xs h-11 dark:border-slate-700"
                            >
                                {t('cancel')}
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="px-8 font-bold text-xs h-11 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
                            >
                                {isSubmitting ? (
                                    <RefreshCcw className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <IconTemplate className="w-4 h-4 mr-2" />
                                )}
                                {t('initialize_designer')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Rename Modal */}
            <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                <DialogContent className="sm:max-w-[425px] font-google_sans">
                    <form onSubmit={handleRename}>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Edit className="w-5 h-5 text-primary" />
                                {t('rename_template')}
                            </DialogTitle>
                        </DialogHeader>
                        
                        <div className="grid gap-6 py-6 font-google_sans">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                                    {t('new_template_name')}
                                </Label>
                                <Input
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    required
                                    autoFocus
                                    className="h-11 border-slate-200 dark:border-slate-800 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-3">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsRenameOpen(false)}
                                className="px-6 font-bold text-xs h-11 dark:border-slate-700"
                            >
                                {t('cancel')}
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="px-8 font-bold text-xs h-11 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
                            >
                                {isSubmitting ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                {t('save_changes')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteModal
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
                onConfirm={handleDelete}
                isLoading={isDeleting}
                title={t('delete_template')}
                message={t('delete_template_confirm')}
            />
        </div>
    );
};

export default TemplateIndex;
