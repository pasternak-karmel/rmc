"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientAlerts } from "@/components/workflows/patient/patient-alerts";
import { PatientTasks } from "@/components/workflows/patient/tasks";
import { useFetchTasksAndAlerts } from "@/hooks/patient/use-patient";
import {
  ArrowLeft,
  Bell,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { use } from "react";

type Params = Promise<{ id: string }>;

export default function PatientWorkflowDetailsPage(props: { params: Params }) {
  const params = use(props.params);
  const id = params.id;
  const { data : workflow, isLoading} = useFetchTasksAndAlerts(id);
  
  if (isLoading) {
    return <div>En cours...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/workflows">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{workflow?.patient.name}</h1>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>Tâches</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Alertes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tâches à effectuer</CardTitle>
                <CardDescription>
                  Tâches programmées pour ce patient
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <PatientTasks data={{ tasks: workflow?.tasks, patient: workflow?.patient }} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertes actives</CardTitle>
              <CardDescription>
                Alertes générées pour les patients de ce workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PatientAlerts data = {{alerts: workflow.alerts, patient: workflow.patient}} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
