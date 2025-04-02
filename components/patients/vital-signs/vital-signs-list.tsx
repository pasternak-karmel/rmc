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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  useAvailableVitalSignTypes,
  useDeleteVitalSign,
  useVitalSigns,
} from "@/hooks/patient/use-vital-signs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { useState } from "react";
import { VitalSignsDialog } from "./vital-signs-dialog";

interface VitalSignsListProps {
  patientId: string;
}

export function VitalSignsList({ patientId }: VitalSignsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [type, setType] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page] = useState(1);
  const [limit] = useState(10);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data, isLoading, isError } = useVitalSigns(patientId, {
    type,
    sortOrder,
    page,
    limit,
  });

  const { data: availableTypes, isLoading: isTypesLoading } =
    useAvailableVitalSignTypes(patientId);
  const deleteVitalSign = useDeleteVitalSign(patientId);

  const handleDelete = () => {
    if (selectedRecord) {
      deleteVitalSign.mutate(selectedRecord.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedRecord(null);
        },
      });
    }
  };

  const handleEdit = (record: any) => {
    setSelectedRecord(record);
    setIsEditDialogOpen(true);
  };

  const filteredRecords = data?.data.filter((record) => {
    if (!searchTerm) return true;

    const measurements =
      typeof record.measurements === "string"
        ? JSON.parse(record.measurements)
        : record.measurements;

    return measurements.some(
      (m: any) =>
        m.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.value.toString().includes(searchTerm) ||
        m.unit.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Constantes vitales</CardTitle>
          <CardDescription>
            Une erreur est survenue lors du chargement des données.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Constantes vitales</CardTitle>
            <CardDescription>
              Consultez les constantes vitales du patient
            </CardDescription>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {!isTypesLoading &&
                    availableTypes?.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select
                value={sortOrder}
                onValueChange={(value) => setSortOrder(value as "asc" | "desc")}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Ordre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Plus ancien</SelectItem>
                  <SelectItem value="desc">Plus récent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredRecords?.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">
                  Aucune constante vitale trouvée
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Mesures</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords?.map((record) => {
                      const measurements = Array.isArray(record.measurements)
                        ? record.measurements
                        : typeof record.measurements === "string"
                          ? JSON.parse(record.measurements)
                          : [];
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {format(new Date(record.date), "PPP", {
                              locale: fr,
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {measurements.map((m: any, i: number) => (
                                <div
                                  key={i}
                                  className="rounded-md bg-muted px-2 py-1 text-xs"
                                >
                                  {m.type}: {m.value} {m.unit}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {record.notes ? (
                              <span className="line-clamp-1">
                                {record.notes}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEdit(record)}
                                >
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedRecord(record);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {data?.pagination.totalItems ?? 0} enregistrements
          </div>
          {/* {data && data.pagination.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
            />
          )} */}
        </CardFooter>
      </Card>

      <VitalSignsDialog
        patientId={patientId}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {selectedRecord && (
        <VitalSignsDialog
          patientId={patientId}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          record={selectedRecord}
        />
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera
              définitivement cet enregistrement de constantes vitales.
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
