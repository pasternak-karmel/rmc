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
import { Checkbox } from "@/components/ui/checkbox";
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
  useDeleteLabResult,
  useLabResults,
} from "@/hooks/patient/use-lab-results";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDateCustom } from "../date-formater";
import { LabResultsDialog } from "./lab-results-dialog";

interface LabResultsListProps {
  patientId: string;
}

export function LabResultsList({ patientId }: LabResultsListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [abnormalOnly, setAbnormalOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page] = useState(1);
  const [limit] = useState(10);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data, isLoading, isError } = useLabResults(patientId, {
    abnormalOnly,
    sortOrder,
    page,
    limit,
  });

  const deleteLabResult = useDeleteLabResult(patientId);

  const handleDelete = () => {
    if (selectedRecord) {
      deleteLabResult.mutate(selectedRecord.id, {
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

  const handleView = (record: any) => {
    router.push(`/patients/${patientId}/analyses/${record.id}`);
  };

  console.log(data?.data);

  const filteredRecords = data?.data.filter((record) => {
    if (!searchTerm) return true;

    const results =
      typeof record.results === "string"
        ? JSON.parse(record.results)
        : record.results;

    return (
      (record.labName &&
        record.labName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.notes &&
        record.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      results.some(
        (r: any) =>
          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.value.toString().includes(searchTerm) ||
          r.unit.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  });

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Résultats d&apos;analyses</CardTitle>
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
            <CardTitle>Résultats d&apos;analyses</CardTitle>
            <CardDescription>
              Consultez les résultats d&apos;analyses du patient
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="abnormalOnly"
                  checked={abnormalOnly}
                  onCheckedChange={(checked) =>
                    setAbnormalOnly(checked as boolean)
                  }
                />
                <label
                  htmlFor="abnormalOnly"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Résultats anormaux uniquement
                </label>
              </div>
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
                  Aucun résultat d&apos;analyse trouvé
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Laboratoire</TableHead>
                      <TableHead>Résultats</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords?.map((record) => {
                      const results = Array.isArray(record.results)
                        ? record.results
                        : typeof record.results === "string"
                          ? JSON.parse(record.results)
                          : [];
                      const hasAbnormal = results.some(
                        (r: any) => r.isAbnormal
                      );

                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {formatDateCustom(record.date)}
                          </TableCell>
                          <TableCell>
                            {record.labName || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {results.slice(0, 3).map((r: any, i: number) => (
                                <div
                                  key={i}
                                  className={`rounded-md px-2 py-1 text-xs ${
                                    r.isAbnormal
                                      ? "bg-red-100 text-red-800"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {r.name}: {r.value} {r.unit}
                                </div>
                              ))}
                              {results.length > 3 && (
                                <Badge variant="outline">
                                  +{results.length - 3} autres
                                </Badge>
                              )}
                              {hasAbnormal && (
                                <Badge
                                  variant="destructive"
                                  className="ml-auto"
                                >
                                  Anormal
                                </Badge>
                              )}
                            </div>
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
                                  onClick={() => handleView(record)}
                                >
                                  Voir les détails
                                </DropdownMenuItem>
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
            {data?.pagination.totalItems ?? 0} résultats d&apos;analyses
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

      <LabResultsDialog
        patientId={patientId}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {selectedRecord && (
        <LabResultsDialog
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
