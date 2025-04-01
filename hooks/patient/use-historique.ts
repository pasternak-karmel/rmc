"use client";

import { useQuery } from "@tanstack/react-query";

interface Historique {
  id: string;
  patientId: string;
  date: string;
  title: string;
  description: string;
  type: string;
  medecin: string;
  createdAt: string;
  updatedAt: string;
}

async function fetchPatientHistory(id: string): Promise<Historique[]> {
  const response = await fetch(`/api/patients/${id}/history`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch patient history");
  }

  return response.json();
}

export function usePatientHistory(id: string) {
  const {
    data: patientHistory,
    isLoading: isLoadingPatientHistory,
    error: errorPatientHistory,
  } = useQuery({
    queryKey: ["patientHistory"],
    queryFn: () => fetchPatientHistory(id),
    staleTime: 1000 * 60 * 5,
  });

  return {
    patientHistory,
    isLoadingPatientHistory,
    errorPatientHistory,
  };
}
