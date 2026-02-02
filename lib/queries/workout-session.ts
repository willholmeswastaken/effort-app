import type { WorkoutSessionData } from "@/lib/services";

export const workoutQueryKeys = {
  all: ["workouts"] as const,
  history: () => [...workoutQueryKeys.all, "history"] as const,
  detail: (id: string) => [...workoutQueryKeys.all, id] as const,
  session: (workoutId: string) => [...workoutQueryKeys.all, "session", workoutId] as const,
  exerciseHistory: (exerciseId: string) =>
    [...workoutQueryKeys.all, "exercise", exerciseId] as const,
  lastLifts: (exerciseIds: string[]) =>
    [...workoutQueryKeys.all, "lastLifts", ...exerciseIds] as const,
};

export async function fetchWorkoutSession(
  workoutId: string, 
  options?: { baseUrl?: string; headers?: Record<string, string> }
): Promise<WorkoutSessionData> {
  let url = `/api/workouts/${workoutId}/session`;
  
  if (options?.baseUrl) {
    url = `${options.baseUrl}${url}`;
  }
  
  const res = await fetch(url, { headers: options?.headers });
  
  if (!res.ok) {
    throw new Error("Failed to fetch workout session");
  }
  
  return res.json();
}

export function getWorkoutSessionQueryOptions(
  workoutId: string, 
  options?: { baseUrl?: string; headers?: Record<string, string> }
) {
  return {
    queryKey: workoutQueryKeys.session(workoutId),
    queryFn: () => fetchWorkoutSession(workoutId, options),
  };
}
