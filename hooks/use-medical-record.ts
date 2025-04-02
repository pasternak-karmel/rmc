"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { toast } from "sonner";

export interface MedicalRecord {
  id: string;
  patientId: string;
  date: string;
  title: string;
  description: string;
  type: string;
  medecin: string;
}

interface UseMedicalRecordOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useMedicalRecord(options?: UseMedicalRecordOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getMedicalRecords = async (
    patientId: string,
    params?: Record<string, any>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(
        `/api/patients/${patientId}/medical-records?${queryParams.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch medical records");
      }

      const data = await response.json();
      options?.onSuccess?.(data);
      return data;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("An unknown error occurred");
      setError(error);
      options?.onError?.(error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getMedicalRecordById = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/medical-records/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch medical record");
      }

      const data = await response.json();
      options?.onSuccess?.(data);
      return data;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("An unknown error occurred");
      setError(error);
      options?.onError?.(error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createMedicalRecord = async (patientId: string, recordData: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/patients/${patientId}/medical-records`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(recordData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create medical record");
      }

      const data = await response.json();
      toast.success("Événement médical ajouté avec succès");
      options?.onSuccess?.(data);
      return data;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("An unknown error occurred");
      setError(error);
      options?.onError?.(error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateMedicalRecord = async (id: string, recordData: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/medical-records/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recordData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update medical record");
      }

      const data = await response.json();
      toast.success("Événement médical mis à jour avec succès");
      options?.onSuccess?.(data);
      return data;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("An unknown error occurred");
      setError(error);
      options?.onError?.(error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMedicalRecord = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/medical-records/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete medical record");
      }

      const data = await response.json();
      toast.success("Événement médical supprimé avec succès");
      options?.onSuccess?.(data);
      return data;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("An unknown error occurred");
      setError(error);
      options?.onError?.(error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    getMedicalRecords,
    getMedicalRecordById,
    createMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord,
  };
}
