"use client";

import { useQuery } from "@tanstack/react-query";

export interface MuscleGroupExercise {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  targetSets: number | null;
  targetReps: string | null;
  restSeconds: number | null;
  videoUrl: string | null;
}

export interface MuscleGroup {
  id: string;
  name: string;
  coverImage: string | null;
  orderIndex: number | null;
  exercises: MuscleGroupExercise[];
}

export const exerciseKeys = {
  all: ["exercises"] as const,
  muscleGroups: () => [...exerciseKeys.all, "muscleGroups"] as const,
};


export function useMuscleGroups() {
  return useQuery<MuscleGroup[]>({
    queryKey: exerciseKeys.muscleGroups(),
    queryFn: async () => {
      const res = await fetch("/api/exercises");
      if (!res.ok) throw new Error("Failed to fetch muscle groups");
      return res.json();
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour - muscle groups rarely change
  });
}
