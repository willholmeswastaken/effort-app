import type { WorkoutHistoryEntry } from "@/lib/services";

export const historyKeys = {
  all: ["history"] as const,
  list: (limit?: number) => [...historyKeys.all, "list", limit] as const,
};

export async function fetchWorkoutHistory(
  options?: { baseUrl?: string; headers?: HeadersInit; limit?: number }
): Promise<WorkoutHistoryEntry[]> {
  const params = options?.limit ? `?limit=${options.limit}` : "";
  const url = options?.baseUrl
    ? `${options.baseUrl}/api/workouts${params}`
    : `/api/workouts${params}`;

  const res = await fetch(url, {
    headers: options?.headers,
  });

  if (!res.ok) {
    throw new Error("Failed to fetch workout history");
  }

  return res.json();
}

export function getHistoryQueryOptions(options?: {
  baseUrl?: string;
  headers?: HeadersInit;
  limit?: number;
}) {
  return {
    queryKey: historyKeys.list(options?.limit),
    queryFn: () => fetchWorkoutHistory(options),
  };
}
