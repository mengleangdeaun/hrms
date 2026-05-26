import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import PerfectScrollbar from 'react-perfect-scrollbar';
import FilterBar from '../../components/ui/FilterBar';
import TableSkeleton from '../../components/ui/TableSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import SortableHeader from '../../components/ui/SortableHeader';
import DeleteModal from '../../components/DeleteModal';
import ActionButtons from '../../components/ui/ActionButtons';
import { Badge } from '../../components/ui/badge';
import { IconUsers, IconUserPlus, IconUser, IconShieldLock } from '@tabler/icons-react';
import { Checkbox } from '../../components/ui/checkbox';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import api from '@/utils/api';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SearchableMultiSelect from '../../components/ui/SearchableMultiSelect';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const UsersIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { hasPermission } = useAuth();
    const queryClient = useQueryClient();

    // Modal & Form State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    // Filter & Pagination state
    const [search, setSearch] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const initialFormState = {
        name: '',
        email: '',
        password: '',
        roles: [] as number[],
        branches: [] as number[],
        is_active: true,
        telegram_user_id: '',
    };

    const [formData, setFormData] = useState(initialFormState);

    // Queries
    const { data: users = [], isLoading: loadingUsers, isRefetching: refetchingUsers } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/access-control/users').then(res => res.data.data || res.data),
    });

    const { data: roles = [] } = useQuery({
        queryKey: ['roles'],
        queryFn: () => api.get('/access-control/roles').then(res => res.data),
    });

    const { data: branches = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: () => api.get('/hr/branches').then(res => res.data),
    });

    const { data: permissionsMap = {} } = useQuery({
        queryKey: ['permissions'],
        queryFn: () => api.get('/access-control/permissions').then(res => res.data),
    });

    // Flatten permissions for the filter
    const permissionOptions = useMemo(() => {
        return Object.values(permissionsMap as Record<string, any[]>)
            .flat()
            .map(p => ({
                value: p.slug,
                label: p.name,
                description: p.module
            }));
    }, [permissionsMap]);

    // Mutations
    const saveMutation = useMutation({
        mutationFn: (data: any) => {
            const url = editingUser ? `/access-control/users/${editingUser.id}` : '/access-control/users';
            const method = editingUser ? 'put' : 'post';
            return api[method](url, data);
        },
        onSuccess: () => {
            toast.success(`User ${editingUser ? 'updated' : 'created'} successfully`);
            setModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to save user');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/access-control/users/${id}`),
        onSuccess: () => {
            toast.success('User deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setDeleteModalOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    });

    useEffect(() => {
        dispatch(setPageTitle(t('system_users', 'System Users')));
    }, [dispatch, t]);

    const canCreate = hasPermission('create_users');
    const canEdit = hasPermission('edit_users');
    const canDelete = hasPermission('delete_users');

    const handleCreate = () => {
        setEditingUser(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '', 
            roles: user.roles.map((r: any) => r.id),
            branches: user.branches.map((b: any) => b.id),
            is_active: !!user.is_active,
            telegram_user_id: user.telegram_user_id || '',
        });
        setModalOpen(true);
    };

    const confirmDelete = (id: number) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        deleteMutation.mutate(itemToDelete);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    const filteredUsers = useMemo(() => {
        let result = [...users];
        if (search) {
            result = result.filter(u => 
                u.name?.toLowerCase().includes(search.toLowerCase()) || 
                u.email?.toLowerCase().includes(search.toLowerCase())
            );
        }
        if (selectedPermissions.length > 0) {
            result = result.filter(u => {
                const userPerms = u.permissions || [];
                // User must have ALL selected permissions
                return selectedPermissions.every(p => userPerms.includes(p));
            });
        }
        return result;
    }, [users, search, selectedPermissions]);

    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div>
            <FilterBar
                icon={<IconUsers className="w-6 h-6 text-primary" />}
                title="System Users"
                description="Manage system users, assign roles and control their branch access."
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={canCreate ? handleCreate : undefined}
                addLabel="Add User"
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
                hasActiveFilters={selectedPermissions.length > 0}
                onClearFilters={() => setSelectedPermissions([])}
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Filter by Permission</span>
                    <SearchableMultiSelect
                        options={permissionOptions}
                        value={selectedPermissions}
                        onChange={(val) => setSelectedPermissions(val as string[])}
                        placeholder="Select permissions..."
                        searchPlaceholder="Search permissions..."
                    />
                </div>
            </FilterBar>

            {loadingUsers ? (
                <TableSkeleton columns={4} rows={5} />
            ) : filteredUsers.length === 0 ? (
                <EmptyState 
                    title={selectedPermissions.length > 0 || search ? "No Matching Users" : "No Users Found"} 
                    description={selectedPermissions.length > 0 || search ? "Try adjusting your filters or search terms." : "Start by adding your first system user."} 
                    onAction={canCreate ? handleCreate : undefined} 
                    actionLabel="Add User" 
                />
            ) : (
                <div className="table-responsive bg-white dark:bg-black rounded-lg border border-gray-100 dark:border-gray-800">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Roles</th>
                                <th>Branches</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.map((user: any, index: number) => (
                                <tr key={user.id}>
                                <td className="text-start text-gray-400 text-xs font-medium">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                </td>
                                <td>
                                    <div className="flex items-center gap-2">
                                            <Avatar className="w-9 h-9 border border-gray-100 dark:border-gray-700">
                                            {user.avatar_url ? (
                                                <AvatarImage src={user.avatar_url} alt={user.name} className="object-cover" />
                                            ) : (
                                                <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                                                {user.name?.charAt(0) || '?'}
                                                </AvatarFallback>
                                            )}
                                            </Avatar>
                                            <span className="font-medium">{user.name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className="text-sm">{user.email}</td>
                                    <td>
                                        {user.is_active ? (
                                            <Badge variant="success">Active</Badge>
                                        ) : (
                                            <Badge variant="destructive">Inactive</Badge>
                                        )}
                                    </td>
                                    <td>
                                        <div className="flex flex-wrap gap-1">
                                            {(user.roles || []).map((r: any) => (
                                                <Badge key={r.id} variant="secondary">{r.name}</Badge>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-wrap gap-1">
                                            {(user.branches || []).map((b: any) => (
                                                <Badge key={b.id} variant="outline" className="text-primary">{b.name}</Badge>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <ActionButtons 
                                            onEdit={canEdit ? () => handleEdit(user) : undefined} 
                                            onDelete={canDelete ? () => confirmDelete(user.id) : undefined} 
                                            skipDeleteConfirm={true} 
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredUsers.length / itemsPerPage)}
                        totalItems={filteredUsers.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] h-auto flex flex-col p-0 border-0 gap-0 shadow-2xl rounded-2xl overflow-hidden">
                    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
                            <IconUser className="text-primary w-7 h-7" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingUser ? 'Edit User' : 'Create System User'}
                            </DialogTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                {editingUser ? 'Update the user details and assigned roles/branches.' : 'Add a new system user with specific roles and branch access.'}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-background min-h-0">
                        <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1 min-h-0">
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/20 rounded-2xl border border-gray-100 dark:border-gray-800">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-bold">Active Status</Label>
                                            <p className="text-xs text-muted-foreground">Toggle user account access</p>
                                        </div>
                                        <Switch
                                            checked={formData.is_active}
                                            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Full Name <span className="text-red-500">*</span></Label>
                                            <Input
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="User Full Name"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Email Address <span className="text-red-500">*</span></Label>
                                            <Input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="user@example.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Password {editingUser && '(Leave blank to keep current)'}</Label>
                                            <Input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                placeholder="********"
                                                required={!editingUser}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Telegram User ID</Label>
                                            <Input
                                                value={formData.telegram_user_id}
                                                onChange={(e) => setFormData({ ...formData, telegram_user_id: e.target.value })}
                                                placeholder="e.g. 123456789"
                                            />
                                            <p className="text-[10px] text-muted-foreground italic">Required for system notifications</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-primary font-bold">Assign Roles</Label>
                                        <div className="grid grid-cols-2 gap-4 p-5 bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-gray-100 dark:border-gray-800">
                                            {roles.map((role: any) => (
                                                <div key={role.id} className="flex items-center space-x-3">
                                                    <Checkbox
                                                        id={`role-${role.id}`}
                                                        checked={formData.roles.includes(role.id)}
                                                        onCheckedChange={() => {
                                                            const exists = formData.roles.includes(role.id);
                                                            setFormData({
                                                                ...formData,
                                                                roles: exists
                                                                    ? formData.roles.filter((id) => id !== role.id)
                                                                    : [...formData.roles, role.id],
                                                            });
                                                        }}
                                                        className="h-5 w-5"
                                                    />
                                                    <Label htmlFor={`role-${role.id}`} className="text-sm mb-0 font-medium cursor-pointer">
                                                        {role.name}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3 pb-4">
                                        <Label className="text-primary font-bold">Assign Branches</Label>
                                        <div className="grid grid-cols-2 gap-4 p-5 bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-gray-100 dark:border-gray-800">
                                            {branches.map((branch: any) => (
                                                <div key={branch.id} className="flex items-center space-x-3">
                                                    <Checkbox
                                                        id={`branch-${branch.id}`}
                                                        checked={formData.branches.includes(branch.id)}
                                                        onCheckedChange={() => {
                                                            const exists = formData.branches.includes(branch.id);
                                                            setFormData({
                                                                ...formData,
                                                                branches: exists
                                                                    ? formData.branches.filter((id) => id !== branch.id)
                                                                    : [...formData.branches, branch.id],
                                                            });
                                                        }}
                                                        className="h-5 w-5"
                                                    />
                                                    <Label htmlFor={`branch-${branch.id}`} className="text-sm mb-0 font-medium cursor-pointer">
                                                        {branch.name}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </PerfectScrollbar>

                        <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background/80 backdrop-blur-md">
                            <Button type="button" variant="ghost" className="px-5 transition-all active:scale-95" onClick={() => setModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={saveMutation.isPending}
                                className="px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
                            >
                                {saveMutation.isPending ? 'Saving...' : (
                                    <>
                                        <IconUserPlus className="w-4 h-4" />
                                        {editingUser ? 'Update User' : 'Create User'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={deleteMutation.isPending}
                title="Delete User"
                message="Are you sure you want to delete this user? This action cannot be undone."
            />
        </div>
    );
};

export default UsersIndex;
