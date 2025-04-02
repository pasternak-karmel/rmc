"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWorkflow } from "@/hooks/patient/use-workflow";
import {
  ArrowRight,
  ClipboardList,
  Loader2,
  PlusCircle,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function WorkflowsPage() {
  const { data: workflows, isLoading } = useWorkflow();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Workflows de suivi
        </h1>
        <Link href="/workflows/nouveau">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nouveau workflow
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : workflows?.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-muted-foreground mb-4">Aucun patient trouvé</p>
          <Link href="/patients/nouveau">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter un patient
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows?.data.map((workflow) => (
            <Card key={workflow.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{workflow.title}</CardTitle>
                <CardDescription>{workflow.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mb-2">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-xl font-bold">{workflow.patients}</div>
                    <div className="text-xs text-muted-foreground">
                      Patients
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mb-2">
                      <ClipboardList className="h-5 w-5 text-primary" />
                    </div>
                    {/* <div className="text-xl font-bold">{workflow.tasks}</div> */}
                    <div className="text-xs text-muted-foreground">Tâches</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mb-2">
                      <Badge className="h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {workflow.alerts}
                      </Badge>
                    </div>
                    <div className="text-xl font-bold">{workflow.alerts}</div>
                    <div className="text-xs text-muted-foreground">Alertes</div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground text-center">
                  Mis à jour {workflow.lastUpdated}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/workflows/${workflow.id}/parametres`}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configurer
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/workflows/${workflow.id}`}>
                    Gérer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
