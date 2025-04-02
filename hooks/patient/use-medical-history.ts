"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface MedicalRecord {
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

interface MedicalRecordListResponse {
  data: MedicalRecord[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

interface MedicalRecordFilters {
  type?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

interface MedicalHistoryStats {
  totalRecords: number;
  typeDistribution: Array<{ type: string; count: number }>;
  monthlyDistribution: Array<{ month: string; count: number }>;
  latestRecord: MedicalRecord | null;
}

interface CreateMedicalRecordInput {
  patientId: string;
  date: string;
  title: string;
  description: string;
  type: string;
  medecin?: string;
}

// Fetch medical history with filters
async function fetchMedicalHistory(
  patientId: string,
  filters: MedicalRecordFilters = {}
): Promise<MedicalRecordListResponse> {
  const queryParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });

  const response = await fetch(
    `/api/patients/${patientId}/medical-records?${queryParams.toString()}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch medical history");
  }

  return response.json();
}

// Fetch a single medical record
async function fetchMedicalRecord(id: string): Promise<MedicalRecord> {
  const response = await fetch(`/api/medical-records/${id}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch medical record");
  }

  return response.json();
}

// Create a new medical record
async function createMedicalRecord(
  data: CreateMedicalRecordInput
): Promise<MedicalRecord> {
  const response = await fetch(
    `/api/patients/${data.patientId}/medical-records`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create medical record");
  }

  return response.json();
}

// Update a medical record
async function updateMedicalRecord(
  id: string,
  data: Partial<Omit<CreateMedicalRecordInput, "patientId">>
): Promise<MedicalRecord> {
  const response = await fetch(`/api/medical-records/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update medical record");
  }

  return response.json();
}

// Delete a medical record
async function deleteMedicalRecord(
  id: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/medical-records/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete medical record");
  }

  return response.json();
}

// Fetch medical history statistics
async function fetchMedicalHistoryStats(
  patientId: string
): Promise<MedicalHistoryStats> {
  const response = await fetch(
    `/api/patients/${patientId}/medical-records/stats`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || "Failed to fetch medical history statistics"
    );
  }

  return response.json();
}

// Hook for medical history with filters
export function useMedicalHistory(
  patientId: string,
  filters: MedicalRecordFilters = {}
) {
  return useQuery({
    queryKey: ["patients", patientId, "medical-history", filters],
    queryFn: () => fetchMedicalHistory(patientId, filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for a single medical record
export function useMedicalRecord(id: string) {
  return useQuery({
    queryKey: ["medical-records", id],
    queryFn: () => fetchMedicalRecord(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!id,
  });
}

// Hook for medical history statistics
export function useMedicalHistoryStats(patientId: string) {
  return useQuery({
    queryKey: ["patients", patientId, "medical-history", "stats"],
    queryFn: () => fetchMedicalHistoryStats(patientId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for creating a medical record
export function useCreateMedicalRecord(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<CreateMedicalRecordInput, "patientId">) =>
      createMedicalRecord({ ...data, patientId }),
    onSuccess: () => {
      toast.success("Événement médical ajouté avec succès");
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "medical-history"],
      });
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "medical-history", "stats"],
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Erreur lors de l'ajout de l'événement médical"
      );
    },
  });
}

// Hook for updating a medical record
export function useUpdateMedicalRecord(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<CreateMedicalRecordInput, "patientId">>;
    }) => updateMedicalRecord(id, data),
    onSuccess: () => {
      toast.success("Événement médical mis à jour avec succès");
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "medical-history"],
      });
      queryClient.invalidateQueries({
        queryKey: ["medical-records", patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "medical-history", "stats"],
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Erreur lors de la mise à jour de l'événement médical"
      );
    },
  });
}

// Hook for deleting a medical record
export function useDeleteMedicalRecord(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMedicalRecord(id),
    onSuccess: () => {
      toast.success("Événement médical supprimé avec succès");
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "medical-history"],
      });
      queryClient.invalidateQueries({
        queryKey: ["patients", patientId, "medical-history", "stats"],
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Erreur lors de la suppression de l'événement médical"
      );
    },
  });
}
