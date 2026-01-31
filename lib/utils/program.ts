import { WorkoutDay } from "@/lib/types";

export function getDayVolume(day: WorkoutDay) {
  return day.exercises.reduce((acc: number, ex: { targetSets: number }) => acc + ex.targetSets, 0);
}
