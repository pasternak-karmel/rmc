import { NotificationDashboard } from "@/components/notifications/notification-dashboard";

export const metadata = {
  title: "Notifications",
  description: "Gérez vos notifications et alertes",
};

export default function NotificationsPage() {
  return (
    <div className="container py-6 space-y-6">
      <NotificationDashboard />
    </div>
  );
}
