"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface VitalSignData {
  type: string;
  value: number;
  unit: string;
}

interface VitalSign {
  id: string;
  patientId: string;
  date: string;
  measurements: string; // JSON string of VitalSignData[]
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface VitalSignListResponse {
  data: VitalSign[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

interface VitalSignFilters {
  type?: string;
  startDate?: string;
  endDate?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

interface CreateVitalSignInput {
  patientId: string;
  date: string;
  measurements: VitalSignData[];
  notes?: string;
}

interface VitalSignTrend {
  date: string;
  value: number;
  unit: string;
}

// Fetch vital signs with filters
async function fetchVitalSigns(
  patientId: string,
  filters: VitalSignFilters = {}
): Promise<VitalSignListResponse> {
  const queryParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });

  const response = await fetch(
    `/api/patients/${patientId}/vital-signs?${queryParams.toString()}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch vital signs");
  }

  return response.json();
}

// Fetch a single vital sign
async function fetchVitalSign(id: string): Promise<VitalSign> {
  const response = await fetch(`/api/vital-signs/${id}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch vital sign");
  }

  return response.json();
}

// Create a new vital sign
async function createVitalSign(data: CreateVitalSignInput): Promise<VitalSign> {
  const response = await fetch(`/api/patients/${data.patientId}/vital-signs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create vital sign");
  }

  return response.json();
}

// Update a vital sign
async function updateVitalSign(
  id: string,
  data: Partial<Omit<CreateVitalSignInput, "patientId">>
): Promise<VitalSign> {
  const response = await fetch(`/api/vital-signs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update vital sign");
  }

  return response.json();
}

// Delete a vital sign
async function deleteVitalSign(
  id: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/vital-signs/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete vital sign");
  }

  return response.json();
}

// Fetch vital sign trends for a specific type
async function fetchVitalSignTrends(
  patientId: string,
  type: string
): Promise<VitalSignTrend[]> {
  if (!type) return [];

  const response = await fetch(
    `/api/patients/${patientId}/vital-signs/trends?type=${encodeURIComponent(
      type
    )}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch vital sign trends");
  }

  return response.json();
}

// Fetch available vital sign types for a patient
async function fetchAvailableVitalSignTypes(
  patientId: string
): Promise<string[]> {
  const response = await fetch(`/api/patients/${patientId}/vital-signs/types`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || "Failed to fetch available vital sign types"
    );
  }

  return response.json();
}

// Hook for vital signs with filters
export function useVitalSigns(
  patientId: string,
  filters: VitalSignFilters = {}
) {
  return useQuery({
    queryKey: ["patients", patientId, "vital-signs", filters],
    queryFn: () => fetchVitalSigns(patientId, filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for a single vital sign
export function useVitalSign(id: string) {
  return useQuery({
    queryKey: ["vital-signs", id],
    queryFn: () => fetchVitalSign(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!id,
  });
}

// Hook for vital sign trends
export function useVitalSignTrends(patientId: string, type: string) {
  return useQuery({
    queryKey: ["patients", patientId, "vital-signs", "trends", type],
    queryFn: () => fetchVitalSignTrends(patientId, type),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!type,
  });
}

// Hook for available vital sign types
export function useAvailableVitalSignTypes(patientId: string) {
  return useQuery({
    queryKey: ["patients", patientId, "vital-signs", "types"],
    queryFn: () => fetchAvailableVitalSignTypes(patientId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for creating a vital sign
export function useCreateVitalSign(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<CreateVitalSignInput, "patientId">) =>
      createVitalSign({ ...data, patientId }),
    onSuccess: () => {
      toast.success("Constante vitale ajoutée avec succès");
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "vital-signs"],
      });
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "vital-signs", "types"],
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Erreur lors de l'ajout de la constante vitale"
      );
    },
  });
}

// Hook for updating a vital sign
export function useUpdateVitalSign(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<CreateVitalSignInput, "patientId">>;
    }) => updateVitalSign(id, data),
    onSuccess: (_, variables) => {
      toast.success("Constante vitale mise à jour avec succès");
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "vital-signs"],
      });
      queryClient.invalidateQueries({
        queryKey: ["vital-signs", variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "vital-signs", "trends"],
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Erreur lors de la mise à jour de la constante vitale"
      );
    },
  });
}

// Hook for deleting a vital sign
export function useDeleteVitalSign(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVitalSign,
    onSuccess: () => {
      toast.success("Constante vitale supprimée avec succès");
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "vital-signs"],
      });
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "vital-signs", "types"],
      });
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "vital-signs", "trends"],
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Erreur lors de la suppression de la constante vitale"
      );
    },
  });
}
