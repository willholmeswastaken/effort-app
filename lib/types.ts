export interface Exercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: string;
  restSeconds?: number;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  alternatives?: string[];
}

export interface WorkoutDay {
  id: string;
  title: string;
  exercises: Exercise[];
}

export interface ProgramWeek {
  weekNumber: number;
  days: WorkoutDay[];
}

export interface Program {
  id: string;
  isSystem?: boolean;
  name: string;
  description: string;
  daysPerWeek: number;
  weeks: ProgramWeek[];
}

export interface SetLog {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: { reps: number; weight: number }[];
}

export interface WorkoutLog {
  id: string;
  programId: string;
  programName: string;
  dayId: string;
  dayName: string;
  date: string;
  durationSeconds: number;
  exercises: ExerciseLog[];
  rating: number;
}
