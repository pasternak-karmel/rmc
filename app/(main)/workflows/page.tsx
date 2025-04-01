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
import {
  ArrowRight,
  ClipboardList,
  PlusCircle,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function WorkflowsPage() {
  const workflows = [
    {
      id: "1",
      name: "Suivi MRC Stade 3",
      description: "Workflow standard pour les patients en stade 3 de MRC",
      patients: 45,
      tasks: 12,
      alerts: 3,
      lastUpdated: "Il y a 2 jours",
    },
    {
      id: "2",
      name: "Suivi MRC Stade 4-5",
      description: "Workflow intensif pour les patients en stade avancé",
      patients: 18,
      tasks: 24,
      alerts: 7,
      lastUpdated: "Aujourd'hui",
    },
    {
      id: "3",
      name: "Préparation à la dialyse",
      description: "Préparation des patients approchant du stade terminal",
      patients: 8,
      tasks: 18,
      alerts: 2,
      lastUpdated: "Il y a 3 jours",
    },
    {
      id: "4",
      name: "Suivi post-transplantation",
      description: "Suivi des patients ayant reçu une greffe de rein",
      patients: 12,
      tasks: 15,
      alerts: 1,
      lastUpdated: "Il y a 1 semaine",
    },
    {
      id: "5",
      name: "Gestion de l'anémie",
      description: "Suivi spécifique pour les patients souffrant d'anémie",
      patients: 32,
      tasks: 8,
      alerts: 0,
      lastUpdated: "Il y a 5 jours",
    },
    {
      id: "6",
      name: "Contrôle tensionnel",
      description: "Suivi de l'hypertension chez les patients MRC",
      patients: 56,
      tasks: 10,
      alerts: 4,
      lastUpdated: "Hier",
    },
  ];

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{workflow.name}</CardTitle>
              <CardDescription>{workflow.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mb-2">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-xl font-bold">{workflow.patients}</div>
                  <div className="text-xs text-muted-foreground">Patients</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mb-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-xl font-bold">{workflow.tasks}</div>
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
    </div>
  );
}
