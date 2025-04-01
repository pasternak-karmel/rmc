"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Treatment {
  id: string;
  patientId: string;
  medicament: string;
  category: string;
  posologie: string;
  frequence: string;
  date: string;
  endDate?: string;
  status: string;
  medecin: string;
  notes?: string;
  interactions: boolean;
  createdAt: string;
  updatedAt: string;
}

// interface TreatmentListResponse {
//   data: Treatment[];
//   pagination: {
//     page: number;
//     limit: number;
//     totalItems: number;
//     totalPages: number;
//   };
// }

// interface TreatmentFilters {
//   category?: string;
//   status?: string;
//   startDate?: string;
//   endDate?: string;
//   sortBy?: string;
//   sortOrder?: "asc" | "desc";
//   page?: number;
//   limit?: number;
// }

interface TreatmentStats {
  totalTreatments: number;
  activeTreatments: number;
  discontinuedTreatments: number;
  categoryDistribution: Array<{ category: string; count: number }>;
  interactionsCount: number;
}

interface CreateTreatmentInput {
  patientId: string;
  medicament: string;
  category: string;
  posologie: string;
  frequence: string;
  startDate: string;
  endDate?: string;
  status?: string;
  medecin?: string;
  notes?: string;
  interactions?: boolean;
}

// Fetch treatments with filters
async function fetchTreatments(
  patientId: string
  // filters: TreatmentFilters = {}
): Promise<Treatment[]> {
  // Object.entries(filters).forEach(([key, value]) => {
  //   if (value !== undefined && value !== null) {
  //     queryParams.append(key, String(value));
  //   }
  // });

  const response = await fetch(`/api/patients/${patientId}/treatments`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch treatments");
  }

  return response.json();
}

// Fetch a single treatment
async function fetchTreatment(id: string): Promise<Treatment> {
  const response = await fetch(`/api/treatments/${id}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch treatment");
  }

  return response.json();
}

// Create a new treatment
async function createTreatment(data: CreateTreatmentInput): Promise<Treatment> {
  const response = await fetch(`/api/patients/${data.patientId}/treatments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create treatment");
  }

  return response.json();
}

// Update a treatment
async function updateTreatment(
  id: string,
  data: Partial<Omit<CreateTreatmentInput, "patientId">>
): Promise<Treatment> {
  const response = await fetch(`/api/treatments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update treatment");
  }

  return response.json();
}

// Delete a treatment
async function deleteTreatment(
  id: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/treatments/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete treatment");
  }

  return response.json();
}

// Fetch active treatments
async function fetchActiveTreatments(patientId: string): Promise<Treatment[]> {
  const response = await fetch(`/api/patients/${patientId}/treatments/active`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch active treatments");
  }

  return response.json();
}

// Fetch treatment statistics
async function fetchTreatmentStats(patientId: string): Promise<TreatmentStats> {
  const response = await fetch(`/api/patients/${patientId}/treatments/stats`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch treatment statistics");
  }

  return response.json();
}

// Hook for treatments with filters
export function useTreatments(
  patientId: string
  // filters: TreatmentFilters = {}
) {
  return useQuery({
    queryKey: ["patients", patientId, "treatments"],
    queryFn: () => fetchTreatments(patientId),
    staleTime: 1000 * 60 * 5,
  });
}

// Hook for a single treatment
export function useTreatment(id: string) {
  return useQuery({
    queryKey: ["treatments", id],
    queryFn: () => fetchTreatment(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!id,
  });
}

// Hook for active treatments
export function useActiveTreatments(patientId: string) {
  return useQuery({
    queryKey: ["patients", patientId, "treatments", "active"],
    queryFn: () => fetchActiveTreatments(patientId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for treatment statistics
export function useTreatmentStats(patientId: string) {
  return useQuery({
    queryKey: ["patients", patientId, "treatments", "stats"],
    queryFn: () => fetchTreatmentStats(patientId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for creating a treatment
export function useCreateTreatment(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<CreateTreatmentInput, "patientId">) =>
      createTreatment({ ...data, patientId }),
    onSuccess: () => {
      toast.success("Traitement ajouté avec succès");
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "treatments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "treatments", "active"],
      });
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "treatments", "stats"],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'ajout du traitement");
    },
  });
}

// Hook for updating a treatment
export function useUpdateTreatment(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<CreateTreatmentInput, "patientId">>;
    }) => updateTreatment(id, data),
    onSuccess: (_, variables) => {
      toast.success("Traitement mis à jour avec succès");
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "treatments"],
      });
      queryClient.invalidateQueries({ queryKey: ["treatments", variables.id] });
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "treatments", "active"],
      });
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "treatments", "stats"],
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Erreur lors de la mise à jour du traitement"
      );
    },
  });
}

// Hook for deleting a treatment
export function useDeleteTreatment(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTreatment,
    onSuccess: () => {
      toast.success("Traitement supprimé avec succès");
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "treatments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "treatments", "active"],
      });
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "treatments", "stats"],
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Erreur lors de la suppression du traitement"
      );
    },
  });
}
