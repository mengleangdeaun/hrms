import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import FilterBar from '../../components/ui/FilterBar';
import TableSkeleton from '../../components/ui/TableSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import DeleteModal from '../../components/DeleteModal';
import ActionButtons from '../../components/ui/ActionButtons';
import { Badge } from '../../components/ui/badge';
import { IconShieldLock } from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import RoleModal from './RoleModal';

const RolesIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [roles, setRoles] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);

    // Filter & Sort & Pagination state
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchRoles = () => {
        setLoading(true);
        fetch('/api/access-control/roles', {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setRoles(data);
                } else {
                    setRoles([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setRoles([]);
                setLoading(false);
            });
    };

    const [loadingPermissions, setLoadingPermissions] = useState(true);

    const fetchPermissions = () => {
        setLoadingPermissions(true);
        fetch('/api/access-control/permissions')
            .then(res => res.json())
            .then(data => {
                setPermissions(data);
                setLoadingPermissions(false);
            })
            .catch(err => {
                console.error(err);
                setLoadingPermissions(false);
            });
    };

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    useEffect(() => {
        dispatch(setPageTitle(t('roles_permissions', 'Roles & Permissions')));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    const handleCreate = () => {
        setEditingRole(null);
        setModalOpen(true);
    };

    const handleEdit = (role: any) => {
        setEditingRole(role);
        setModalOpen(true);
    };

    const confirmDelete = (id: number) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);

        try {
            const response = await fetch(`/api/access-control/roles/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                toast.success('Role deleted successfully');
                fetchRoles();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to delete role');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
        }
    };

    const filteredRoles = useMemo(() => {
        let result = [...roles];
        if (search) {
            result = result.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
        }
        return result;
    }, [roles, search]);

    const paginatedRoles = filteredRoles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div>
            <FilterBar
                icon={<IconShieldLock className="w-6 h-6 text-primary" />}
                title="Roles & Permissions"
                description="Manage user roles and their associated access permissions."
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={handleCreate}
                addLabel="Add Role"
                onRefresh={fetchRoles}
            />

            {loading ? (
                <TableSkeleton columns={3} rows={5} />
            ) : roles.length === 0 ? (
                <EmptyState title="No Roles Found" description="Start by creating your first system role." onAction={handleCreate} actionLabel="Add Role" />
            ) : (
                <div className="table-responsive bg-white dark:bg-black rounded-lg border border-gray-100 dark:border-gray-800">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <th>Role Name</th>
                                <th>Description</th>
                                <th>Permissions</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRoles.map((role: any) => (
                                <tr key={role.id}>
                                    <td className="font-bold">{role.name}</td>
                                    <td className="text-sm">{role.description}</td>
                                    <td>
                                        <div className="flex flex-wrap gap-1">
                                            {role.permissions.slice(0, 3).map((p: any) => (
                                                <Badge key={p.id} variant="secondary" className="text-[10px]">{p.name}</Badge>
                                            ))}
                                            {role.permissions.length > 3 && (
                                                <Badge variant="secondary" className="text-[10px]">+{role.permissions.length - 3} more</Badge>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <ActionButtons onEdit={() => handleEdit(role)} onDelete={() => confirmDelete(role.id)} skipDeleteConfirm={true} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredRoles.length / itemsPerPage)}
                        totalItems={filteredRoles.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            <RoleModal
                isOpen={modalOpen}
                setIsOpen={setModalOpen}
                editingRole={editingRole}
                permissionsMap={permissions}
                loadingPermissions={loadingPermissions}
                onSuccess={fetchRoles}
            />

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title="Delete Role"
                message="Are you sure you want to delete this role? Users assigned to this role will lose their permissions."
            />
        </div>
    );
};

export default RolesIndex;
