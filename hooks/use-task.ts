"use client";

import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export interface Task {
//   id: string;
  title: string;
  priority: string;
  completed: boolean;
  dueDate: string;
  assignedTo: string;
  patientId: string;
//   createdAt: string;
//   updatedAt: string;
}

interface UseTaskOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  redirectTo?: string;
}

interface TaskListResponse {
  data: Task[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

interface TaskResponse {
  id: string;
  title: string;
  priority: string;
  completed: boolean;
  dueDate: string;
  assignedTo: string;
  patientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Create a new task
async function createTask(task: Task) {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Erreur lors de la création de tache");
  }
  return response.json();
}

export function useCreateTask(options: UseTaskOptions = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: createTask,
    onSuccess: (data) => {
      toast.success("Tache créé avec succès");
      queryClient.invalidateQueries({
        queryKey: ["task"],
      });

      if (options.onSuccess) {
        options.onSuccess(data);
      }

      if (options.redirectTo) {
        router.push(options.redirectTo);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la création de tache");

      if (options.onError) {
        options.onError(error);
      }
    },
  });
}
