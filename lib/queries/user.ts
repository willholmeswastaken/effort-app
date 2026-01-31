"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserPreferencesData } from "@/lib/services";

export const userKeys = {
  all: ["user"] as const,
  preferences: () => [...userKeys.all, "preferences"] as const,
};

export function useUserPreferences() {
  return useQuery<UserPreferencesData>({
    queryKey: userKeys.preferences(),
    queryFn: async () => {
      const res = await fetch("/api/user/preferences");
      if (!res.ok) throw new Error("Failed to fetch preferences");
      return res.json();
    },
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<UserPreferencesData>) => {
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update preferences");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.preferences() });
    },
  });
}

export function useRestartProgram() {
  return useMutation({
    mutationFn: async (programId: string) => {
      const res = await fetch(`/api/programs/${programId}/restart`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to restart program");
      return res.json();
    },
  });
}
