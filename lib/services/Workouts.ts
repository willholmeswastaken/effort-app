import { Context, Effect, Layer } from "effect";
import { eq, and, desc, isNotNull, isNull, sql, inArray } from "drizzle-orm";
import { DatabaseService } from "./Database";
import * as schema from "@/lib/db/schema";


export interface UpsertSetInput {
  workoutLogId: string;
  exerciseId: string;
  exerciseName: string;
  exerciseOrder: number;
  setNumber: number;
  reps: number;
  weight: number;
}

export interface StartWorkoutInput {
  userId: string;
  programId: string;
  dayId: string;
  programInstanceId?: string | null;
}

export interface CompleteWorkoutInput {
  workoutLogId: string;
  durationSeconds: number;
  rating: number;
}

export interface SwapExerciseInput {
  workoutLogId: string;
  exerciseOrder: number;
  newExerciseId: string;
  newExerciseName: string;
  newExerciseMuscleGroupId?: string | null;
}

export interface WorkoutHistoryEntry {
  id: string;
  programId: string;
  dayId: string;
  dayTitle: string;
  startedAt: Date;
  completedAt: Date | null;
  durationSeconds: number | null;
  rating: number | null;
  exerciseCount: number;
}

export interface ExerciseHistoryEntry {
  workoutDate: Date;
  sets: { setNumber: number; reps: number; weight: string }[];
}

export interface WorkoutDetail {
  id: string;
  programId: string;
  dayId: string;
  dayTitle: string;
  startedAt: Date;
  completedAt: Date | null;
  durationSeconds: number | null;
  rating: number | null;
  status: string | null;
  lastPausedAt: Date | null;
  accumulatedPauseSeconds: number | null;
  exercises: {
    id: string;
    name: string;
    exerciseOrder: number;
    targetSets: number;
    targetReps: string;
    restSeconds: number;
    videoUrl: string | null;
    thumbnailUrl: string | null;
    sets: { setNumber: number; reps: number; weight: string }[];
  }[];
}

export interface LastLiftEntry {
  date: Date;
  sets: { setNumber: number; reps: number; weight: number }[];
}

export interface InProgressWorkout {
  workoutLogId: string;
  programId: string;
  dayId: string;
  startedAt: Date;
  lastSetAt: Date | null;
}

export interface CompletedWorkout {
  id: string;
  startedAt: Date;
  completedAt: Date;
  durationSeconds: number;
  rating: number | null;
  exercises: {
    id: string;
    name: string;
    targetSets: number;
    targetReps: string;
    restSeconds: number;
    videoUrl: string | null;
    thumbnailUrl: string | null;
    setLogs: { setNumber: number; reps: number; weight: string }[];
  }[];
}

export interface WorkoutSessionSet {
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight: string;
}

export interface WorkoutSessionExercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: string;
  restSeconds: number;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  muscleGroupId: string | null;
}

export interface WorkoutSessionWorkout {
  id: string;
  programId: string;
  dayId: string;
  dayTitle: string;
  programName: string;
  startedAt: string;
  completedAt: string | null;
  status: string;
  lastPausedAt: string | null;
  accumulatedPauseSeconds: number | null;
  durationSeconds: number | null;
  rating: number | null;
}

export interface WorkoutSessionData {
  workout: WorkoutSessionWorkout;
  exercises: WorkoutSessionExercise[];
  sets: WorkoutSessionSet[];
}

export interface WorkoutsServiceInterface {
  readonly startWorkout: (input: StartWorkoutInput) => Effect.Effect<string, Error>;
  readonly startWorkoutAndGetSession: (input: StartWorkoutInput) => Effect.Effect<{ workoutId: string; session: WorkoutSessionData }, Error>;
  readonly upsertSet: (input: UpsertSetInput & { userId: string }) => Effect.Effect<void, Error>;
  readonly pauseWorkout: (workoutLogId: string, userId: string) => Effect.Effect<void, Error>;
  readonly resumeWorkout: (workoutLogId: string, userId: string) => Effect.Effect<{ accumulatedPauseSeconds: number }, Error>;
  readonly resetWorkout: (workoutLogId: string, userId: string) => Effect.Effect<{ programId: string; dayId: string }, Error>;
  readonly deleteWorkout: (workoutLogId: string, userId: string) => Effect.Effect<void, Error>;
  readonly completeWorkout: (input: CompleteWorkoutInput & { userId: string }) => Effect.Effect<void, Error>;
  readonly rateWorkout: (workoutLogId: string, userId: string, rating: number) => Effect.Effect<void, Error>;
  readonly swapExercise: (input: SwapExerciseInput) => Effect.Effect<void, Error>;
  readonly getHistory: (userId: string, limit?: number) => Effect.Effect<WorkoutHistoryEntry[], Error>;
  readonly getWorkoutById: (id: string) => Effect.Effect<WorkoutDetail | null, Error>;
  readonly getExerciseHistory: (
    userId: string,
    exerciseId: string,
    limit?: number
  ) => Effect.Effect<ExerciseHistoryEntry[], Error>;
  readonly getCompletedDayIds: (
    userId: string,
    programId: string
  ) => Effect.Effect<Set<string>, Error>;
  readonly getMostRecentWorkout: (
    userId: string,
    programId: string,
    dayId: string
  ) => Effect.Effect<InProgressWorkout | null, Error>;
  readonly getLastLifts: (
    userId: string,
    exerciseIds: string[]
  ) => Effect.Effect<Map<string, LastLiftEntry[]>, Error>;
  readonly getCompletedWorkout: (
    userId: string,
    programId: string,
    dayId: string
  ) => Effect.Effect<CompletedWorkout | null, Error>;
  readonly getWorkoutSession: (workoutId: string) => Effect.Effect<WorkoutSessionData | null, Error>;
}


export class WorkoutsService extends Context.Tag("WorkoutsService")<
  WorkoutsService,
  WorkoutsServiceInterface
>() {}


export const WorkoutsServiceLive = Layer.effect(
  WorkoutsService,
  Effect.gen(function* () {
    const db = yield* DatabaseService;

    const startWorkout = (input: StartWorkoutInput): Effect.Effect<string, Error> =>
      Effect.tryPromise({

        try: async () => {
          const whereConditions = [
            eq(schema.workoutLogs.userId, input.userId),
            eq(schema.workoutLogs.programId, input.programId),
            eq(schema.workoutLogs.dayId, input.dayId),
          ];
          
          if (input.programInstanceId) {
            whereConditions.push(eq(schema.workoutLogs.programInstanceId, input.programInstanceId));
          }

          const existing = await db.query.workoutLogs.findFirst({
            where: and(...whereConditions),
            orderBy: (logs, { desc }) => [desc(logs.startedAt)],
            columns: { id: true },
          });


          if (existing) {
            return existing.id;
          }

          const [log] = await db
            .insert(schema.workoutLogs)
            .values({
              userId: input.userId,
              programId: input.programId,
              programInstanceId: input.programInstanceId ?? null,
              dayId: input.dayId,
              startedAt: new Date(),
            })
            .returning();
          return log.id;
        },
        catch: (e) => new Error(`Failed to start workout: ${e}`),
      });

    const upsertSet = (input: UpsertSetInput & { userId: string }): Effect.Effect<void, Error> =>
      Effect.tryPromise({

        try: async () => {
          const workout = await db.query.workoutLogs.findFirst({
            where: and(
              eq(schema.workoutLogs.id, input.workoutLogId),
              eq(schema.workoutLogs.userId, input.userId)
            ),
            columns: { id: true },
          });
          if (!workout) {
            throw new Error("Workout not found or unauthorized");
          }

          let exerciseLog = await db.query.exerciseLogs.findFirst({
            where: and(
              eq(schema.exerciseLogs.workoutLogId, input.workoutLogId),
              eq(schema.exerciseLogs.exerciseId, input.exerciseId)
            ),
          });

          if (!exerciseLog) {
            // Get exercise details for denormalization
            const exercise = await db.query.exercises.findFirst({
              where: eq(schema.exercises.id, input.exerciseId),
            });
            
            const [newLog] = await db
              .insert(schema.exerciseLogs)
              .values({
                workoutLogId: input.workoutLogId,
                exerciseId: input.exerciseId,
                exerciseName: input.exerciseName,
                exerciseOrder: input.exerciseOrder,
                // Denormalized exercise fields
                targetSets: exercise?.targetSets ?? 3,
                targetReps: exercise?.targetReps ?? "8-12",
                restSeconds: exercise?.restSeconds ?? 90,
                videoUrl: exercise?.videoUrl ?? null,
                thumbnailUrl: exercise?.thumbnailUrl ?? null,
              })
              .returning();
            exerciseLog = newLog;
          }

          // Insert/update the set log
          await db
            .insert(schema.setLogs)
            .values({
              exerciseLogId: exerciseLog.id,
              setNumber: input.setNumber,
              reps: input.reps,
              weight: input.weight.toString(),
            })
            .onConflictDoUpdate({
              target: [schema.setLogs.exerciseLogId, schema.setLogs.setNumber],
              set: {
                reps: input.reps,
                weight: input.weight.toString(),
                updatedAt: new Date(),
              },
            });

          // Update denormalized setsSnapshot
          const allSets = await db
            .select({
              setNumber: schema.setLogs.setNumber,
              reps: schema.setLogs.reps,
              weight: schema.setLogs.weight,
            })
            .from(schema.setLogs)
            .where(eq(schema.setLogs.exerciseLogId, exerciseLog.id))
            .orderBy(schema.setLogs.setNumber);

          await db
            .update(schema.exerciseLogs)
            .set({
              setsSnapshot: JSON.stringify(allSets.map(s => ({
                setNumber: s.setNumber,
                reps: s.reps,
                weight: s.weight.toString(),
              }))),
            })
            .where(eq(schema.exerciseLogs.id, exerciseLog.id));
        },
        catch: (e) => new Error(`Failed to upsert set: ${e}`),
      });

    const pauseWorkout = (workoutLogId: string, userId: string): Effect.Effect<void, Error> =>
      Effect.tryPromise({
        try: async () => {
          const result = await db
            .update(schema.workoutLogs)
            .set({
              status: "paused",
              lastPausedAt: new Date(),
            })
            .where(and(
              eq(schema.workoutLogs.id, workoutLogId),
              eq(schema.workoutLogs.userId, userId)
            ))
            .returning({ id: schema.workoutLogs.id });
          
          if (result.length === 0) {
            throw new Error("Workout not found or unauthorized");
          }
        },
        catch: (e) => new Error(`Failed to pause workout: ${e}`),
      });

    const resumeWorkout = (workoutLogId: string, userId: string): Effect.Effect<{ accumulatedPauseSeconds: number }, Error> =>
      Effect.tryPromise({
        try: async () => {
          const workout = await db.query.workoutLogs.findFirst({
            where: and(
              eq(schema.workoutLogs.id, workoutLogId),
              eq(schema.workoutLogs.userId, userId)
            ),
          });

          if (!workout) {
            throw new Error("Workout not found or unauthorized");
          }

          if (workout.status !== "paused" || !workout.lastPausedAt) {
            return { accumulatedPauseSeconds: workout.accumulatedPauseSeconds || 0 };
          }

          const pauseDuration = Math.round(
            (new Date().getTime() - workout.lastPausedAt.getTime()) / 1000
          );

          const newAccumulatedPause = (workout.accumulatedPauseSeconds || 0) + pauseDuration;

          await db
            .update(schema.workoutLogs)
            .set({
              status: "active",
              lastPausedAt: null,
              accumulatedPauseSeconds: newAccumulatedPause,
            })
            .where(eq(schema.workoutLogs.id, workoutLogId));

          return { accumulatedPauseSeconds: newAccumulatedPause };
        },
        catch: (e) => new Error(`Failed to resume workout: ${e}`),
      });

    const resetWorkout = (workoutLogId: string, userId: string): Effect.Effect<{ programId: string; dayId: string }, Error> =>
      Effect.tryPromise({
        try: async () => {
          const workout = await db.query.workoutLogs.findFirst({
            where: and(
              eq(schema.workoutLogs.id, workoutLogId),
              eq(schema.workoutLogs.userId, userId)
            ),
            columns: { programId: true, dayId: true },
          });

          if (!workout) {
            throw new Error("Workout not found or unauthorized");
          }

          // Delete all exercise logs (cascade deletes set_logs)
          await db
            .delete(schema.exerciseLogs)
            .where(eq(schema.exerciseLogs.workoutLogId, workoutLogId));

          // Reset workout log - keep denormalized data (day config hasn't changed)
          await db
            .update(schema.workoutLogs)
            .set({
              startedAt: new Date(),
              completedAt: null,
              durationSeconds: null,
              rating: null,
              status: "active",
              lastPausedAt: null,
              accumulatedPauseSeconds: 0,
              // Note: dayExercisesSnapshot, programName, dayTitle are preserved
              // They contain the day configuration which doesn't change on reset
            })
            .where(eq(schema.workoutLogs.id, workoutLogId));

          return { programId: workout.programId, dayId: workout.dayId };
        },
        catch: (e) => new Error(`Failed to reset workout: ${e}`),
      });

    const deleteWorkout = (workoutLogId: string, userId: string): Effect.Effect<void, Error> =>
      Effect.tryPromise({
        try: async () => {
          const result = await db
            .delete(schema.workoutLogs)
            .where(and(
              eq(schema.workoutLogs.id, workoutLogId),
              eq(schema.workoutLogs.userId, userId)
            ))
            .returning({ id: schema.workoutLogs.id });

          if (result.length === 0) {
            throw new Error("Workout not found or unauthorized");
          }
        },
        catch: (e) => new Error(`Failed to delete workout: ${e}`),
      });

    const completeWorkout = (input: CompleteWorkoutInput & { userId: string }): Effect.Effect<void, Error> =>
      Effect.tryPromise({
        try: async () => {
          const result = await db
            .update(schema.workoutLogs)
            .set({
              completedAt: new Date(),
              durationSeconds: input.durationSeconds,
              rating: input.rating,
              status: "completed",
            })
            .where(and(
              eq(schema.workoutLogs.id, input.workoutLogId),
              eq(schema.workoutLogs.userId, input.userId)
            ))
            .returning({ id: schema.workoutLogs.id });

          if (result.length === 0) {
            throw new Error("Workout not found or unauthorized");
          }
        },
        catch: (e) => new Error(`Failed to complete workout: ${e}`),
      });

    const rateWorkout = (workoutLogId: string, userId: string, rating: number): Effect.Effect<void, Error> =>
      Effect.tryPromise({
        try: async () => {
          const result = await db
            .update(schema.workoutLogs)
            .set({
              rating,
            })
            .where(and(
              eq(schema.workoutLogs.id, workoutLogId),
              eq(schema.workoutLogs.userId, userId),
              eq(schema.workoutLogs.status, "completed")
            ))
            .returning({ id: schema.workoutLogs.id });

          if (result.length === 0) {
            throw new Error("Workout not found, unauthorized, or not completed");
          }
        },
        catch: (e) => new Error(`Failed to rate workout: ${e}`),
      });

    const swapExercise = (input: SwapExerciseInput): Effect.Effect<void, Error> =>
      Effect.tryPromise({
        try: async () => {
          // First, find the existing exercise log at this order position
          const existingLog = await db.query.exerciseLogs.findFirst({
            where: and(
              eq(schema.exerciseLogs.workoutLogId, input.workoutLogId),
              eq(schema.exerciseLogs.exerciseOrder, input.exerciseOrder)
            ),
          });

          // Get the new exercise details for denormalization
          const newExercise = await db.query.exercises.findFirst({
            where: eq(schema.exercises.id, input.newExerciseId),
          });

          const muscleGroupId = input.newExerciseMuscleGroupId ?? newExercise?.muscleGroupId ?? null;

          if (existingLog) {
            // Update existing exercise log with new exercise
            await db
              .update(schema.exerciseLogs)
              .set({
                exerciseId: input.newExerciseId,
                exerciseName: input.newExerciseName,
                // Update denormalized fields
                targetSets: newExercise?.targetSets ?? 3,
                targetReps: newExercise?.targetReps ?? "8-12",
                restSeconds: newExercise?.restSeconds ?? 90,
                videoUrl: newExercise?.videoUrl ?? null,
                thumbnailUrl: newExercise?.thumbnailUrl ?? null,
              })
              .where(eq(schema.exerciseLogs.id, existingLog.id));
          } else {
            // Insert new exercise log
            await db.insert(schema.exerciseLogs).values({
              workoutLogId: input.workoutLogId,
              exerciseId: input.newExerciseId,
              exerciseName: input.newExerciseName,
              exerciseOrder: input.exerciseOrder,
              // Denormalized exercise fields
              targetSets: newExercise?.targetSets ?? 3,
              targetReps: newExercise?.targetReps ?? "8-12",
              restSeconds: newExercise?.restSeconds ?? 90,
              videoUrl: newExercise?.videoUrl ?? null,
              thumbnailUrl: newExercise?.thumbnailUrl ?? null,
            });
          }
          
          // Update the workout log's dayExercisesSnapshot with the new muscleGroupId
          const workoutLog = await db.query.workoutLogs.findFirst({
            where: eq(schema.workoutLogs.id, input.workoutLogId),
            columns: { dayExercisesSnapshot: true },
          });
          
          if (workoutLog?.dayExercisesSnapshot) {
            try {
              const exercises = JSON.parse(workoutLog.dayExercisesSnapshot) as Array<{
                id: string;
                name: string;
                targetSets?: number;
                targetReps?: string;
                restSeconds?: number;
                videoUrl?: string | null;
                thumbnailUrl?: string | null;
                muscleGroupId?: string | null;
              }>;
              
              // Update the exercise at the specified order with the new muscleGroupId
              if (exercises[input.exerciseOrder]) {
                exercises[input.exerciseOrder].muscleGroupId = muscleGroupId;
                
                await db
                  .update(schema.workoutLogs)
                  .set({ dayExercisesSnapshot: JSON.stringify(exercises) })
                  .where(eq(schema.workoutLogs.id, input.workoutLogId));
              }
            } catch {
              // If parsing fails, don't break the swap - just skip the snapshot update
            }
          }
        },
        catch: (e) => new Error(`Failed to swap exercise: ${e}`),
      });

    const getHistory = (userId: string, limit: number = 20): Effect.Effect<WorkoutHistoryEntry[], Error> =>
      Effect.tryPromise({
        try: async () => {
          const logs = await db.query.workoutLogs.findMany({
            where: and(
              eq(schema.workoutLogs.userId, userId),
              isNotNull(schema.workoutLogs.completedAt)
            ),
            orderBy: [desc(schema.workoutLogs.completedAt)],
            limit,
            with: {
              exerciseLogs: true,
              day: true,
            },
          });

          return logs.map((log) => ({
            id: log.id,
            programId: log.programId,
            dayId: log.dayId,
            dayTitle: log.day?.title ?? "Unknown Day",
            startedAt: log.startedAt,
            completedAt: log.completedAt,
            durationSeconds: log.durationSeconds,
            rating: log.rating,
            exerciseCount: log.exerciseLogs.filter((el) => el.exerciseId).length,
          }));
        },
        catch: (e) => new Error(`Failed to fetch workout history: ${e}`),
      });

    const getWorkoutById = (id: string): Effect.Effect<WorkoutDetail | null, Error> =>
      Effect.tryPromise({
        try: async () => {
          const workout = await db.query.workoutLogs.findFirst({
            where: eq(schema.workoutLogs.id, id),
            with: {
              day: true,
              exerciseLogs: {
                with: {
                  setLogs: {
                    orderBy: (sets, { asc }) => [asc(sets.setNumber)],
                  },
                },
              },
            },
          });

          if (!workout) return null;

          return {
            id: workout.id,
            programId: workout.programId,
            dayId: workout.dayId,
            dayTitle: workout.day?.title ?? "Unknown Day",
            startedAt: workout.startedAt,
            completedAt: workout.completedAt,
            durationSeconds: workout.durationSeconds,
            rating: workout.rating,
            status: workout.status,
            lastPausedAt: workout.lastPausedAt,
            accumulatedPauseSeconds: workout.accumulatedPauseSeconds,
            exercises: workout.exerciseLogs.map((el) => ({
              id: el.exerciseId,
              name: el.exerciseName,
              exerciseOrder: el.exerciseOrder,
              targetSets: el.targetSets ?? 3,
              targetReps: el.targetReps ?? "8-12",
              restSeconds: el.restSeconds ?? 90,
              videoUrl: el.videoUrl ?? null,
              thumbnailUrl: el.thumbnailUrl ?? null,
              sets: el.setLogs.map((sl) => ({
                setNumber: sl.setNumber,
                reps: sl.reps,
                weight: sl.weight.toString(),
              })),
            })),
          };
        },
        catch: (e) => new Error(`Failed to fetch workout: ${e}`),
      });

    const getExerciseHistory = (
      userId: string,
      exerciseId: string,
      limit: number = 10
    ): Effect.Effect<ExerciseHistoryEntry[], Error> =>
      Effect.tryPromise({
        try: async () => {
          const logs = await db
            .select({
              workoutDate: schema.workoutLogs.startedAt,
              setNumber: schema.setLogs.setNumber,
              reps: schema.setLogs.reps,
              weight: schema.setLogs.weight,
            })
            .from(schema.exerciseLogs)
            .innerJoin(
              schema.workoutLogs,
              eq(schema.exerciseLogs.workoutLogId, schema.workoutLogs.id)
            )
            .innerJoin(
              schema.setLogs,
              eq(schema.setLogs.exerciseLogId, schema.exerciseLogs.id)
            )
            .where(
              and(
                eq(schema.exerciseLogs.exerciseId, exerciseId),
                eq(schema.workoutLogs.userId, userId),
                isNotNull(schema.workoutLogs.completedAt)
              )
            )
            .orderBy(desc(schema.workoutLogs.startedAt))
            .limit(limit * 5);

          // Group by workout date
          const byDate = new Map<string, typeof logs>();
          for (const log of logs) {
            const dateKey = log.workoutDate.toISOString();
            const existing = byDate.get(dateKey) || [];
            existing.push(log);
            byDate.set(dateKey, existing);
          }

          return Array.from(byDate.entries())
            .slice(0, limit)
            .map(([date, sets]) => ({
              workoutDate: new Date(date),
              sets: sets.map((s) => ({
                setNumber: s.setNumber,
                reps: s.reps,
                weight: s.weight.toString(),
              })),
            }));
        },
        catch: (e) => new Error(`Failed to fetch exercise history: ${e}`),
      });

    const getCompletedDayIds = (
      userId: string,
      programId: string
    ): Effect.Effect<Set<string>, Error> =>
      Effect.tryPromise({
        try: async () => {
          const completedLogs = await db
            .select({ dayId: schema.workoutLogs.dayId })
            .from(schema.workoutLogs)
            .where(
              and(
                eq(schema.workoutLogs.userId, userId),
                eq(schema.workoutLogs.programId, programId),
                isNotNull(schema.workoutLogs.completedAt)
              )
            );

          return new Set(completedLogs.map((log) => log.dayId));
        },
        catch: (e) => new Error(`Failed to fetch completed day IDs: ${e}`),
      });

    const getMostRecentWorkout = (
      userId: string,
      programId: string,
      dayId: string
    ): Effect.Effect<InProgressWorkout | null, Error> =>
      Effect.tryPromise({
        try: async () => {
          const workout = await db.query.workoutLogs.findFirst({
            where: and(
              eq(schema.workoutLogs.userId, userId),
              eq(schema.workoutLogs.programId, programId),
              eq(schema.workoutLogs.dayId, dayId),
              isNull(schema.workoutLogs.completedAt)
            ),
            orderBy: [desc(schema.workoutLogs.startedAt)],
            with: {
              exerciseLogs: {
                orderBy: [desc(schema.exerciseLogs.id)],
                limit: 1,
                with: {
                  setLogs: {
                    orderBy: [desc(schema.setLogs.updatedAt)],
                    limit: 1,
                  },
                },
              },
            },
          });

          if (!workout) return null;

          const lastSetLog = workout.exerciseLogs[0]?.setLogs[0];
          const lastSetAt = lastSetLog?.updatedAt ?? null;

          return {
            workoutLogId: workout.id,
            programId: workout.programId,
            dayId: workout.dayId,
            startedAt: workout.startedAt,
            lastSetAt,
          };
        },
        catch: (e) => new Error(`Failed to fetch most recent workout: ${e}`),
      });

    const getLastLifts = (
      userId: string,
      exerciseIds: string[]
    ): Effect.Effect<Map<string, LastLiftEntry[]>, Error> =>
      Effect.tryPromise({
        try: async () => {
          if (exerciseIds.length === 0) {
            return new Map();
          }


          const logs = await db
            .select({
              exerciseId: schema.exerciseLogs.exerciseId,
              exerciseLogId: schema.exerciseLogs.id,
              startedAt: schema.workoutLogs.startedAt,
            })
            .from(schema.exerciseLogs)
            .innerJoin(
              schema.workoutLogs,
              eq(schema.exerciseLogs.workoutLogId, schema.workoutLogs.id)
            )
            .where(
              and(
                inArray(schema.exerciseLogs.exerciseId, exerciseIds),
                eq(schema.workoutLogs.userId, userId),
                isNotNull(schema.workoutLogs.completedAt)
              )
            )
            .orderBy(desc(schema.workoutLogs.startedAt));


          const byExercise = new Map<string, typeof logs>();
          for (const log of logs) {
            const existing = byExercise.get(log.exerciseId) || [];
            if (existing.length < 3) {
              existing.push(log);
              byExercise.set(log.exerciseId, existing);
            }
          }


          const exerciseLogIds = Array.from(byExercise.values()).flat().map(l => l.exerciseLogId);
          if (exerciseLogIds.length === 0) {
            return new Map();
          }

          const setLogs = await db
            .select()
            .from(schema.setLogs)
            .where(inArray(schema.setLogs.exerciseLogId, exerciseLogIds))
            .orderBy(schema.setLogs.setNumber);


          const setsByExerciseLog = new Map<string, typeof setLogs>();
          for (const setLog of setLogs) {
            const existing = setsByExerciseLog.get(setLog.exerciseLogId) || [];
            existing.push(setLog);
            setsByExerciseLog.set(setLog.exerciseLogId, existing);
          }


          const result = new Map<string, LastLiftEntry[]>();
          for (const [exerciseId, exerciseLogs] of byExercise.entries()) {
            const entries: LastLiftEntry[] = exerciseLogs.map((log) => ({
              date: log.startedAt,
              sets: (setsByExerciseLog.get(log.exerciseLogId) || []).map((s) => ({
                setNumber: s.setNumber,
                reps: s.reps,
                weight: Number(s.weight),
              })),
            }));
            result.set(exerciseId, entries);
          }

          return result;
        },
        catch: (e) => new Error(`Failed to fetch last lifts: ${e}`),
      });

    const getCompletedWorkout = (
      userId: string,
      programId: string,
      dayId: string
    ): Effect.Effect<CompletedWorkout | null, Error> =>
      Effect.tryPromise({
        try: async () => {
          const workout = await db.query.workoutLogs.findFirst({
            where: and(
              eq(schema.workoutLogs.userId, userId),
              eq(schema.workoutLogs.programId, programId),
              eq(schema.workoutLogs.dayId, dayId),
              isNotNull(schema.workoutLogs.completedAt)
            ),
            orderBy: [desc(schema.workoutLogs.completedAt)],
            with: {
              exerciseLogs: {
                with: {
                  exercise: true,
                  setLogs: true,
                },
              },
            },
          });

          if (!workout || !workout.completedAt) return null;

          const exercises = workout.exerciseLogs
            .filter((exLog) => exLog.setLogs.some(s => s.reps > 0))
            .map((exLog) => ({
              id: exLog.exerciseId,
              name: exLog.exercise?.name ?? "Unknown Exercise",
              targetSets: exLog.exercise?.targetSets ?? 3,
              targetReps: exLog.exercise?.targetReps ?? "8-12",
              restSeconds: exLog.exercise?.restSeconds ?? 90,
              videoUrl: exLog.exercise?.videoUrl ?? null,
              thumbnailUrl: exLog.exercise?.thumbnailUrl ?? null,
              setLogs: exLog.setLogs.map((setLog) => ({
                setNumber: setLog.setNumber,
                reps: setLog.reps,
                weight: setLog.weight.toString(),
              })),
            }));

          return {
            id: workout.id,
            startedAt: workout.startedAt,
            completedAt: workout.completedAt,
            durationSeconds: workout.durationSeconds ?? 0,
            rating: workout.rating,
            exercises,
          };
        },
        catch: (e) => new Error(`Failed to fetch completed workout: ${e}`),
      });

    // OPTIMIZED: Uses only denormalized data (no joins - single table lookup)
    const getWorkoutSession = (workoutId: string): Effect.Effect<WorkoutSessionData | null, Error> =>
      Effect.tryPromise({
        try: async () => {
          // Fetch workout log with denormalized data (no joins needed!)
          const workoutLog = await db.query.workoutLogs.findFirst({
            where: eq(schema.workoutLogs.id, workoutId),
            columns: {
              id: true,
              programId: true,
              dayId: true,
              startedAt: true,
              completedAt: true,
              status: true,
              lastPausedAt: true,
              accumulatedPauseSeconds: true,
              durationSeconds: true,
              rating: true,
              programName: true,
              dayTitle: true,
              dayExercisesSnapshot: true,
            },
          });

          if (!workoutLog) return null;

          // Require denormalized data - no fallback for legacy data
          if (!workoutLog.programName || !workoutLog.dayExercisesSnapshot) {
            throw new Error("Workout missing denormalized data - please reset and restart workout");
          }

          // Parse denormalized exercises
          const parsedExercises = JSON.parse(workoutLog.dayExercisesSnapshot) as Array<{
            id: string;
            name: string;
            targetSets?: number;
            targetReps?: string;
            restSeconds?: number;
            videoUrl?: string | null;
            thumbnailUrl?: string | null;
            muscleGroupId?: string | null;
          }>;
          
          let exercises: WorkoutSessionExercise[] = parsedExercises.map(e => ({
            id: e.id,
            name: e.name,
            targetSets: e.targetSets ?? 3,
            targetReps: e.targetReps ?? "8-12",
            restSeconds: e.restSeconds ?? 90,
            videoUrl: e.videoUrl ?? null,
            thumbnailUrl: e.thumbnailUrl ?? null,
            muscleGroupId: e.muscleGroupId ?? null,
          }));

          // Fetch exercise logs with denormalized data (single table query)
          const exerciseLogs = await db.query.exerciseLogs.findMany({
            where: eq(schema.exerciseLogs.workoutLogId, workoutId),
            columns: {
              exerciseId: true,
              exerciseName: true,
              exerciseOrder: true,
              targetSets: true,
              targetReps: true,
              restSeconds: true,
              videoUrl: true,
              thumbnailUrl: true,
              setsSnapshot: true,
            },
          });

          // Apply exercise swaps from exercise_logs
          if (exerciseLogs.length > 0) {
            const orderToExerciseMap = new Map<number, WorkoutSessionExercise>();

            for (const exLog of exerciseLogs) {
              const exerciseOrder = exLog.exerciseOrder;
              if (exerciseOrder >= 0) {
                // Get muscleGroupId from the snapshot if available
                const snapshotExercise = parsedExercises[exerciseOrder];
                orderToExerciseMap.set(exerciseOrder, {
                  id: exLog.exerciseId,
                  name: exLog.exerciseName,
                  targetSets: exLog.targetSets ?? 3,
                  targetReps: exLog.targetReps ?? "8-12",
                  restSeconds: exLog.restSeconds ?? 90,
                  videoUrl: exLog.videoUrl ?? null,
                  thumbnailUrl: exLog.thumbnailUrl ?? null,
                  muscleGroupId: snapshotExercise?.muscleGroupId ?? null,
                });
              }
            }

            exercises = exercises.map((originalExercise, index) => {
              const swappedExercise = orderToExerciseMap.get(index);
              if (swappedExercise && swappedExercise.id !== originalExercise.id) {
                return swappedExercise;
              }
              return originalExercise;
            });
          }

          // Build sets from denormalized snapshots
          let sets: WorkoutSessionSet[] = [];
          for (const exLog of exerciseLogs) {
            if (exLog.setsSnapshot) {
              try {
                const parsedSets = JSON.parse(exLog.setsSnapshot) as Array<{
                  setNumber: number;
                  reps: number;
                  weight: string;
                }>;
                sets.push(...parsedSets.map(s => ({
                  exerciseId: exLog.exerciseId,
                  setNumber: s.setNumber,
                  reps: s.reps,
                  weight: s.weight,
                })));
              } catch {
                // If parsing fails, skip this exercise's sets
              }
            }
          }

          return {
            workout: {
              id: workoutLog.id,
              programId: workoutLog.programId,
              dayId: workoutLog.dayId,
              dayTitle: workoutLog.dayTitle!,
              programName: workoutLog.programName!,
              startedAt: workoutLog.startedAt.toISOString(),
              completedAt: workoutLog.completedAt?.toISOString() ?? null,
              status: workoutLog.status,
              lastPausedAt: workoutLog.lastPausedAt?.toISOString() ?? null,
              accumulatedPauseSeconds: workoutLog.accumulatedPauseSeconds,
              durationSeconds: workoutLog.durationSeconds,
              rating: workoutLog.rating,
            },
            exercises,
            sets,
          };
        },
        catch: (e) => new Error(`Failed to fetch workout session: ${e}`),
      });

    // OPTIMIZED: Populates denormalized fields on create for fast future reads
    const startWorkoutAndGetSession = (input: StartWorkoutInput): Effect.Effect<{ workoutId: string; session: WorkoutSessionData }, Error> =>
      Effect.tryPromise({
        try: async () => {
          // Step 1: Find existing or create new workout log
          const whereConditions = [
            eq(schema.workoutLogs.userId, input.userId),
            eq(schema.workoutLogs.programId, input.programId),
            eq(schema.workoutLogs.dayId, input.dayId),
          ];
          
          if (input.programInstanceId) {
            whereConditions.push(eq(schema.workoutLogs.programInstanceId, input.programInstanceId));
          }

          const existing = await db.query.workoutLogs.findFirst({
            where: and(...whereConditions),
            orderBy: (logs, { desc }) => [desc(logs.startedAt)],
            columns: { id: true },
          });

          let workoutId: string;
          let isNewWorkout = false;
          
          if (existing) {
            workoutId = existing.id;
          } else {
            isNewWorkout = true;
            
            // Fetch day data for denormalization BEFORE creating the log
            const dayData = await db.query.workoutDays.findFirst({
              where: eq(schema.workoutDays.id, input.dayId),
              with: {
                week: {
                  with: {
                    program: true,
                  },
                },
                dayExercises: {
                  orderBy: (de, { asc }) => [asc(de.exerciseOrder)],
                  with: {
                    exercise: true,
                  },
                },
              },
            });

            if (!dayData || !dayData.week || !dayData.week.program) {
              throw new Error("Day data not found for denormalization");
            }

            // Build denormalized exercises array
            const denormalizedExercises = dayData.dayExercises.map((de) => ({
              id: de.exercise.id,
              name: de.exercise.name,
              targetSets: de.exercise.targetSets ?? 3,
              targetReps: de.exercise.targetReps ?? "8-12",
              restSeconds: de.exercise.restSeconds ?? 90,
              videoUrl: de.exercise.videoUrl ?? null,
              thumbnailUrl: de.exercise.thumbnailUrl ?? null,
              muscleGroupId: de.exercise.muscleGroupId ?? null,
            }));

            // Create workout log WITH denormalized data
            const [log] = await db
              .insert(schema.workoutLogs)
              .values({
                userId: input.userId,
                programId: input.programId,
                programInstanceId: input.programInstanceId ?? null,
                dayId: input.dayId,
                startedAt: new Date(),
                // Denormalized fields for fast reads
                programName: dayData.week.program.name,
                dayTitle: dayData.title,
                dayExercisesSnapshot: JSON.stringify(denormalizedExercises),
              })
              .returning();
            
            workoutId = log.id;
          }

          // Step 2: Fetch session using optimized path
          const session = await getWorkoutSession(workoutId).pipe(
            Effect.runPromise
          );

          if (!session) {
            throw new Error("Failed to fetch workout session");
          }

          return { workoutId, session };
        },
        catch: (e) => new Error(`Failed to start workout and get session: ${e}`),
      });

    return {
      startWorkout,
      startWorkoutAndGetSession,
      upsertSet,
      pauseWorkout,
      resumeWorkout,
      resetWorkout,
      deleteWorkout,
      completeWorkout,
      rateWorkout,
      swapExercise,
      getHistory,
      getWorkoutById,
      getExerciseHistory,
      getCompletedDayIds,
      getMostRecentWorkout,
      getLastLifts,
      getCompletedWorkout,
      getWorkoutSession,
    };
  })
);
