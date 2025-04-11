import { AppointmentDashboard } from "@/components/rendezvous/appointment-dashboard";

export const metadata = {
  title: "Rendez-vous",
  description: "Gérez vos rendez-vous",
};

export default function AppointmentPage() {
  return (
    <div className="container py-6 space-y-6">
      <AppointmentDashboard />
    </div>
  );
}
