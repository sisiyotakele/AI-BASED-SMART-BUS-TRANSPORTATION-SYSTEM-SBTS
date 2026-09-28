// src/pages/NotificationsPage.tsx
import React from "react";
import { PassengerLayout } from "../layouts/PassengerLayout";
import { NotificationsPage as NotificationsFeature } from "../features/notifications/NotificationsPage";

export const NotificationsPage: React.FC = () => {
  return (
    <PassengerLayout pageTitle="Notifications & Transit Alerts">
      <NotificationsFeature />
    </PassengerLayout>
  );
};

export default NotificationsPage;
