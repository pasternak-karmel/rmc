"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTreatments } from "@/hooks/patient/use-treatments";
import { AlertTriangle, Check, X } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { AddTraitement } from "./traitement";

interface PatientMedicationsProps {
  patientId: string;
}

export function PatientMedications({ patientId }: PatientMedicationsProps) {
  const { data: medications, isLoading, error } = useTreatments(patientId);

  if (isLoading)
    return <Skeleton className="h-[300px] w-full border rounded-md" />;

  if (error) return <div>Erreur lors du chargement des traitements</div>;

  if (!medications) return <div>Aucun traitement disponible</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Traitements en cours</h3>
        <AddTraitement patientId={patientId} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Médicament</TableHead>
              <TableHead>Posologie</TableHead>
              <TableHead>Fréquence</TableHead>
              <TableHead>Date de début</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Prescrit par</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medications.map((medication) => (
              <TableRow key={medication.id}>
                <TableCell>
                  <div className="font-medium">{medication.medicament}</div>
                  <div className="text-xs text-muted-foreground">
                    {medication.category}
                  </div>
                </TableCell>
                <TableCell>{medication.posologie}</TableCell>
                <TableCell>{medication.frequence}</TableCell>
                <TableCell>{medication.status}</TableCell>
                <TableCell>
                  {medication.status === "active" && (
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      <span>Actif</span>
                    </Badge>
                  )}
                  {medication.status === "discontinued" && (
                    <Badge
                      variant="outline"
                      className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      <span>Arrêté</span>
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{medication.medecin}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {medication.notes}
                    {medication.interactions && (
                      <div
                        className="tooltip"
                        data-tip="Interactions médicamenteuses possibles"
                      >
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
