import { AppointmentAutomation } from "@/components/automated-tasks/appointment-automation";
import { PatientMonitoring } from "@/components/automated-tasks/patient-monitoring";
import { ReportGenerator } from "@/components/automated-tasks/report-generator";
import { use } from "react";

type Params = Promise<{ id: string }>;

export default function AutomationPage(props: { params: Params }) {
  const params = use(props.params);

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-2xl font-bold">Automatisation et surveillance</h1>

      {/* <NotificationRulesEngine patientId={params.id} /> */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AppointmentAutomation patientId={params.id} />
        <ReportGenerator patientId={params.id} />
        <PatientMonitoring patientId={params.id} />
      </div>
    </div>
  );
}
