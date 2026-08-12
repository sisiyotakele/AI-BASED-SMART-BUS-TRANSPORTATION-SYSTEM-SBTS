import { useState, useMemo } from 'react';
import { Shield, Download, Search, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rbacService } from '@/services/rbac.service';
import { toast } from 'react-hot-toast';

export function RolesManagement() {
    const user = useAuthStore(state => state.user);
    const isSuperAdmin = user?.roles?.some((role: any) => 
        typeof role === 'string' ? role === 'SUPER_ADMIN' : role?.roleName === 'SUPER_ADMIN'
    ) ?? false;
    
    const queryClient = useQueryClient();
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: dbRoles = [] } = useQuery({
        queryKey: ['roles', { includePermissions: true }],
        queryFn: () => rbacService.getRoles(undefined, true),
    });

    const { data: dbPermissions = [] } = useQuery({
        queryKey: ['permissions'],
        queryFn: () => rbacService.getPermissions(),
    });

    // Extract dynamic permission matrix
    const permissionMatrix = useMemo(() => {
        const matrix: Record<string, Record<string, boolean>> = {};
        dbRoles.forEach(role => {
            matrix[role.roleName] = {};
            const rolePerms = (role as any).rolePermissions
                ? (role as any).rolePermissions.map((rp: any) => rp.permission.id)
                : role.permissions?.map(p => p.id) || [];
            dbPermissions.forEach(perm => {
                matrix[role.roleName][perm.id] = rolePerms.includes(perm.id);
            });
        });
        return matrix;
    }, [dbRoles, dbPermissions]);

    if (!selectedRole && dbRoles.length > 0) {
        setSelectedRole(dbRoles[0].roleName);
    }

    const assignPermissionMutation = useMutation({
        mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
            rbacService.assignPermissionToRole(roleId, permissionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            toast.success('Permission granted');
        },
        onError: () => toast.error('Failed to grant permission')
    });

    const removePermissionMutation = useMutation({
        mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
            rbacService.removePermissionFromRole(roleId, permissionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            toast.success('Permission revoked');
        },
        onError: () => toast.error('Failed to revoke permission')
    });

    const handleTogglePermission = (roleName: string, permissionId: string, hasPermission: boolean) => {
        const role = dbRoles.find(r => r.roleName === roleName);
        if (!role) return;

        if (hasPermission) {
            removePermissionMutation.mutate({ roleId: role.id, permissionId });
        } else {
            assignPermissionMutation.mutate({ roleId: role.id, permissionId });
        }
    };

    const handleExport = () => {
        if (!dbRoles.length || !dbPermissions.length) {
            toast.error('No data to export.');
            return;
        }

        const roleNames = dbRoles.map((r: any) => r.roleName);
        const headers = ['Permission Name', 'Description', ...roleNames];
        let csvContent = headers.join(',');

        const csvData = dbPermissions.map((perm: any) => {
            const row = [perm.permissionName, perm.description];
            roleNames.forEach((roleName: string) => {
                const hasPermission = permissionMatrix[roleName]?.[perm.id] || false;
                row.push(hasPermission ? 'Granted' : 'Denied');
            });
            return row;
        });

        csvContent = [headers.join(','), ...csvData.map(row => row.map(v => `"${v}"`).join(','))].join('\n');

        try {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `roles_permissions_matrix_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Export successful');
        } catch (error) {
            toast.error('Export failed');
        }
    };

    const filteredPermissions = dbPermissions.filter((perm: any) => 
        perm.permissionName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        perm.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 h-[70vh] text-center">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">403 - Access Denied</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md">
                    You do not have the required security clearance to view or modify System Roles & Permissions. This interface is strictly isolated to Super Administrators.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-[#2B4B9E] dark:bg-navy-900 border border-transparent dark:border-navy-700 rounded-2xl px-6 py-4 text-white shadow-sm">
                <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-3 shrink-0">
                        <h2 className="text-white font-semibold text-base whitespace-nowrap">Roles & Permissions Management</h2>
                        <div className="flex items-center gap-1.5 pl-3 border-l border-cyan-400/40">
                            <div className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded shrink-0">
                                <Shield className="w-3.5 h-3.5 text-cyan-100" />
                                <span className="text-[10px] text-cyan-100 uppercase">Total Roles:</span>
                                <span className="text-xs font-bold text-white">{dbRoles.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                        <button
                            onClick={handleExport}
                            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-transparent dark:border-navy-600 rounded hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors shrink-0 font-medium whitespace-nowrap"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export Matrix</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-navy-700">
                <div className="p-6 border-b border-slate-200 dark:border-navy-700">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Role Permissions Matrix</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Toggle permissions for each role. Green = Granted, Gray = Denied.</p>
                        </div>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="px-4 py-2 bg-white dark:bg-navy-800 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-navy-600 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {dbRoles.map(role => (
                                <option key={role.id} value={role.roleName}>{role.roleName.replace('_', ' ')}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-500 rounded"></div>
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    Granted: {Object.values(permissionMatrix[selectedRole] || {}).filter(v => v).length}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded"></div>
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    Denied: {Object.values(permissionMatrix[selectedRole] || {}).filter(v => !v).length}
                                </span>
                            </div>
                        </div>

                        <div className="relative max-w-xs w-full">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="w-4 h-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search permissions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-navy-800 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-navy-600 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-navy-800/50 border-b border-slate-200 dark:border-navy-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-1/3">Permission</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-16">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-20">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-navy-700">
                            {filteredPermissions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <p className="text-slate-500 dark:text-slate-400">No permissions found matching '{searchQuery}'</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredPermissions.map((permission: any) => {
                                    const hasPermission = permissionMatrix[selectedRole]?.[permission.id] || false;
                                    return (
                                        <tr key={permission.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{permission.permissionName}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{permission.id}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-slate-600 dark:text-slate-400">{permission.description}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${hasPermission
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50'
                                                    : 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-600'
                                                    }`}>
                                                    {hasPermission ? 'Granted' : 'Denied'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleTogglePermission(selectedRole, permission.id, hasPermission)}
                                                    className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded transition-colors ${hasPermission
                                                        ? 'bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-600 border border-slate-200 dark:border-navy-600'
                                                        : 'bg-cyan-500 text-white hover:bg-cyan-600 border border-cyan-500'
                                                        }`}
                                                >
                                                    {hasPermission ? 'Revoke' : 'Grant'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}