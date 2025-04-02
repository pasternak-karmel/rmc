"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFetchWorkflowAlerts } from "@/hooks/patient/use-workflow";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

interface WorkflowAlertsProps {
  workflowId: string;
}

type Alert = {
  id: string;
  patient: {
    id: string;
    name: string;
    avatar: string;
    initials: string;
  };
  type: "critical" | "warning" | "info";
  message: string;
  date: string;
  resolved: boolean;
};

export function WorkflowAlerts({ workflowId }: WorkflowAlertsProps) {
  console.log(workflowId);
  const { data: alerts } = useFetchWorkflowAlerts(workflowId);

  // const alerts = [
  //   {
  //     id: "1",
  //     patient: {
  //       id: "2",
  //       name: "Sophie Laurent",
  //       avatar: "/placeholder.svg?height=40&width=40",
  //       initials: "SL",
  //     },
  //     type: "critical",
  //     message: "DFG en baisse rapide (- 15% en 1 mois)",
  //     date: "Aujourd'hui, 09:45",
  //     resolved: false,
  //   },
  //   {
  //     id: "2",
  //     patient: {
  //       id: "5",
  //       name: "Philippe Moreau",
  //       avatar: "/placeholder.svg?height=40&width=40",
  //       initials: "PM",
  //     },
  //     type: "critical",
  //     message: "Potassium élevé (5.8 mmol/L)",
  //     date: "Hier, 16:30",
  //     resolved: false,
  //   },
  //   {
  //     id: "3",
  //     patient: {
  //       id: "2",
  //       name: "Sophie Laurent",
  //       avatar: "/placeholder.svg?height=40&width=40",
  //       initials: "SL",
  //     },
  //     type: "warning",
  //     message: "Pression artérielle élevée (160/95 mmHg)",
  //     date: "Il y a 2 jours",
  //     resolved: false,
  //   },
  //   {
  //     id: "4",
  //     patient: {
  //       id: "5",
  //       name: "Philippe Moreau",
  //       avatar: "/placeholder.svg?height=40&width=40",
  //       initials: "PM",
  //     },
  //     type: "critical",
  //     message: "Protéinurie importante (3.5 g/24h)",
  //     date: "Il y a 3 jours",
  //     resolved: false,
  //   },
  //   {
  //     id: "5",
  //     patient: {
  //       id: "7",
  //       name: "Robert Lefebvre",
  //       avatar: "/placeholder.svg?height=40&width=40",
  //       initials: "RL",
  //     },
  //     type: "warning",
  //     message: "Hémoglobine en baisse (10.2 g/dL)",
  //     date: "Il y a 4 jours",
  //     resolved: false,
  //   },
  //   {
  //     id: "6",
  //     patient: {
  //       id: "9",
  //       name: "Jeanne Dubois",
  //       avatar: "/placeholder.svg?height=40&width=40",
  //       initials: "JD",
  //     },
  //     type: "warning",
  //     message: "Rendez-vous manqué",
  //     date: "Il y a 1 semaine",
  //     resolved: true,
  //   },
  //   {
  //     id: "7",
  //     patient: {
  //       id: "12",
  //       name: "Michel Blanc",
  //       avatar: "/placeholder.svg?height=40&width=40",
  //       initials: "MB",
  //     },
  //     type: "warning",
  //     message: "Prise de poids rapide (+2kg en 1 semaine)",
  //     date: "Il y a 5 jours",
  //     resolved: true,
  //   },
  // ];

  return (
    <div className="space-y-4">
      {alerts?.map((alert: Alert) => (
        <div
          key={alert.id}
          className={`flex items-center justify-between p-4 rounded-lg border ${
            alert.resolved ? "bg-muted/30" : "bg-white dark:bg-slate-950"
          }`}
        >
          <div className="flex items-center gap-3">
            {alert.type === "critical" && (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )}
            {alert.type === "warning" && (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            )}
            {alert.type === "info" && (
              <AlertCircle className="h-5 w-5 text-blue-500" />
            )}

            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/patients/${alert.patient.id}`}
                  className="flex items-center gap-1 hover:underline"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage
                      src={alert.patient.avatar}
                      alt={alert.patient.name}
                    />
                    <AvatarFallback>{alert.patient.initials}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{alert.patient.name}</span>
                </Link>
                {alert.type === "critical" && (
                  <Badge variant="destructive">Critique</Badge>
                )}
                {alert.type === "warning" && (
                  <Badge
                    variant="outline"
                    className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"
                  >
                    Attention
                  </Badge>
                )}
                {alert.type === "info" && (
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200"
                  >
                    Info
                  </Badge>
                )}
              </div>
              <p className="text-sm">{alert.message}</p>
              <p className="text-xs text-muted-foreground">{alert.date}</p>
            </div>
          </div>

          {!alert.resolved ? (
            <Button variant="outline" size="sm" className="gap-1">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Résoudre</span>
            </Button>
          ) : (
            <Badge
              variant="outline"
              className="bg-green-100 text-green-800 border-green-200"
            >
              Résolu
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
