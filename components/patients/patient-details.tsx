"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePatient } from "@/hooks/patient/use-patient";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Activity, Minus, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";

interface PatientDetailsProps {
  id: string;
}

export function PatientDetails({ id }: PatientDetailsProps) {
  const { data: patient, isLoading, error } = usePatient(id);

  if (error) {
    return (
      <Card className="md:col-span-2">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <TrendingDown className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">
              Erreur lors du chargement des données
            </h2>
            <p className="text-muted-foreground">
              {error.message ||
                "Une erreur est survenue lors du chargement des données du patient"}
            </p>
            <Button asChild>
              <Link href="/patients">Retour à la liste des patients</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex flex-col space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-20 mt-1" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Skeleton className="h-5 w-48 mb-2" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>

            <div>
              <Skeleton className="h-5 w-48 mb-2" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>

            <div>
              <Skeleton className="h-5 w-48 mb-2" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>

            <div className="pt-2">
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!patient) return null;

  const dfgTrend =
    patient.medicalInfo.dfg > patient.medicalInfo.previousDfg
      ? "up"
      : patient.medicalInfo.dfg < patient.medicalInfo.previousDfg
      ? "down"
      : "stable";

  const proteinurieTrend =
    patient.medicalInfo.proteinurie > patient.medicalInfo.previousProteinurie
      ? "up"
      : patient.medicalInfo.proteinurie <
        patient.medicalInfo.previousProteinurie
      ? "down"
      : "stable";

  // Calculate age from birthdate
  const calculateAge = (birthdate: string) => {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Format dates
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd MMMM yyyy", { locale: fr });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Card className="md:col-span-2">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback>
            {patient.firstname[0]}
            {patient.lastname[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>
            {patient.firstname} {patient.lastname}
          </CardTitle>
          <CardDescription>
            {calculateAge(patient.birthdate)} ans •{" "}
            {patient.sex === "M" ? "Homme" : "Femme"}
          </CardDescription>
          <div className="mt-1">
            {patient.medicalInfo.status === "critical" && (
              <Badge variant="destructive">Critique</Badge>
            )}
            {patient.medicalInfo.status === "worsening" && (
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"
              >
                En détérioration
              </Badge>
            )}
            {patient.medicalInfo.status === "improving" && (
              <Badge
                variant="outline"
                className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
              >
                En amélioration
              </Badge>
            )}
            {patient.medicalInfo.status === "stable" && (
              <Badge
                variant="outline"
                className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200"
              >
                Stable
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Informations personnelles
            </h3>
            <div className="grid grid-cols-[1fr_auto] gap-1 text-sm">
              <div className="font-medium">Date de naissance</div>
              <div>{formatDate(patient.birthdate)}</div>
              <div className="font-medium">Email</div>
              <div>{patient.email}</div>
              <div className="font-medium">Téléphone</div>
              <div>{patient.phone}</div>
              <div className="font-medium">Adresse</div>
              <div>{patient.address}</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Informations médicales
            </h3>
            <div className="grid grid-cols-[1fr_auto] gap-1 text-sm">
              <div className="font-medium">Stade MRC</div>
              <div>Stade {patient.medicalInfo.stade}</div>
              <div className="font-medium">DFG</div>
              <div className="flex items-center">
                {patient.medicalInfo.dfg} ml/min
                {dfgTrend === "down" && (
                  <TrendingDown className="ml-1 h-4 w-4 text-destructive" />
                )}
                {dfgTrend === "up" && (
                  <TrendingUp className="ml-1 h-4 w-4 text-green-500" />
                )}
                {dfgTrend === "stable" && (
                  <Minus className="ml-1 h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="font-medium">Protéinurie</div>
              <div className="flex items-center">
                {patient.medicalInfo.proteinurie} g/24h
                {proteinurieTrend === "up" && (
                  <TrendingUp className="ml-1 h-4 w-4 text-destructive" />
                )}
                {proteinurieTrend === "down" && (
                  <TrendingDown className="ml-1 h-4 w-4 text-green-500" />
                )}
                {proteinurieTrend === "stable" && (
                  <Minus className="ml-1 h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="font-medium">Médecin référent</div>
              <div>{patient.medicalInfo.medecin}</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Rendez-vous
            </h3>
            <div className="grid grid-cols-[1fr_auto] gap-1 text-sm">
              <div className="font-medium">Dernière visite</div>
              <div>{formatDate(patient.medicalInfo.lastvisite)}</div>
              <div className="font-medium">Prochain rendez-vous</div>
              <div>{formatDate(patient.medicalInfo.nextvisite)}</div>
            </div>
          </div>

          <div className="pt-2">
            <Link href={`/workflows/patient/${id}`}>
              <Button variant="outline" className="w-full">
                <Activity className="mr-2 h-4 w-4" />
                Workflow de suivi
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
