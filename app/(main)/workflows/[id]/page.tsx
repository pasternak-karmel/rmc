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
import { WorkflowAlerts } from "@/components/workflows/workflow-alerts";
import { WorkflowPatients } from "@/components/workflows/workflow-patients";
import { WorkflowTasks } from "@/components/workflows/workflow-tasks";
import { useFetchWorkflow } from "@/hooks/patient/use-workflow";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  PlusCircle,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { use } from "react";

type Params = Promise<{ id: string }>;

export default function WorkflowDetailsPage(props: { params: Params }) {
  const params = use(props.params);
  const id = params.id;

  const { data: workflow } = useFetchWorkflow(id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/workflows">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{workflow?.title}</h1>
        <div className="ml-auto">
          <Link href={`/workflows/${params.id}/parametres`}>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflow?.patients}</div>
            <p className="text-xs text-muted-foreground">
              Suivis avec ce workflow
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflow?.tasks.pending}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span>{workflow?.tasks.completed} terminées</span>
              <span className="mx-1">•</span>
              <Clock className="h-3 w-3 text-amber-500" />
              <span>{workflow?.tasks.pending} en attente</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflow?.alerts.total}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3 text-destructive" />
              <span>{workflow?.alerts.critical} critiques</span>
              <span className="mx-1">•</span>
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              <span>{workflow?.alerts.warning} avertissements</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prochains RDV</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Dans les 7 prochains jours
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="patients" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="patients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Patients</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>Tâches</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Alertes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Patients dans ce workflow</CardTitle>
                <CardDescription>
                  Liste des patients suivis avec ce workflow
                </CardDescription>
              </div>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Ajouter un patient
              </Button>
            </CardHeader>
            <CardContent>
              <WorkflowPatients workflowId={params.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tâches à effectuer</CardTitle>
                <CardDescription>
                  Tâches programmées pour les patients de ce workflow
                </CardDescription>
              </div>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nouvelle tâche
              </Button>
            </CardHeader>
            <CardContent>
              <WorkflowTasks workflowId={params.id} />
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
              <WorkflowAlerts workflowId={params.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
