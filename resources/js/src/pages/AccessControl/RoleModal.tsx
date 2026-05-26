import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import { IconShield, IconSearch, IconX } from '@tabler/icons-react';
import { Illustration } from '@/components/illustrations/PremiumIcon';
import PerfectScrollbar from 'react-perfect-scrollbar';

interface RoleModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    editingRole: any;
    permissionsMap: Record<string, any[]>;
    loadingPermissions: boolean;
    onSuccess: () => void;
}

const initialFormState = {
    name: '',
    description: '',
    permissions: [] as number[],
};

const RoleModal: React.FC<RoleModalProps> = ({
    isOpen,
    setIsOpen,
    editingRole,
    permissionsMap,
    loadingPermissions,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(initialFormState);
    const [isSaving, setIsSaving] = useState(false);
    const [permissionSearch, setPermissionSearch] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (editingRole) {
                setFormData({
                    name: editingRole.name,
                    description: editingRole.description || '',
                    permissions: editingRole.permissions.map((p: any) => Number(p.id)),
                });
            } else {
                setFormData(initialFormState);
            }
            setPermissionSearch('');
        }
    }, [isOpen, editingRole]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handlePermissionToggle = (permissionId: number) => {
        setFormData((prev) => {
            const pId = Number(permissionId);
            const current = prev.permissions.map(Number);
            const exists = current.includes(pId);
            if (exists) {
                return { ...prev, permissions: current.filter((id) => id !== pId) };
            } else {
                return { ...prev, permissions: [...current, pId] };
            }
        });
    };

    const handleSelectAllModule = (perms: any[], checked: boolean | 'indeterminate') => {
        const modulePermissionIds = perms.map((p) => Number(p.id));
        setFormData((prev) => {
            const currentPermissions = prev.permissions.map(Number);
            if (checked === true || checked === 'indeterminate') {
                const newPermissions = [...new Set([...currentPermissions, ...modulePermissionIds])];
                return { ...prev, permissions: newPermissions };
            } else {
                return { ...prev, permissions: currentPermissions.filter((id) => !modulePermissionIds.includes(id)) };
            }
        });
    };

    const handleSelectAllGlobal = (checked: boolean | 'indeterminate') => {
        if (checked === true || checked === 'indeterminate') {
            const allIds = Object.values(permissionsMap).flat().map((p: any) => Number(p.id));
            setFormData((prev) => ({ ...prev, permissions: allIds }));
        } else {
            setFormData((prev) => ({ ...prev, permissions: [] }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const url = editingRole ? `/api/access-control/roles/${editingRole.id}` : '/api/access-control/roles';
        const method = editingRole ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success(`Role ${editingRole ? 'updated' : 'created'} successfully`);
                setIsOpen(false);
                onSuccess();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to save role');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[1050px] w-[95vw] max-h-[90vh] h-auto flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                    <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
                        <IconShield className="text-primary w-7 h-7" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                            {editingRole ? 'Edit Role' : 'Create Role'}
                        </DialogTitle>
                        <p className="text-sm text-gray-500 mt-1">
                            {editingRole
                                ? 'Modify the role details and its permissions.'
                                : 'Define a new role and assign the corresponding permissions.'}
                        </p>
                    </div>
                </div>

                {/* Scrollable Form Area */}
                <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1 min-h-0">
                    <form id="role-form" onSubmit={handleSubmit} className="pt-0 p-6 space-y-6">
                        {/* Role Details Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Role Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Admin, Manager, Viewer"
                                    required
                                    className="bg-gray-50 dark:bg-gray-800/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Input
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Optional description..."
                                    className="bg-gray-50 dark:bg-gray-800/50"
                                />
                            </div>
                        </div>

                        {/* Permissions Section */}
                        {loadingPermissions ? (
                            <div className="space-y-6 pt-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="animate-pulse space-y-4">
                                        <div className="h-6 w-48 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            {[1, 2, 3, 4].map((j) => (
                                                <div key={j} className="h-10 bg-gray-50 dark:bg-gray-900 rounded-xl" />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <PermissionsMatrix
                                permissionsMap={permissionsMap}
                                selectedPermissionIds={formData.permissions}
                                onToggle={handlePermissionToggle}
                                onSelectModule={handleSelectAllModule}
                                onSelectAll={handleSelectAllGlobal}
                                searchQuery={permissionSearch}
                                setSearchQuery={setPermissionSearch}
                            />
                        )}
                    </form>
                </PerfectScrollbar>

                {/* Sticky Footer */}
                <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
                    <Button type="button" variant="ghost" className="px-5" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="role-form"
                        disabled={isSaving}
                        className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                    >
                        {isSaving ? 'Saving...' : 'Save Role'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const PermissionsMatrix = ({
    permissionsMap,
    selectedPermissionIds,
    onToggle,
    onSelectModule,
    onSelectAll,
    searchQuery,
    setSearchQuery,
}: {
    permissionsMap: Record<string, any[]>;
    selectedPermissionIds: number[];
    onToggle: (id: number) => void;
    onSelectModule: (perms: any[], checked: boolean | 'indeterminate') => void;
    onSelectAll: (checked: boolean | 'indeterminate') => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
}) => {
    const permissionSet = useMemo(() => new Set(selectedPermissionIds.map(Number)), [selectedPermissionIds]);
    
    const filteredPermissionsMap = useMemo(() => {
        if (!searchQuery) return permissionsMap;
        const q = searchQuery.toLowerCase();
        const filtered: Record<string, any[]> = {};
        
        Object.entries(permissionsMap).forEach(([module, perms]) => {
            const matchesModule = module.toLowerCase().includes(q);
            const filteredPerms = perms.filter(p => p.name.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q));
            
            if (matchesModule || filteredPerms.length > 0) {
                filtered[module] = matchesModule ? perms : filteredPerms;
            }
        });
        return filtered;
    }, [permissionsMap, searchQuery]);

    const uniqueAllPermissionIds = useMemo(() => {
        const ids = new Set<number>();
        Object.values(permissionsMap).forEach((perms) => {
            perms.forEach((p) => ids.add(Number(p.id)));
        });
        return ids;
    }, [permissionsMap]);

    const isAllGlobalSelected = uniqueAllPermissionIds.size > 0 && Array.from(uniqueAllPermissionIds).every((id) => permissionSet.has(id));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 sticky top-0 bg-background z-10">
                <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                        Permissions Matrix
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Assign granular access rights to this role.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search Permissions */}
                    <div className="relative group max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <IconSearch className="h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search permissions..."
                            className="block mr-10 w-full pl-10 pr-10 py-2 text-sm bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                <IconX className="h-4 w-4 text-gray-400 hover:text-red-500 transition-colors" />
                            </button>
                        )}
                    </div>

                    <div className="flex h-9 items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700">
                        <Checkbox
                            id="select-all-global"
                            checked={isAllGlobalSelected}
                            onCheckedChange={onSelectAll}
                            className="h-4 w-4"
                        />
                        <label htmlFor="select-all-global" className="text-xs mb-0 font-bold cursor-pointer select-none">
                            Select All
                        </label>
                        <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">
                            ({uniqueAllPermissionIds.size}) 
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {Object.entries(filteredPermissionsMap).length === 0 ? (
                    <div className="py-20 text-center space-y-3">
                    <Illustration name="sheild" />
                        <p className="text-sm text-gray-500">No permissions found matching "{searchQuery}"</p>
                    </div>
                ) : (
                    Object.entries(filteredPermissionsMap).map(([module, perms]: [string, any[]]) => {
                        const moduleIds = perms.map((p: any) => Number(p.id));
                        const selectedInModule = moduleIds.filter((id: number) => permissionSet.has(id));
                        const allSelected = moduleIds.length > 0 && selectedInModule.length === moduleIds.length;
                        const isIndeterminate = selectedInModule.length > 0 && selectedInModule.length < moduleIds.length;

                        return (
                            <div
                                key={module}
                                className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-all hover:border-primary/20"
                            >
                                <div className="bg-gray-50/50 dark:bg-white/5 px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <h4 className="text-xs font-black text-primary uppercase tracking-widest">
                                        {module}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">
                                            {selectedInModule.length} / {perms.length}
                                        </span>
                                        <Checkbox
                                            id={`select-all-${module}`}
                                            checked={allSelected ? true : isIndeterminate ? 'indeterminate' : false}
                                            onCheckedChange={(checked) => onSelectModule(perms, checked)}
                                            className="h-4 w-4"
                                        />
                                        <label htmlFor={`select-all-${module}`} className="text-[10px] mb-0 font-bold cursor-pointer uppercase tracking-tight text-gray-500">
                                            All
                                        </label>
                                    </div>
                                </div>
                                <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {perms.map((p: any) => {
                                        const pId = Number(p.id);
                                        const isChecked = permissionSet.has(pId);
                                        return (
                                            <div
                                                key={pId}
                                                className={`flex items-center space-x-3 p-2 rounded-lg transition-colors group ${
                                                    isChecked
                                                        ? 'bg-primary/5 border border-primary/10'
                                                        : 'hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent'
                                                }`}
                                            >
                                                <Checkbox
                                                    id={`p-${pId}`}
                                                    checked={isChecked}
                                                    onCheckedChange={() => onToggle(pId)}
                                                    className="h-4 w-4 rounded shadow-none"
                                                />
                                                <label
                                                    htmlFor={`p-${pId}`}
                                                    className={`text-xs font-semibold mb-0 cursor-pointer select-none transition-colors grow py-1 ${
                                                        isChecked ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
                                                    }`}
                                                >
                                                    {p.name}
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default RoleModal;
