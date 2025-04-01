"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; // Import du Skeleton
import { AlertTriangle, Bell, Calendar, Users } from "lucide-react";

type SectionCardsProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stats: any;
  isLoading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any;
};

export function SectionCards({ stats, isLoading, error }: SectionCardsProps) {
  if (error) {
    return <p className="text-red-500">Erreur: {error.message}</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-bold">
              {stats?.totalPatients ?? 0}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Nombre total de patients
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alertes actives</CardTitle>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-bold">
              {stats?.criticalPatients ?? 0}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Patients nécessitant une attention immédiate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Rendez-vous aujourd&apos;hui
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-bold">
              {stats?.upcomingAppointments?.filter((appointment: { date: string; }) => {
                return appointment.date === "Aujourd'hui";
              } ).length ?? 0}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Rendez-vous prévus aujourd&apos;hui
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Patients critiques
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-bold">
              {stats?.criticalPatients ?? 0}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Stade 4-5 nécessitant une surveillance
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
