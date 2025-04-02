"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDeleteLabResult,
  useLabResult,
} from "@/hooks/patient/use-lab-results";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LabResultsDialog } from "./lab-results-dialog";

interface LabResultsDetailProps {
  patientId: string;
  resultId: string;
}

export function LabResultsDetail({
  patientId,
  resultId,
}: LabResultsDetailProps) {
  const router = useRouter();
  const { data, isLoading, isError } = useLabResult(resultId);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteLabResult = useDeleteLabResult(patientId);

  const handleDelete = () => {
    deleteLabResult.mutate(resultId, {
      onSuccess: () => {
        router.push(`/patients/${patientId}/analyses`);
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erreur</CardTitle>
          <CardDescription>
            Une erreur est survenue lors du chargement des données.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const results = JSON.parse(data.results);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Résultats d&apos;analyse</CardTitle>
            <CardDescription>
              {format(new Date(data.date), "PPP", { locale: fr })}
              {data.labName && ` - ${data.labName}`}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Modifier</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Supprimer</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test</TableHead>
                <TableHead>Résultat</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead>Valeurs de référence</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{result.name}</TableCell>
                  <TableCell>{result.value}</TableCell>
                  <TableCell>{result.unit}</TableCell>
                  <TableCell>
                    {result.referenceMin !== undefined &&
                    result.referenceMax !== undefined
                      ? `${result.referenceMin} - ${result.referenceMax}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {result.isAbnormal ? (
                      <span className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                        Anormal
                      </span>
                    ) : (
                      <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        Normal
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data.notes && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Notes
              </h3>
              <p className="mt-1 whitespace-pre-line">{data.notes}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div className="text-xs text-muted-foreground">
            Dernière mise à jour:{" "}
            {format(new Date(data.updatedAt), "PPp", { locale: fr })}
          </div>
        </CardFooter>
      </Card>

      <LabResultsDialog
        patientId={patientId}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        record={data}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera
              définitivement ce résultat d&apos;analyse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
