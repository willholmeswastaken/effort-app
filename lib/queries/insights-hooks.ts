"use client";

import { useQuery } from "@tanstack/react-query";
import type { InsightsSummary, ExerciseProgressionPoint } from "@/lib/services";
import type { LoggedExercise } from "./insights";
import {
  insightsKeys,
  fetchInsightsSummary,
  fetchLoggedExercises,
  fetchExerciseProgression,
} from "./insights";

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
