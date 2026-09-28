import api from '../lib/api';

export interface AuditLog {
    id: string;
    userId: string | null;
    action: string;
    entityName: string;
    entityId: string | null;
    description?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    user?: {
        fullName: string;
        email: string;
    } | null;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

class AuditLogService {
    async getAuditLogs(params?: {
        userId?: string;
        action?: string;
        entityName?: string;
    }): Promise<AuditLog[]> {
        const response = await api.get('/audit/search', { params });
        return response.data.data;
    }

    async getAuditLogById(id: string): Promise<AuditLog> {
        const response = await api.get(`/audit/${id}`);
        return response.data.data;
    }
}

export const auditLogService = new AuditLogService();
