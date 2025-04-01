"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

const alerts = [
  {
    id: "1",
    patient: "Sophie Laurent",
    patientId: "2",
    type: "critical",
    message: "DFG en baisse rapide (- 15% en 1 mois)",
    date: "Aujourd'hui, 09:45",
    resolved: false,
  },
  {
    id: "2",
    patient: "Philippe Moreau",
    patientId: "5",
    type: "critical",
    message: "Potassium élevé (5.8 mmol/L)",
    date: "Hier, 16:30",
    resolved: false,
  },
  {
    id: "3",
    patient: "Martin Dupont",
    patientId: "1",
    type: "warning",
    message: "Pression artérielle élevée (160/95 mmHg)",
    date: "Il y a 2 jours",
    resolved: false,
  },
  {
    id: "4",
    patient: "Jean Petit",
    patientId: "3",
    type: "info",
    message: "Résultats d'analyse disponibles",
    date: "Il y a 3 jours",
    resolved: true,
  },
  {
    id: "5",
    patient: "Marie Leroy",
    patientId: "4",
    type: "warning",
    message: "Protéinurie en augmentation",
    date: "Il y a 5 jours",
    resolved: true,
  },
];

export function RecentAlerts() {
  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-center justify-between p-3 rounded-lg border ${
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
                  href={`/patients/${alert.patientId}`}
                  className="font-medium hover:underline"
                >
                  {alert.patient}
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
