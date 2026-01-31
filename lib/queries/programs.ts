"use client";

import { useQuery } from "@tanstack/react-query";

export interface ProgramSummary {
  id: string;
  name: string;
  daysPerWeek: number;
}

export const programKeys = {
  all: ["programs"] as const,
  list: () => [...programKeys.all, "list"] as const,
};

export function usePrograms(options?: { enabled?: boolean }) {
  return useQuery<ProgramSummary[]>({
    queryKey: programKeys.list(),
    queryFn: async () => {
      const res = await fetch("/api/programs");
      if (!res.ok) throw new Error("Failed to fetch programs");
      return res.json();
    },
    enabled: options?.enabled ?? true,
    staleTime: 10 * 60 * 1000, // Programs rarely change, cache for 10 minutes
  });
}
