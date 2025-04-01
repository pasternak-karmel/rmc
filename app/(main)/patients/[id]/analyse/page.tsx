import { ExportPatientData } from "@/components/patients/export-patient-data";
import { LabResultsChart } from "@/components/patients/lab-results/lab-results-chart";
import { MedicalHistoryChart } from "@/components/patients/medical-history/medical-history-chart";
import { PatientDetails } from "@/components/patients/patient-details";
import { TreatmentChart } from "@/components/patients/treatments/treatment-chart";
import { VitalSignsChart } from "@/components/patients/vital-signs/vital-signs-chart";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";

type Params = Promise<{ id: string }>;

export default function PatientAnalysisPage(props: { params: Params }) {
  const params = use(props.params);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href={`/patients/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          Analyse du patient
        </h1>
        <div className="ml-auto">
          <ExportPatientData patientId={params.id} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <PatientDetails id={params.id} />
        <div className="md:col-span-5 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <MedicalHistoryChart patientId={params.id} />
            <TreatmentChart patientId={params.id} />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <LabResultsChart patientId={params.id} />
            <VitalSignsChart patientId={params.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
