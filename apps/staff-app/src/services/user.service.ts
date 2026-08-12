import api from '@/lib/api';
import { ApiResponse } from '@/types';

export interface User {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    roles: string[];
    createdAt: string;
    lastLoginAt?: string;
    isActive: boolean;
    department?: string;
}

class UserService {
    async getUsers(params: { search?: string, isActive?: boolean, page?: number, limit?: number }) {
        const query = new URLSearchParams();
        if (params.search) query.append('search', params.search);
        if (params.isActive !== undefined) query.append('isActive', params.isActive.toString());
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        
        const queryString = query.toString() ? `?${query.toString()}` : '';
        const response = await api.get<ApiResponse<User[]>>(`/users${queryString}`);
        return response.data;
    }

    async getUser(id: string) {
        const response = await api.get<ApiResponse<User>>(`/users/${id}`);
        return response.data.data;
    }

    async createUser(data: Partial<User> & { password?: string }) {
        const response = await api.post<ApiResponse<User>>('/users', data);
        return response.data;
    }

    async updateUser(id: string, data: Partial<User> & { password?: string }) {
        const response = await api.patch<ApiResponse<User>>(`/users/${id}`, data);
        return response.data;
    }

    async deleteUser(id: string) {
        const response = await api.delete<ApiResponse<null>>(`/users/${id}`);
        return response.data;
    }
}

export const userService = new UserService();
