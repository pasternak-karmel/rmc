"use client";

import { Alert, Appointment, Patient } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export interface DashboardStats {
  totalPatients: number;
  stageDistribution: Array<{ stage: number; count: number }>;
  statusDistribution: Array<{ status: string; count: number }>;
  criticalPatients: number;
  activeAlerts: number;
  upcomingAppointments: Appointment[];
  recentPatients: Patient[];
  alerts: Array<Alert>;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await fetch("/api/dashboard/stats");

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to fetch dashboard statistics"
      );
    }

    const data = await response.json();
    return data as DashboardStats;
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("An unknown error occurred");
    toast.error(error.message);
    throw error;
  }
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: fetchDashboardStats,
    staleTime: 1000 * 60 * 5,
  });
}
