import React, { useEffect, useState, useCallback } from 'react';
import api from '@/utils/api';
import { 
    Plus, 
    FileStack,
    CheckCircle2,
    XCircle,
    Search,
    RefreshCcw,
} from 'lucide-react';
import { 
    IconFileStack, 
    IconSettings2, 
    IconPlus,
    IconSearch,
    IconRefresh
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import FilterBar from '@/components/ui/FilterBar';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import ActionButtons from '@/components/ui/ActionButtons';
import { Illustration } from '@/components/illustrations/PremiumIcon';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/ui/PageHeader';
import TableSkeleton from '@/components/ui/TableSkeleton';
import DeleteModal from '@/components/DeleteModal';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

interface DocumentType {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    templates_count: number;
}

const DocumentTypes = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [types, setTypes] = useState<DocumentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
    const [formData, setFormData] = useState({ name: '', is_active: true });

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle(t('Document Types')));
    }, [dispatch, t]);

    const fetchTypes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/form-document-types');
            setTypes(response.data);
        } catch (error) {
            toast.error('Failed to load document types');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTypes();
    }, [fetchTypes]);

    const handleOpenModal = (type: DocumentType | null = null) => {
        setSelectedType(type);
        setFormData({
            name: type ? type.name : '',
            is_active: type ? type.is_active : true
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (selectedType) {
                await api.put(`/form-document-types/${selectedType.id}`, formData);
                toast.success('Document type updated successfully');
            } else {
                await api.post('/form-document-types', formData);
                toast.success('Document type created successfully');
            }
            setIsModalOpen(false);
            fetchTypes();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = (id: number) => {
        setTypeToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!typeToDelete) return;
        
        setIsDeleting(true);
        try {
            await api.delete(`/form-document-types/${typeToDelete}`);
            toast.success('Document type deleted successfully');
            setIsDeleteModalOpen(false);
            fetchTypes();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete');
        } finally {
            setIsDeleting(false);
            setTypeToDelete(null);
        }
    };

    const filteredTypes = types.filter(type => 
        type.name.toLowerCase().includes(search.toLowerCase()) ||
        type.slug.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filteredTypes.length / itemsPerPage);
    const paginatedItems = filteredTypes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="font-google_sans space-y-6">
            <FilterBar
                title="Document Types"
                description="Manage categories for your templates (e.g. Invoice, Receipt, Job Card)."
                icon={<IconSettings2 className="w-6 h-6 text-primary" />}
                search={search}
                setSearch={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                }}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                addLabel="Add New Type"
                onAdd={() => handleOpenModal()}
                onRefresh={fetchTypes}
            />

                    {loading ? (
                        <TableSkeleton rows={5} columns={5} />
                    ) : (
            <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">

                <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800">
                                    <TableHead className="font-bold text-slate-800 dark:text-slate-200">Name</TableHead>
                                    <TableHead className="font-bold text-slate-800 dark:text-slate-200">System Slug</TableHead>
                                    <TableHead className="font-bold text-slate-800 dark:text-slate-200 text-center">Status</TableHead>
                                    <TableHead className="font-bold text-slate-800 dark:text-slate-200 text-center">Templates</TableHead>
                                    <TableHead className="text-right font-bold text-slate-800 dark:text-slate-200">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="p-0">
                                            <EmptyState 
                                                isSearch={!!search} 
                                                searchTerm={search}
                                                onClearFilter={() => setSearch('')}
                                                title={search ? "No matches found" : "No document types"}
                                                description={search 
                                                    ? `We couldn't find any document types matching "${search}".` 
                                                    : "Start by creating your first document category to organize your templates."
                                                }
                                                actionLabel="Create Document Type"
                                                onAction={() => handleOpenModal()}
                                                illustration={<Illustration name="folderDynamic" />}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedItems.map((type) => (
                                        <TableRow key={type.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                            <TableCell className="font-bold text-slate-800 dark:text-slate-200">
                                                {type.name}
                                            </TableCell>
                                            <TableCell>
                                                <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-500 font-mono">
                                                    {type.slug}
                                                </code>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge 
                                                    variant={type.is_active ? "success" : "secondary"}
                                                    className="px-3 py-1 font-bold rounded-lg"
                                                >
                                                    {type.is_active ? (
                                                        <div className="flex items-center gap-1.5 font-google_sans">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            Active
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 font-google_sans">
                                                            <XCircle className="w-3.5 h-3.5" />
                                                            Disabled
                                                        </div>
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary rounded-full font-bold text-xs">
                                                    <FileStack className="w-3.5 h-3.5" />
                                                    {type.templates_count}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <ActionButtons 
                                                    skipDeleteConfirm={true}
                                                    onEdit={() => handleOpenModal(type)}
                                                    onDelete={() => confirmDelete(type.id)}
                                                    disabled={loading}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    
                </div>

                {!loading && filteredTypes.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredTypes.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </Card>
)}
            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px] font-google_sans">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">
                                {selectedType ? 'Edit Document Type' : 'New Document Type'}
                            </DialogTitle>
                        </DialogHeader>
                        
                        <div className="grid gap-6 py-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                                    Display Name
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Sales Invoice"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="h-11 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                />
                                <p className="text-[10px] text-slate-400 pl-1">
                                    System slug will be automatically created from the name.
                                </p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold text-slate-800 dark:text-slate-200">Active Status</Label>
                                    <p className="text-xs text-slate-500">Enable or disable this document category.</p>
                                </div>
                                <Switch
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-3">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 font-bold text-xs h-11 dark:border-slate-700"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="px-8 font-bold text-xs h-11 shadow-lg shadow-primary/20"
                            >
                                {isSubmitting ? (
                                    <RefreshCcw className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Plus className="w-4 h-4 mr-2" />
                                )}
                                {selectedType ? 'Update Type' : 'Create Type'}
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
                title="Delete Document Type"
                message="Are you sure you want to delete this document type? This action cannot be undone and will fail if templates are linked."
            />
        </div>
    );
};

export default DocumentTypes;
