"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
}

async function fetchUsers(): Promise<User[]> {
  try {
    const response = await fetch("/api/dashboard/users");

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to fetch dashboard statistics"
      );
    }

    const data = await response.json();
    return data as User[];
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("An unknown error occurred");
    toast.error(error.message);
    throw error;
  }
}

export function useUsers() {
  return useQuery({
    queryKey: ["getUsers"],
    queryFn: fetchUsers,
    staleTime: 1000 * 60 * 5,
  });
}
