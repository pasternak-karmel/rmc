"use client";

import { PatientOverview } from "@/components/dashboard/patient-overview";
import { RecentAlerts } from "@/components/dashboard/recent-alerts";
import { StageDistribution } from "@/components/dashboard/stage-distribution";
import { UpcomingAppointments } from "@/components/dashboard/upcoming-appointments";
import { SectionCards } from "@/components/section-cards";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboard } from "@/hooks/use-dashboard";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { data: stats, isLoading, error } = useDashboard();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <Link href="/patients/nouveau">
          <Button className="cursor-pointer">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nouveau patient
          </Button>
        </Link>
      </div>

      <SectionCards stats={stats} isLoading={isLoading} error={error} />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="appointments">Rendez-vous</TabsTrigger>
          {/* <TabsTrigger value="analytics">Analytique</TabsTrigger> */}
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Patients récemment consultés</CardTitle>
                <CardDescription>
                  Les {stats?.recentPatients.length || 0} dernier(s) patients
                  consultés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PatientOverview patients={stats?.recentPatients || []} />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Distribution par stade MRC</CardTitle>
                <CardDescription>
                  Répartition des patients par stade de MRC
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StageDistribution />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertes récentes</CardTitle>
              <CardDescription>
                Alertes générées au cours des 7 derniers jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentAlerts initialAlerts={stats?.alerts || []} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendez-vous à venir</CardTitle>
              <CardDescription>
                Planification des prochains rendez-vous
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UpcomingAppointments
                appointments={stats?.upcomingAppointments || []}
              />
            </CardContent>
          </Card>
        </TabsContent>
        {/* <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendances et Analytique</CardTitle>
              <CardDescription>Évolution des indicateurs clés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-md">
                <p className="text-muted-foreground">
                  Graphiques d&apos;analyse en cours de développement
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>
    </div>
  );
}
