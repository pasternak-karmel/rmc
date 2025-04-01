"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface LabTestResult {
  name: string;
  value: number;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  isAbnormal: boolean;
}

interface LabResult {
  id: string;
  patientId: string;
  date: string;
  results: string; // JSON string of LabTestResult[]
  labName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface LabResultListResponse {
  data: LabResult[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

interface LabResultFilters {
  startDate?: string;
  endDate?: string;
  abnormalOnly?: boolean;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

interface CreateLabResultInput {
  patientId: string;
  date: string;
  results: LabTestResult[];
  labName?: string;
  notes?: string;
}

interface LabResultTrend {
  date: string;
  value: number;
  unit: string;
  isAbnormal: boolean;
  referenceMin?: number;
  referenceMax?: number;
}

// Fetch lab results with filters
async function fetchLabResults(
  patientId: string,
  filters: LabResultFilters = {}
): Promise<LabResultListResponse> {
  const queryParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });

  const response = await fetch(
    `/api/patients/${patientId}/lab-results?${queryParams.toString()}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch lab results");
  }

  return response.json();
}

// Fetch a single lab result
async function fetchLabResult(id: string): Promise<LabResult> {
  const response = await fetch(`/api/lab-results/${id}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch lab result");
  }

  return response.json();
}

// Create a new lab result
async function createLabResult(data: CreateLabResultInput): Promise<LabResult> {
  const response = await fetch(`/api/patients/${data.patientId}/lab-results`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create lab result");
  }

  return response.json();
}

// Update a lab result
async function updateLabResult(
  id: string,
  data: Partial<Omit<CreateLabResultInput, "patientId">>
): Promise<LabResult> {
  const response = await fetch(`/api/lab-results/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update lab result");
  }

  return response.json();
}

// Delete a lab result
async function deleteLabResult(
  id: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/lab-results/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete lab result");
  }

  return response.json();
}

// Fetch lab result trends for a specific test
async function fetchLabResultTrends(
  patientId: string,
  testName: string
): Promise<LabResultTrend[]> {
  if (!testName) return [];

  const response = await fetch(
    `/api/patients/${patientId}/lab-results/trends?testName=${encodeURIComponent(
      testName
    )}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch lab result trends");
  }

  return response.json();
}

// Fetch available test names for a patient
async function fetchAvailableTestNames(patientId: string): Promise<string[]> {
  const response = await fetch(
    `/api/patients/${patientId}/lab-results/test-names`
  ); 

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch available test names");
  }

  return response.json();
}

// Hook for lab results with filters
export function useLabResults(
  patientId: string,
  filters: LabResultFilters = {}
) {
  return useQuery({
    queryKey: ["patients", patientId, "lab-results", filters],
    queryFn: () => fetchLabResults(patientId, filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for a single lab result
export function useLabResult(id: string) {
  return useQuery({
    queryKey: ["lab-results", id],
    queryFn: () => fetchLabResult(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!id,
  });
}

// Hook for lab result trends
export function useLabResultTrends(patientId: string, testName: string) {
  return useQuery({
    queryKey: ["patients", patientId, "lab-results", "trends", testName],
    queryFn: () => fetchLabResultTrends(patientId, testName),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!testName,
  });
}

// Hook for available test names
export function useAvailableTestNames(patientId: string) {
  return useQuery({
    queryKey: ["patients", patientId, "lab-results", "test-names"],
    queryFn: () => fetchAvailableTestNames(patientId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for creating a lab result
export function useCreateLabResult(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<CreateLabResultInput, "patientId">) =>
      createLabResult({ ...data, patientId }),
    onSuccess: () => {
      toast.success("Résultat d'analyse ajouté avec succès");
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "lab-results"],
      });
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "lab-results", "test-names"],
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Erreur lors de l'ajout du résultat d'analyse"
      );
    },
  });
}

// Hook for updating a lab result
export function useUpdateLabResult(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<CreateLabResultInput, "patientId">>;
    }) => updateLabResult(id, data),
    onSuccess: (_, variables) => {
      toast.success("Résultat d'analyse mis à jour avec succès");
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "lab-results"],
      });
      queryClient.invalidateQueries({
        queryKey: ["lab-results", variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "lab-results", "trends"],
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Erreur lors de la mise à jour du résultat d'analyse"
      );
    },
  });
}

// Hook for deleting a lab result
export function useDeleteLabResult(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLabResult,
    onSuccess: () => {
      toast.success("Résultat d'analyse supprimé avec succès");
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "lab-results"],
      });
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "lab-results", "test-names"],
      });
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "lab-results", "trends"],
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Erreur lors de la suppression du résultat d'analyse"
      );
    },
  });
}
