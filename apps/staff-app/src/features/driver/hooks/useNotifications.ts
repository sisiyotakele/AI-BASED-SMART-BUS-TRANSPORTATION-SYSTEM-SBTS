// src/features/driver/hooks/useNotifications.ts

import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils';

export interface Notification {
  id: number;
  type: string;
  message: string;
  time: string;
  read: boolean;
  category: "all" | "unread" | "alerts" | "updates";
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = useCallback(() => {
    setIsLoading(true);
    const saved = storage.get<Notification[]>('notifications', []);
    setNotifications(saved);
    setIsLoading(false);
  }, []);

  const markAsRead = useCallback((id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    // Save to localStorage
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    storage.set('notifications', updated);
    window.dispatchEvent(new Event('storage'));
  }, [notifications]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
    const updated = notifications.map((n) => ({ ...n, read: true }));
    storage.set('notifications', updated);
    window.dispatchEvent(new Event('storage'));
  }, [notifications]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now(),
    };
    const updated = [newNotification, ...notifications];
    storage.set('notifications', updated);
    setNotifications(updated);
    window.dispatchEvent(new Event('storage'));
  }, [notifications]);

  useEffect(() => {
    loadNotifications();
    const handleUpdate = () => loadNotifications();
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadNotifications]);

  return {
    notifications,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    setNotifications,
  };
};