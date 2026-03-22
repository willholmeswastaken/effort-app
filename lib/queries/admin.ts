"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface AdminProgramSummary {
  id: string;
  name: string;
  description: string | null;
  daysPerWeek: number;
  weekCount: number;
  isSystem: boolean | null;
}

export interface AdminWeekExercise {
  dayExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroupId: string | null;
  exerciseOrder: number;
  targetSets: number;
  targetReps: string;
  restSeconds: number;
  targetSetsOverride: number | null;
  targetRepsOverride: string | null;
  restSecondsOverride: number | null;
}

export interface AdminWeekDay {
  id: string;
  title: string;
  dayOrder: number;
  exercises: AdminWeekExercise[];
}

export interface AdminWeekDetail {
  id: string;
  programId: string;
  weekNumber: number;
  days: AdminWeekDay[];
}

// ─── Query Keys ─────────────────────────────────────────────────────────────────

export const adminKeys = {
  all: ["admin"] as const,
  programs: () => [...adminKeys.all, "programs"] as const,
  week: (weekId: string) => [...adminKeys.all, "week", weekId] as const,
};

// ─── Fetchers ───────────────────────────────────────────────────────────────────

async function fetchAdminPrograms(): Promise<AdminProgramSummary[]> {
  const res = await fetch("/api/admin/programs");
  if (!res.ok) throw new Error("Failed to fetch programs");
  return res.json();
}

async function fetchAdminWeek(weekId: string): Promise<AdminWeekDetail> {
  const res = await fetch(`/api/admin/weeks/${weekId}`);
  if (!res.ok) throw new Error("Failed to fetch week");
  return res.json();
}

// ─── Query Hooks ────────────────────────────────────────────────────────────────

export function useAdminPrograms() {
  return useQuery({
    queryKey: adminKeys.programs(),
    queryFn: fetchAdminPrograms,
    staleTime: 30_000,
  });
}

export function useAdminWeek(weekId: string | null) {
  return useQuery({
    queryKey: adminKeys.week(weekId ?? ""),
    queryFn: () => fetchAdminWeek(weekId!),
    enabled: !!weekId,
    staleTime: 10_000,
  });
}

// ─── Mutation Hooks ─────────────────────────────────────────────────────────────

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      daysPerWeek: number;
      weekCount: number;
      dayTitles?: string[];
    }) => {
      const res = await fetch("/api/admin/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create program");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.programs() });
    },
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: {
      id: string;
      name?: string;
      description?: string | null;
      daysPerWeek?: number;
    }) => {
      const res = await fetch(`/api/admin/programs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to update program");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.programs() });
    },
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/programs/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete program");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.programs() });
    },
  });
}

export function useSaveWeek() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      weekId,
      days,
      applyToAll,
    }: {
      weekId: string;
      days: Array<{
        id?: string;
        title: string;
        dayOrder: number;
        exercises: Array<{
          exerciseId: string;
          exerciseOrder: number;
          targetSetsOverride?: number | null;
          targetRepsOverride?: string | null;
          restSecondsOverride?: number | null;
        }>;
      }>;
      applyToAll?: boolean;
    }) => {
      const res = await fetch(`/api/admin/weeks/${weekId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days, applyToAll }),
      });
      if (!res.ok) throw new Error("Failed to save week");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
}

export function useAddDayExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      dayId: string;
      exerciseId: string;
      exerciseOrder: number;
      targetSetsOverride?: number | null;
      targetRepsOverride?: string | null;
      restSecondsOverride?: number | null;
    }) => {
      const res = await fetch(`/api/admin/days/${input.dayId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to add exercise");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useUpdateDayExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      dayExerciseId,
      ...overrides
    }: {
      dayExerciseId: string;
      targetSetsOverride?: number | null;
      targetRepsOverride?: string | null;
      restSecondsOverride?: number | null;
    }) => {
      const res = await fetch(`/api/admin/day-exercises/${dayExerciseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrides),
      });
      if (!res.ok) throw new Error("Failed to update exercise");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useRemoveDayExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dayExerciseId: string) => {
      const res = await fetch(`/api/admin/day-exercises/${dayExerciseId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove exercise");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name: string;
      muscleGroupId: string;
      targetSets: number;
      targetReps: string;
      restSeconds: number;
    }) => {
      const res = await fetch("/api/admin/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create exercise");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
}
