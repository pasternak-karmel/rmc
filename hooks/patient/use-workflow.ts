"use client";

import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export interface Workflow {
  id: string;
  title: string;
  description: string;
  patients: number;
  alerts: number;
  tasks: number;
  lastUpdated: string;
}

interface UseWorkflowOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  redirectTo?: string;
}

interface WorkflowListResponse {
  data: Workflow[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

interface WorkflowResponse {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  patients: number;
  alerts: {
    total: number;
    critical: number;
    warning: number;
  };
  lastUpdated: string;
  createdBy: string;
  tasks: {
    total: number;
    completed: number;
    pending: number;
  };
}

export interface WorkflowQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

async function fetchWorkflows(
  params: WorkflowQueryParams = {}
): Promise<WorkflowListResponse> {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });

  const response = await fetch(`/api/workflow?${queryParams.toString()}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || "Erreur lors de la recuperation des workflow"
    );
  }

  return response.json();
}

async function fetchWorkflow(workflowId: string): Promise<WorkflowResponse> {
  const response = await fetch(`/api/workflow/${workflowId}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || "Erreur lors de la recuperation des workflow"
    );
  }
  console.log("JJ");
  return response.json();
}

// Create a new workflow
async function createWorkflow(workflowData: any): Promise<Workflow> {
  const response = await fetch("/api/workflow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(workflowData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || "Erreur lors de la création du workflow"
    );
  }

  return response.json();
}

async function getPatients(workflowId: string) {
  const response = await fetch(`/api/workflow/${workflowId}/patients`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error ||
        "Erreur lors de la recuperation des patients du workflow"
    );
  }

  return response.json();
}

async function getAlerts(workflowId: string) {
  const response = await fetch(`/api/workflow/${workflowId}/alerts`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error ||
        "Erreur lors de la recuperation des alertes du workflow"
    );
  }

  return response.json();
}

async function getTasks(workflowId: string) {
  const response = await fetch(`/api/workflow/${workflowId}/tasks`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || "Erreur lors de la recuperation des taches du workflow"
    );
  }
  return response.json();
}

export function useCreateWorkflow(options: UseWorkflowOptions = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: createWorkflow,
    onSuccess: (data) => {
      toast.success("Workflow créé avec succès");
      queryClient.invalidateQueries({
        queryKey: ["workflow"],
      });

      if (options.onSuccess) {
        options.onSuccess(data);
      }

      if (options.redirectTo) {
        router.push(options.redirectTo);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la création du workflow");

      if (options.onError) {
        options.onError(error);
      }
    },
  });
}

export function useWorkflow(options: UseWorkflowOptions = {}) {
  return useQuery({
    queryKey: ["workflowData"],
    queryFn: () => fetchWorkflows(),
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

export function useFetchWorkflow(workflowId: string) {
  return useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: () => fetchWorkflow(workflowId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useFetchWorkflowPatients(workflowId: string) {
  return useQuery({
    queryKey: ["workflow", workflowId, "patients"],
    queryFn: () => getPatients(workflowId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useFetchWorkflowAlerts(workflowId: string) {
  return useQuery({
    queryKey: ["workflow", workflowId, "alerts"],
    queryFn: () => getAlerts(workflowId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useFetchWorkflowTasks(workflowId: string) {
  return useQuery({
    queryKey: ["workflow", workflowId, "tasks"],
    queryFn: () => getTasks(workflowId),
    staleTime: 1000 * 60 * 5,
  });
}
