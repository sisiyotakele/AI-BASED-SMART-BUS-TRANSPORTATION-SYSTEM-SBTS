// apps/staff-app/src/features/driver/services/api/notifications.ts

import { apiClient } from './client';

interface Notification {
  id: number;
  type: string;
  message: string;
  time: string;
  read: boolean;
}

export const notificationsApi = {
  getAll: async (params?: {
    read?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ notifications: Notification[]; total: number }> => {
    const response = await apiClient.get('/notifications', { params });
    return response.data.data;
  },

  markAsRead: async (id: number): Promise<Notification> => {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data.data;
  },
};