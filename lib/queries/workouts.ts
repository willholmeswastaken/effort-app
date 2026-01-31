"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  WorkoutHistoryEntry,
  UpsertSetInput,
  CompleteWorkoutInput,
} from "@/lib/services";
import { workoutQueryKeys, fetchWorkoutSession } from "./workout-session";

export const workoutKeys = workoutQueryKeys;


export function useWorkoutHistory(limit?: number) {
  return useQuery<WorkoutHistoryEntry[]>({
    queryKey: workoutKeys.history(),
    queryFn: async () => {
      const params = limit ? `?limit=${limit}` : "";
      const res = await fetch(`/api/workouts${params}`);
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
  });
}


export function useStartWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { programId: string; dayId: string }) => {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to start workout");
      return res.json() as Promise<{ id: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.history() });
      queryClient.invalidateQueries({ queryKey: ["home"] });
    },
  });
}


export function useUpsertSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpsertSetInput) => {
      const res = await fetch("/api/workouts/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save set");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home"] });
    },
  });
}


export function useCompleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { workoutLogId: string } & Omit<CompleteWorkoutInput, "workoutLogId">) => {
      const res = await fetch(`/api/workouts/${data.workoutLogId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationSeconds: data.durationSeconds,
          rating: data.rating,
        }),
      });
      if (!res.ok) throw new Error("Failed to complete workout");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.history() });
      queryClient.invalidateQueries({ queryKey: ["home"] });
    },
  });
}


export function usePauseWorkout() {
  return useMutation({
    mutationFn: async (workoutLogId: string) => {
      const res = await fetch(`/api/workouts/${workoutLogId}/pause`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to pause workout");
      return res.json();
    },
  });
}


export function useResumeWorkout() {
  return useMutation({
    mutationFn: async (workoutLogId: string) => {
      const res = await fetch(`/api/workouts/${workoutLogId}/resume`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to resume workout");
      return res.json();
    },
  });
}


export function useResetWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workoutLogId: string) => {
      const res = await fetch(`/api/workouts/${workoutLogId}/reset`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to reset workout");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home"] });
    },
  });
}


export function useDeleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workoutLogId: string) => {
      const res = await fetch(`/api/workouts/${workoutLogId}/delete`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete workout");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home"] });
    },
  });
}


export function useWorkout(id: string | null) {
  return useQuery({
    queryKey: ["workout", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/workouts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch workout");
      return res.json();
    },
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });
}


export function useExerciseHistory(exerciseId: string, limit?: number) {
  return useQuery({
    queryKey: workoutKeys.exerciseHistory(exerciseId),
    queryFn: async () => {
      const params = limit ? `?limit=${limit}` : "";
      const res = await fetch(`/api/exercises/${exerciseId}/history${params}`);
      if (!res.ok) throw new Error("Failed to fetch exercise history");
      return res.json();
    },
    enabled: !!exerciseId,
  });
}


type LastLiftsData = Record<string, Array<{ date: string; sets: Array<{ setNumber: number; reps: number; weight: number }> }>>;

export function useLastLifts(exerciseIds: string[]) {
  return useQuery<LastLiftsData>({
    queryKey: workoutKeys.lastLifts(exerciseIds),
    queryFn: async () => {
      const res = await fetch("/api/exercises/last-lifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseIds }),
      });
      if (!res.ok) throw new Error("Failed to fetch last lifts");
      return res.json();
    },
    enabled: exerciseIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}


interface SwapExerciseData {
  workoutLogId: string;
  exerciseOrder: number;
  newExerciseId: string;
  newExerciseName: string;
}

export function useSwapExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SwapExerciseData) => {
      const res = await fetch(`/api/workouts/${data.workoutLogId}/swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseOrder: data.exerciseOrder,
          newExerciseId: data.newExerciseId,
          newExerciseName: data.newExerciseName,
        }),
      });
      if (!res.ok) throw new Error("Failed to swap exercise");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home"] });
    },
  });
}


export interface WorkoutSessionExercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: string;
  restSeconds: number;
  videoUrl: string | null;
  thumbnailUrl: string | null;
}

export interface WorkoutSessionSet {
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight: string;
}

export interface WorkoutSessionData {
  workout: {
    id: string;
    programId: string;
    dayId: string;
    dayTitle: string;
    programName: string;
    startedAt: string;
    completedAt: string | null;
    status: "active" | "paused" | "completed";
    lastPausedAt: string | null;
    accumulatedPauseSeconds: number;
    durationSeconds: number | null;
    rating: number | null;
  };
  exercises: WorkoutSessionExercise[];
  sets: WorkoutSessionSet[];
}

export function useWorkoutSession(workoutId: string) {
  return useQuery<WorkoutSessionData>({
    queryKey: workoutKeys.session(workoutId),
    queryFn: () => fetchWorkoutSession(workoutId),
    enabled: !!workoutId,
    staleTime: 30 * 1000,
  });
}
