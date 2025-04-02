"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/types/types";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export function RecentAlerts({ initialAlerts } : { initialAlerts: Alert[] }) {

  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);

  async function resolve(id:string){
    try {
      const response = await fetch(`/api/alerts/${id}`);
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la résolution de l'alerte"
        );
      }
  
      const data = await response.json();
      toast.success("Alerte résolue avec succès");

      setAlerts((prevAlerts) =>
        prevAlerts.map((alert) =>
          alert.id === id ? { ...alert, resolved: true } : alert
        )
      );

      return data as Alert;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Une erreur inconnue s'est produite");
      toast.error(error.message);
      throw error;
    }
  }


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
            <Button onClick={() => resolve(alert.id)} variant="outline" size="sm" className="gap-1">
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
