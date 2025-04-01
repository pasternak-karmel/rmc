"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Notification {
  id: string;
  userId: string;
  patientId?: string;
  title: string;
  message: string;
  type: string; // 'info', 'warning', 'critical'
  read: boolean;
  createdAt: string;
}

// Fetch all notifications
async function fetchNotifications(): Promise<Notification[]> {
  const response = await fetch("/api/notifications");

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch notifications");
  }

  return response.json();
}

// Mark a notification as read
async function markNotificationAsRead(
  id: string
): Promise<{ success: boolean }> {
  const response = await fetch(`/api/notifications/${id}/read`, {
    method: "POST",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to mark notification as read");
  }

  return response.json();
}

// Mark all notifications as read
async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
  const response = await fetch("/api/notifications/read-all", {
    method: "POST",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || "Failed to mark all notifications as read"
    );
  }

  return response.json();
}

// Hook for notifications
export function useNotifications() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    staleTime: 1000 * 60, // 1 minute
  });

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Erreur lors du marquage de la notification comme lue"
      );
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Toutes les notifications ont été marquées comme lues");
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          "Erreur lors du marquage de toutes les notifications comme lues"
      );
    },
  });

  return {
    data,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
}
