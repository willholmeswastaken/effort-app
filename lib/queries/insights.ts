"use client";

import { useQuery } from "@tanstack/react-query";
import type { InsightsSummary, ExerciseProgressionPoint } from "@/lib/services";

export interface LoggedExercise {
  id: string;
  name: string;
  sessionCount: number;
  currentMax: number;
  previousMax: number;
  changePercent: number;
}

export const insightsKeys = {
  all: ["insights"] as const,
  summary: () => [...insightsKeys.all, "summary"] as const,
  exercises: () => [...insightsKeys.all, "exercises"] as const,
  progression: (exerciseId: string, days?: number) =>
    [...insightsKeys.all, "progression", exerciseId, days] as const,
};

export async function fetchInsightsSummary(options?: {
  baseUrl?: string;
  headers?: HeadersInit;
}): Promise<InsightsSummary> {
  const url = options?.baseUrl
    ? `${options.baseUrl}/api/insights`
    : "/api/insights";

  const res = await fetch(url, { headers: options?.headers });
  if (!res.ok) throw new Error("Failed to fetch insights");
  return res.json();
}

export async function fetchLoggedExercises(options?: {
  baseUrl?: string;
  headers?: HeadersInit;
}): Promise<LoggedExercise[]> {
  const url = options?.baseUrl
    ? `${options.baseUrl}/api/insights/exercises`
    : "/api/insights/exercises";

  const res = await fetch(url, { headers: options?.headers });
  if (!res.ok) throw new Error("Failed to fetch exercises");
  return res.json();
}

export async function fetchExerciseProgression(
  exerciseId: string,
  days: number = 90,
  options?: { baseUrl?: string; headers?: HeadersInit }
): Promise<ExerciseProgressionPoint[]> {
  const params = new URLSearchParams({
    exerciseId,
    days: days.toString(),
  });

  const url = options?.baseUrl
    ? `${options.baseUrl}/api/insights/progression?${params}`
    : `/api/insights/progression?${params}`;

  const res = await fetch(url, { headers: options?.headers });
  if (!res.ok) throw new Error("Failed to fetch progression");
  return res.json();
}

export function getInsightsSummaryQueryOptions(options?: {
  baseUrl?: string;
  headers?: HeadersInit;
}) {
  return {
    queryKey: insightsKeys.summary(),
    queryFn: () => fetchInsightsSummary(options),
  };
}

export function getLoggedExercisesQueryOptions(options?: {
  baseUrl?: string;
  headers?: HeadersInit;
}) {
  return {
    queryKey: insightsKeys.exercises(),
    queryFn: () => fetchLoggedExercises(options),
  };
}

export function useInsightsSummary() {
  return useQuery<InsightsSummary>({
    queryKey: insightsKeys.summary(),
    queryFn: () => fetchInsightsSummary(),
  });
}

export function useLoggedExercises() {
  return useQuery<LoggedExercise[]>({
    queryKey: insightsKeys.exercises(),
    queryFn: () => fetchLoggedExercises(),
  });
}

export function useExerciseProgression(exerciseId: string | null, days: number = 90) {
  return useQuery<ExerciseProgressionPoint[]>({
    queryKey: insightsKeys.progression(exerciseId || "", days),
    queryFn: () => fetchExerciseProgression(exerciseId!, days),
    enabled: !!exerciseId,
  });
}
