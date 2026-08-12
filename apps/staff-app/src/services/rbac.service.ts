import api from '@/lib/api';
import { ApiResponse, Role, Permission } from '@/types';

class RbacService {
    // --- Roles ---
    async getRoles(search?: string, includePermissions?: boolean) {
        const query = new URLSearchParams();
        if (search) query.append('search', search);
        if (includePermissions) query.append('includePermissions', 'true');
        
        const queryString = query.toString() ? `?${query.toString()}` : '';
        const response = await api.get<ApiResponse<Role[]>>(`/rbac/roles${queryString}`);
        return response.data.data || [];
    }

    async getRoleById(id: string) {
        const response = await api.get<ApiResponse<Role>>(`/rbac/roles/${id}`);
        return response.data.data;
    }

    async createRole(data: { roleName: string; description?: string }) {
        const response = await api.post<ApiResponse<Role>>('/rbac/roles', data);
        return response.data.data;
    }

    async updateRole(id: string, data: { description?: string }) {
        const response = await api.patch<ApiResponse<Role>>(`/rbac/roles/${id}`, data);
        return response.data.data;
    }

    async deleteRole(id: string) {
        const response = await api.delete<ApiResponse<null>>(`/rbac/roles/${id}`);
        return response.data;
    }

    // --- Permissions ---
    async getPermissions(filters?: { resource?: string; action?: string }) {
        const params = new URLSearchParams();
        if (filters?.resource) params.append('resource', filters.resource);
        if (filters?.action) params.append('action', filters.action);
        
        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await api.get<ApiResponse<Permission[]>>(`/rbac/permissions${query}`);
        return response.data.data || [];
    }

    // --- Role-Permission Assignments ---
    async assignPermissionToRole(roleId: string, permissionId: string) {
        const response = await api.post<ApiResponse<null>>(`/rbac/roles/${roleId}/permissions`, { permissionId });
        return response.data;
    }

    async removePermissionFromRole(roleId: string, permissionId: string) {
        const response = await api.delete<ApiResponse<null>>(`/rbac/roles/${roleId}/permissions/${permissionId}`);
        return response.data;
    }

    // --- User-Role Assignments ---
    async getUserRoles(userId: string) {
        const response = await api.get<ApiResponse<Role[]>>(`/rbac/users/${userId}/roles`);
        return response.data.data || [];
    }

    async assignRoleToUser(userId: string, roleId: string) {
        const response = await api.post<ApiResponse<null>>(`/rbac/users/${userId}/roles`, { roleId });
        return response.data;
    }

    async removeRoleFromUser(userId: string, roleId: string) {
        const response = await api.delete<ApiResponse<null>>(`/rbac/users/${userId}/roles/${roleId}`);
        return response.data;
    }
}

export const rbacService = new RbacService();
