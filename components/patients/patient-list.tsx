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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type PatientQueryParams,
  usePatientList,
} from "@/hooks/patient/use-patient";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Loader2,
  PlusCircle,
  SortAsc,
  SortDesc,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DeletePatientDialog } from "./delete-patient-dialog";

interface PatientListProps {
  queryParams: PatientQueryParams;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
}

export function PatientList({
  queryParams,
  onPageChange,
  onSortChange,
}: PatientListProps) {
  const { data, isLoading, error } = usePatientList(queryParams);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erreur</CardTitle>
          <CardDescription>
            Une erreur est survenue lors du chargement des patients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const handleSort = (column: string) => {
    const newSortOrder =
      queryParams.sortBy === column && queryParams.sortOrder === "asc"
        ? "desc"
        : "asc";

    onSortChange(column, newSortOrder);
  };

  const renderSortIcon = (column: string) => {
    if (queryParams.sortBy !== column) return null;

    return queryParams.sortOrder === "asc" ? (
      <SortAsc className="ml-1 h-4 w-4" />
    ) : (
      <SortDesc className="ml-1 h-4 w-4" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des patients</CardTitle>
        <CardDescription>
          Gérez vos patients atteints de maladie rénale chronique
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data?.data.length === 0 ? (
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Nom
                      {renderSortIcon("name")}
                    </div>
                  </TableHead>
                  <TableHead>Âge</TableHead>
                  <TableHead>Sexe</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("stage")}
                  >
                    <div className="flex items-center">
                      Stade MRC
                      {renderSortIcon("stage")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("lastVisit")}
                  >
                    <div className="flex items-center">
                      Dernière visite
                      {renderSortIcon("lastVisit")}
                    </div>
                  </TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((patient) => {
                  // Calculate age from birthdate
                  const birthdate = new Date(patient.birthdate);
                  const today = new Date();
                  let age = today.getFullYear() - birthdate.getFullYear();
                  const hasBirthdayPassed =
                    today.getMonth() > birthdate.getMonth() ||
                    (today.getMonth() === birthdate.getMonth() &&
                      today.getDate() >= birthdate.getDate());
                  if (!hasBirthdayPassed) age--;

                  // Format date
                  const formatDate = (dateString: string) => {
                    try {
                      const date = new Date(dateString);
                      return new Intl.DateTimeFormat("fr-FR").format(date);
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) {
                      return dateString;
                    }
                  };

                  return (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">
                        {patient.lastname} {patient.firstname}
                      </TableCell>
                      <TableCell>{age} ans</TableCell>
                      <TableCell>
                        {patient.sex === "M" ? "Homme" : "Femme"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`
                            ${
                              patient.medicalInfo.stade === 1
                                ? "bg-green-100 text-green-800"
                                : ""
                            }
                            ${
                              patient.medicalInfo.stade === 2
                                ? "bg-blue-100 text-blue-800"
                                : ""
                            }
                            ${
                              patient.medicalInfo.stade === 3
                                ? "bg-amber-100 text-amber-800"
                                : ""
                            }
                            ${
                              patient.medicalInfo.stade >= 4
                                ? "bg-red-100 text-red-800"
                                : ""
                            }
                            px-1.5
                          `}
                        >
                          Stade {patient.medicalInfo.stade}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(patient.medicalInfo.lastvisite)}
                      </TableCell>
                      <TableCell>
                        {patient.medicalInfo.status === "stable" && (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 border-green-200"
                          >
                            Stable
                          </Badge>
                        )}
                        {patient.medicalInfo.status === "improving" && (
                          <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-800 border-blue-200"
                          >
                            En amélioration
                          </Badge>
                        )}
                        {patient.medicalInfo.status === "worsening" && (
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-800 border-amber-200"
                          >
                            En détérioration
                          </Badge>
                        )}
                        {patient.medicalInfo.status === "critical" && (
                          <Badge variant="destructive">Critique</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/patients/${patient.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Voir</span>
                            </Button>
                          </Link>
                          <Link href={`/patients/${patient.id}/modifier`}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Modifier</span>
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPatientToDelete(patient.id)}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Supprimer</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {data?.pagination && data.pagination.totalPages > 1 && (
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Affichage de{" "}
            {(data.pagination.page - 1) * data.pagination.limit + 1} à{" "}
            {Math.min(
              data.pagination.page * data.pagination.limit,
              data.pagination.totalItems
            )}{" "}
            sur {data.pagination.totalItems} patients
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(data.pagination.page - 1)}
              disabled={data.pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: data.pagination.totalPages }, (_, i) => (
              <Button
                key={i}
                variant={data.pagination.page === i + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(data.pagination.page + 1)}
              disabled={data.pagination.page === data.pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}

      {patientToDelete && (
        <DeletePatientDialog
          patientId={patientToDelete}
          // onClose={() => setPatientToDelete(null)}
        />
      )}
    </Card>
  );
}
