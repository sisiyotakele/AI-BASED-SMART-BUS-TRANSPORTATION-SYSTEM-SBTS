import { useConfirm } from '@/contexts/ConfirmContext';
import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Shield, Phone, UserCircle, Loader2, Download, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, userService } from '@/services/user.service';
import { rbacService } from '@/services/rbac.service';
import { toast } from 'react-hot-toast';

import { UserModal } from '../components/UserModal';

export function UserManagement() {
    const { confirm } = useConfirm();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Fetch Roles for filtering
    const { data: roles = [] } = useQuery({
        queryKey: ['roles'],
        queryFn: () => rbacService.getRoles()
    });

    // Fetch Users
    const { data: usersResponse, isLoading } = useQuery({
        queryKey: ['users', { search: searchTerm, isActive: filterStatus === 'all' ? undefined : filterStatus === 'active', page: currentPage, limit: itemsPerPage }],
        queryFn: () => userService.getUsers({
            search: searchTerm,
            isActive: filterStatus === 'all' ? undefined : filterStatus === 'active',
            page: currentPage,
            limit: itemsPerPage
        }),
    });

    const users = usersResponse?.data || [];
    const meta = usersResponse?.meta;
    const totalUsers = meta?.total || 0;
    const activeUsers = users.filter(u => u.isActive).length;
    const adminCount = users.filter(u => u.roles.includes('ADMIN')).length;
    const totalPages = meta?.totalPages || 1;

    const createUserMutation = useMutation({
        mutationFn: (data: any) => userService.createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User created successfully');
            setIsModalOpen(false);
        },
        onError: (err: any) => {
            const details = err.response?.data?.details;
            let msg = err.response?.data?.message || 'Failed to create user';
            if (details && details.fields) {
                const firstErr = Object.values(details.fields)[0];
                if (Array.isArray(firstErr)) msg += `: ${firstErr[0]}`;
            } else if (details && details.msg) {
                msg += `: ${details.msg}`;
            }
            if (err.response?.status !== 403) {
                toast.error(msg);
            }
        }
    });

    const updateUserMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => userService.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User updated successfully');
            setIsModalOpen(false);
        },
        onError: (err: any) => {
            const details = err.response?.data?.details;
            let msg = err.response?.data?.message || 'Failed to update user';
            if (details && details.fields) {
                const firstErr = Object.values(details.fields)[0];
                if (Array.isArray(firstErr)) msg += `: ${firstErr[0]}`;
            }
            if (err.response?.status !== 403) {
                toast.error(msg);
            }
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: (id: string) => userService.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User deleted successfully');
        },
        onError: (err: any) => {
            if (err.response?.status !== 403) {
                toast.error(err.response?.data?.message || 'Failed to delete user');
            }
        }
    });

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50';
            case 'FLEET_MANAGER': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50';
            case 'DISPATCHER': return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/50';
            case 'DRIVER': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50';
            case 'PASSENGER': return 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600';
            default: return 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600';
        }
    };

    const handleCreateUser = async () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const handleEditUser = async (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleModalSubmit = async (data: any) => {
        if (selectedUser) {
            updateUserMutation.mutate({ id: selectedUser.id, data });
        } else {
            createUserMutation.mutate(data);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        const isConfirmed = await confirm({ title: "Confirm Action", message: 'Are you sure you want to deactivate and mark this user as deleted?', confirmText: "Confirm", isDanger: true });
        if (isConfirmed) {
            deleteUserMutation.mutate(userId);
        }
    };

    const handleExport = () => {
        const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Department', 'Roles', 'Status', 'Last Login'];
        let csvContent = headers.join(',');

        if (users.length > 0) {
            const csvData = users.map(u => [
                u.id,
                u.fullName,
                u.email,
                u.phone,
                u.department || 'N/A',
                u.roles.join('; '),
                u.isActive ? 'Active' : 'Inactive',
                u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'
            ]);
            csvContent = [headers.join(','), ...csvData.map(row => row.map(v => `"${v}"`).join(','))].join('\n');
        } else {
            toast.error('No users found to export.');
            return;
        }

        try {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            if (users.length > 0) toast.success('Export successful');
        } catch (error) {
            toast.error('Export failed');
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-[#2B4B9E] dark:bg-navy-900 border border-transparent dark:border-navy-700 rounded-2xl px-6 py-4 text-white shadow-sm">
                <div className="flex items-center justify-between gap-2 w-full">
                    {/* Left: Title & Inline Compact Stats */}
                    <div className="flex items-center gap-3 shrink-0">
                        <h2 className="text-white font-semibold text-base whitespace-nowrap">User Management</h2>
                        <div className="flex items-center gap-1.5 pl-3 border-l border-cyan-400/40">
                            <div className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded shrink-0">
                                <UserCircle className="w-3.5 h-3.5 text-cyan-100" />
                                <span className="text-[10px] text-cyan-100 uppercase">Total:</span>
                                <span className="text-xs font-bold text-white">{totalUsers}</span>
                            </div>
                            <div className="flex items-center space-x-1 bg-green-500/20 px-2 py-1 rounded shrink-0">
                                <UserCircle className="w-3.5 h-3.5 text-green-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Active (Page):</span>
                                <span className="text-xs font-bold text-white">{activeUsers}</span>
                            </div>
                            <div className="flex items-center space-x-1 bg-purple-500/20 px-2 py-1 rounded shrink-0">
                                <Shield className="w-3.5 h-3.5 text-purple-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Admins (Page):</span>
                                <span className="text-xs font-bold text-white">{adminCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Search, Filters & Action Buttons */}
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                        <div className="relative flex-1 max-w-[150px]">
                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-navy-800 rounded border border-slate-200 dark:border-navy-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-400 dark:placeholder-slate-500"
                            />
                        </div>

                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="bg-white dark:bg-navy-800 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 outline-none min-w-[110px]"
                        >
                            <option value="all">All Roles</option>
                            {roles.map(r => (
                                <option key={r.id} value={r.roleName}>{r.roleName.replace('_', ' ')}</option>
                            ))}
                        </select>

                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-3 py-1 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-slate-100 text-sm"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="bg-white dark:bg-navy-800 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 outline-none w-[90px]"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        <button
                            onClick={handleExport}
                            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-transparent dark:border-navy-600 rounded hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors shrink-0 font-medium whitespace-nowrap"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export</span>
                        </button>

                        <button
                            onClick={handleCreateUser}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-medium transition-colors shrink-0 border border-transparent"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add User</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-navy-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-navy-800/50">
                                    <th className="px-6 py-4 font-medium">User Details</th>
                                    <th className="px-6 py-4 font-medium">Contact</th>
                                    <th className="px-6 py-4 font-medium">Roles</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-navy-700">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                            No users found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-cyan-700 dark:text-cyan-400 font-semibold text-sm">
                                                            {user.fullName.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-900 dark:text-white">{user.fullName}</div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">ID: {user.id.substring(0, 8)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                                                        <Search className="w-3.5 h-3.5 mr-2 opacity-50" />
                                                        {user.email}
                                                    </div>
                                                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                                                        <Phone className="w-3.5 h-3.5 mr-2 opacity-50" />
                                                        {user.phone}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {user.roles.map((role) => (
                                                        <span
                                                            key={role}
                                                            className={`px-2 py-0.5 text-[10px] font-semibold tracking-wide rounded-full ${getRoleBadgeColor(role)} uppercase`}
                                                        >
                                                            {role.replace('_', ' ')}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${user.isActive
                                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/30'
                                                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30'
                                                    }`}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Link
                                                        to={`/dashboard/users/${user.id}`}
                                                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded transition-colors"
                                                        title="View Profile"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleEditUser(user)}
                                                        className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded transition-colors"
                                                        title="Edit User"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                        title="Deactivate User"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-navy-700 flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            Showing Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm text-cyan-600 hover:bg-cyan-50 rounded disabled:text-slate-400 dark:text-slate-500 disabled:hover:bg-transparent transition-colors font-medium"
                            >
                                ← Previous
                            </button>
                            <div className="flex items-center space-x-1">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-7 h-7 flex items-center justify-center rounded text-sm font-medium transition-colors ${currentPage === i + 1
                                            ? 'bg-cyan-500 text-white'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm text-cyan-600 hover:bg-cyan-50 rounded disabled:text-slate-400 dark:text-slate-500 disabled:hover:bg-transparent transition-colors font-medium"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                user={selectedUser}
                isLoading={createUserMutation.isPending || updateUserMutation.isPending}
            />
        </div>
    );
}