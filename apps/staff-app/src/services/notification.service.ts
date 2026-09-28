import api from '../lib/api';

export interface Notification {
    id: string; // The NotificationUser ID
    isRead: boolean;
    createdAt: string;
    notification: {
        id: string;
        notificationType: 'TRIP_UPDATE' | 'ROUTE_CHANGE' | 'MAINTENANCE' | 'SYSTEM' | 'EMERGENCY';
        title: string;
        message: string;
        priority: 'low' | 'normal' | 'high' | 'urgent';
        createdAt: string;
    };
}

class NotificationService {
    async getNotifications(params?: { page?: number; limit?: number; isRead?: boolean }): Promise<Notification[]> {
        const response = await api.get('/notifications', { params });
        return response.data.data;
    }

    async createNotification(data: {
        notificationType: string;
        title: string;
        message: string;
        priority: string;
        userIds: string[];
    }): Promise<any> {
        const response = await api.post('/notifications', data);
        return response.data;
    }

    async markAsRead(id: string): Promise<any> {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data;
    }

    async deleteNotification(id: string): Promise<any> {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    }
}

export const notificationService = new NotificationService();
