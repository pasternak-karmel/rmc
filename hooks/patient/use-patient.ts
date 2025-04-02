/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export interface Patient {
  id: string;
  firstname: string;
  lastname: string;
  birthdate: string;
  sex: string;
  email: string;
  phone: string;
  address: string;
  medicalInfo: {
    stade: number;
    status: string;
    medecin: string;
    dfg: number;
    proteinurie: number;
    previousDfg: number;
    previousProteinurie: number;
    lastvisite: string;
    nextvisite: string;
  };
  medicalHistory?: any[];
  treatments?: any[];
}

interface PatientListResponse {
  data: Patient[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface PatientQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  stage?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface UsePatientOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  redirectTo?: string;
}

// Fetch patients with pagination and filters
async function fetchPatients(
  params: PatientQueryParams = {}
): Promise<PatientListResponse> {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });

  const response = await fetch(`/api/patients?${queryParams.toString()}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch patients");
  }

  return response.json();
}

async function fetchPatientById(id: string): Promise<Patient> {
  const response = await fetch(`/api/patients/${id}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch patient");
  }

  return response.json();
}

// Create a new patient
async function createPatient(patientData: any): Promise<Patient> {
  const response = await fetch("/api/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patientData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create patient");
  }

  return response.json();
}

// Update an existing patient
async function updatePatient(id: string, patientData: any): Promise<Patient> {
  const response = await fetch(`/api/patients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patientData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update patient");
  }

  return response.json();
}

// Delete a patient
async function deletePatient(
  id: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/patients/${id}`, { method: "DELETE" });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete patient");
  }

  return response.json();
}

// Search patients
async function searchPatients(query: string, limit = 10): Promise<Patient[]> {
  const response = await fetch(
    `/api/patients/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to search patients");
  }

  return response.json();
}

// Get critical patients
async function fetchCriticalPatients(): Promise<Patient[]> {
  const response = await fetch(`/api/patients/critical`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch critical patients");
  }

  return response.json();
}

// Get patients with upcoming appointments
async function fetchUpcomingAppointments(days = 7): Promise<Patient[]> {
  const response = await fetch(
    `/api/patients/upcoming-appointments?days=${days}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch upcoming appointments");
  }

  return response.json();
}

// Hook for patient listing with filters and pagination
export function usePatientList(
  params: PatientQueryParams = {},
  options: UsePatientOptions = {}
) {
  return useQuery({
    queryKey: ["patients", "list", params],
    queryFn: () => fetchPatients(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

export function usePatient(id: string, options: UsePatientOptions = {}) {
  return useQuery({
    queryKey: ["patients", id],
    queryFn: () => fetchPatientById(id),
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
    ...options,
  });
}

// Hook for patient creation
export function useCreatePatient(options: UsePatientOptions = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: createPatient,
    onSuccess: (data) => {
      toast.success("Patient créé avec succès");
      queryClient.invalidateQueries({
        queryKey: ["patients", "dashboardStats"],
      });

      if (options.onSuccess) {
        options.onSuccess(data);
      }

      if (options.redirectTo) {
        router.push(options.redirectTo);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la création du patient");

      if (options.onError) {
        options.onError(error);
      }
    },
  });
}

// Hook for patient update
export function useUpdatePatient(id: string, options: UsePatientOptions = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: any) => updatePatient(id, data),
    onSuccess: (data) => {
      toast.success("Patient mis à jour avec succès");
      queryClient.invalidateQueries({ queryKey: ["patients", id] });
      queryClient.invalidateQueries({ queryKey: ["patients", "list"] });

      if (options.onSuccess) {
        options.onSuccess(data);
      }

      if (options.redirectTo) {
        router.push(options.redirectTo);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la mise à jour du patient");

      if (options.onError) {
        options.onError(error);
      }
    },
  });
}

// Hook for patient deletion
export function useDeletePatient(options: UsePatientOptions = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: deletePatient,
    onSuccess: (data) => {
      toast.success("Patient supprimé avec succès");
      queryClient.invalidateQueries({ queryKey: ["patients"] });

      if (options.onSuccess) {
        options.onSuccess(data);
      }

      if (options.redirectTo) {
        router.push(options.redirectTo);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la suppression du patient");

      if (options.onError) {
        options.onError(error);
      }
    },
  });
}

// Hook for patient search
export function usePatientSearch() {
  return useMutation({
    mutationFn: ({ query, limit }: { query: string; limit?: number }) =>
      searchPatients(query, limit),
  });
}

// Hook for critical patients
export function useCriticalPatients(options: UsePatientOptions = {}) {
  return useQuery({
    queryKey: ["patients", "critical"],
    queryFn: fetchCriticalPatients,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

// Hook for upcoming appointments
export function useUpcomingAppointments(
  days = 7,
  options: UsePatientOptions = {}
) {
  return useQuery({
    queryKey: ["patients", "appointments", days],
    queryFn: () => fetchUpcomingAppointments(days),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}
