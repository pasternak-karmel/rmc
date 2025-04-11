import { DeletePatientDialog } from "@/components/patients/delete-patient-dialog";
import { PatientDetails } from "@/components/patients/patient-details";
import { PatientLabs } from "@/components/patients/patient-labs";
import { PatientMedications } from "@/components/patients/patient-medications";
import { PatientTimeline } from "@/components/patients/patient-timeline";
import { PatientVitals } from "@/components/patients/patient-vitals";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Edit,
  FileText,
  Pill,
} from "lucide-react";
import Link from "next/link";
import { use } from "react";

type Params = Promise<{ id: string }>;

export default function PatientDetailsPage(props: { params: Params }) {
  const params = use(props.params);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/patients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Dossier patient</h1>
        <div className="ml-auto flex gap-2">
          <Link href={`/patients/${params.id}/modifier`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          </Link>
          <DeletePatientDialog patientId={params.id} onClose={() => {}} />
          <Link href={`/patients/${params.id}/analyse`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Consulter les analyses
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <PatientDetails id={params.id} />
        <div className="md:col-span-5">
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Historique</span>
              </TabsTrigger>
              <TabsTrigger value="vitals" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Constantes</span>
              </TabsTrigger>
              <TabsTrigger value="labs" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Analyses</span>
              </TabsTrigger>
              <TabsTrigger
                value="medications"
                className="flex items-center gap-2"
              >
                <Pill className="h-4 w-4" />
                <span className="hidden sm:inline">Traitements</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historique du patient</CardTitle>
                  <CardDescription>
                    Consultations, examens et événements importants
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PatientTimeline patientId={params.id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vitals" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Constantes vitales</CardTitle>
                  <CardDescription>
                    Évolution des constantes vitales au fil du temps
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PatientVitals patientId={params.id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="labs" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Résultats d&apos;analyses</CardTitle>
                  <CardDescription>
                    Analyses biologiques et examens complémentaires
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PatientLabs patientId={params.id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medications" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Traitements</CardTitle>
                  <CardDescription>
                    Médicaments prescrits et historique des prescriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PatientMedications patientId={params.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
