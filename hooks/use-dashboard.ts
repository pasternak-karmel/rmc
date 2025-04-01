"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export interface DashboardStats {
  totalPatients: number;
  stageDistribution: Array<{ stage: number; count: number }>;
  statusDistribution: Array<{ status: string; count: number }>;
  criticalPatients: number;
  upcomingAppointments: Array<{
    id: string;
    patient: string;
    patientId: string;
    date: string;
    time: string;
    type: string;
    virtual: boolean;
    avatar: string;
    initials: string;
  }>;
  recentPatients: Array<{
    id: string;
    name: string;
    lastVisit: string;
    stage: number;
    age: number;
    critical: boolean;
    avatar: string;
    initials: string;
  }>;
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
