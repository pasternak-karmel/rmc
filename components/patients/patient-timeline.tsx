"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePatientHistory } from "@/hooks/patient/use-historique";
import {
  AlertTriangle,
  Calendar,
  FileCheck,
  FileText,
  FlaskRoundIcon as Flask,
  Pill,
  Stethoscope,
} from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { formatDateCustom } from "./date-formater";

interface PatientTimelineProps {
  patientId: string;
}

export function PatientTimeline({ patientId }: PatientTimelineProps) {
  const { patientHistory, isLoadingPatientHistory, errorPatientHistory } =
    usePatientHistory(patientId);

  if (errorPatientHistory) {
    return (
      <div className="flex items-center justify-center h-[300px] border rounded-md">
        <p className="text-destructive">
          Erreur lors du chargement de l&apos;historique:{" "}
          {errorPatientHistory.message}
        </p>
      </div>
    );
  }

  if (isLoadingPatientHistory) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  if (!patientHistory || patientHistory.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] border rounded-md">
        <p className="text-muted-foreground">Aucun historique disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {patientHistory.map((event, index) => (
        <div key={event.id} className="relative pl-8 pb-8">
          {index < patientHistory.length - 1 && (
            <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
          )}

          <div className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border bg-background">
            {event.type === "consultation" && (
              <Stethoscope className="h-4 w-4 text-blue-500" />
            )}
            {event.type === "lab" && (
              <Flask className="h-4 w-4 text-amber-500" />
            )}
            {event.type === "medication" && (
              <Pill className="h-4 w-4 text-green-500" />
            )}
            {event.type === "alert" && (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
            {event.type === "document" && (
              <FileCheck className="h-4 w-4 text-purple-500" />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDateCustom(event.date)}</span>
              </div>

              {event.type === "consultation" && (
                <Badge
                  variant="outline"
                  className="bg-blue-100 text-blue-800 border-blue-200"
                >
                  Consultation
                </Badge>
              )}
              {event.type === "lab" && (
                <Badge
                  variant="outline"
                  className="bg-amber-100 text-amber-800 border-amber-200"
                >
                  Analyses
                </Badge>
              )}
              {event.type === "medication" && (
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800 border-green-200"
                >
                  Traitement
                </Badge>
              )}
              {event.type === "alert" && (
                <Badge variant="destructive">Alerte</Badge>
              )}
              {event.type === "document" && (
                <Badge
                  variant="outline"
                  className="bg-purple-100 text-purple-800 border-purple-200"
                >
                  Document
                </Badge>
              )}
            </div>

            <div>
              <h3 className="font-medium">{event.title}</h3>
              <p className="text-sm text-muted-foreground">
                {event.description}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Avatar className="h-6 w-6">
                <AvatarFallback>{event.medecin[0]}</AvatarFallback>
              </Avatar>
              <span>Dr. {event.medecin}</span>
            </div>

            {event.type === "document" && (
              <div className="mt-2">
                <Button variant="outline" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Voir le document
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
