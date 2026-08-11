// src/features/driver/components/notification/NotificationList.tsx

import React from 'react';
import { FaBell } from 'react-icons/fa';
import { Notification } from '../../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { EmptyState } from '../shared/EmptyState';

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: number) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onMarkAsRead,
}) => {
  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<FaBell className="text-3xl sm:text-4xl text-gray-300 dark:text-gray-500" />}
        title="No notifications yet"
        description="We'll notify you when something arrives"
      />
    );
  }

  return (
    <div className="flex flex-col">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
        />
      ))}
    </div>
  );
};