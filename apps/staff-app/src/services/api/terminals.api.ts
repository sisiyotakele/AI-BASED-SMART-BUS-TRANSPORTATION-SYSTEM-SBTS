import api from '@/lib/api';

export interface Terminal {
    id: string;
    terminalName: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    capacity?: number;
    facilities?: string;
    status?: string;
    phoneNumber?: string;
    managerName?: string;
    email?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTerminalDto {
    terminalName: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    capacity?: number;
    facilities?: string;
    status?: string;
    phoneNumber?: string;
    managerName?: string;
    email?: string;
}

export interface UpdateTerminalDto {
    terminalName?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    capacity?: number;
    facilities?: string;
    status?: string;
    phoneNumber?: string;
    managerName?: string;
    email?: string;
}

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export const terminalsApi = {
    /**
     * Get all terminals
     */
    getAll: async (search?: string): Promise<Terminal[]> => {
        const params = search ? { search } : {};
        const { data } = await api.get<ApiResponse<Terminal[]>>('/terminals', { params });
        return data.data;
    },

    /**
     * Get a single terminal by ID
     */
    getById: async (id: string): Promise<Terminal> => {
        const { data } = await api.get<ApiResponse<Terminal>>(`/terminals/${id}`);
        return data.data;
    },

    /**
     * Create a new terminal
     */
    create: async (terminalData: CreateTerminalDto): Promise<Terminal> => {
        // Strip empty strings to prevent backend Zod validation parsing errors (like empty email string)
        const sanitized = Object.fromEntries(
            Object.entries(terminalData).filter(([_, v]) => v !== '')
        );
        const { data } = await api.post<ApiResponse<Terminal>>('/terminals', sanitized);
        return data.data;
    },

    /**
     * Update an existing terminal
     */
    update: async (id: string, terminalData: UpdateTerminalDto): Promise<Terminal> => {
        const sanitized = Object.fromEntries(
            Object.entries(terminalData).filter(([_, v]) => v !== '')
        );
        const { data } = await api.patch<ApiResponse<Terminal>>(`/terminals/${id}`, sanitized);
        return data.data;
    },

    /**
     * Delete a terminal (soft delete)
     */
    delete: async (id: string): Promise<void> => {
        await api.delete(`/terminals/${id}`);
    },
};

