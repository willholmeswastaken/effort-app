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
  sets: Array<{
    setNumber: number;
    reps: number;
    weight: string;
  }>;
}

export interface LastLiftEntry {
  date: Date;
  sets: Array<{ setNumber: number; reps: number; weight: number }>;
}


export interface InProgressWorkout {
  id: string;
  startedAt: Date;
  sets: Array<{
    exerciseId: string;
    setNumber: number;
    reps: number;
    weight: string;
  }>;
  status: "active" | "paused";
  lastPausedAt: Date | null;
  accumulatedPauseSeconds: number;
  isCompleted: boolean;
  completedAt: Date | null;
  durationSeconds: number | null;
  rating: number | null;
}

export interface CompletedWorkout {
  id: string;
  startedAt: Date;
  completedAt: Date;
  durationSeconds: number;
  rating: number | null;
  exercises: Array<{
    id: string;
    name: string;
    targetSets: number;
    targetReps: string;
    restSeconds: number;
    videoUrl: string | null;
    thumbnailUrl: string | null;
    setLogs: Array<{
      setNumber: number;
      reps: number;
      weight: string;
    }>;
  }>;
}

export interface WorkoutDetail {
  id: string;
  programId: string;
  dayId: string;
  userId: string;
  startedAt: Date;
  completedAt: Date | null;
  status: "active" | "paused" | "completed";
  lastPausedAt: Date | null;
  accumulatedPauseSeconds: number;
  durationSeconds: number | null;
  rating: number | null;
  day: {
    id: string;
    title: string;
  };
  exerciseLogs: Array<{
    id: string;
    exerciseId: string;
    exerciseName: string;
    exerciseOrder: number;
    targetSets: number;
    targetReps: string;
    restSeconds: number;
    videoUrl: string | null;
    thumbnailUrl: string | null;
    setLogs: Array<{
      setNumber: number;
      reps: number;
      weight: string;
    }>;
  }>;
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

export interface WorkoutsServiceInterface {
  readonly startWorkout: (input: StartWorkoutInput) => Effect.Effect<string, Error>;
  readonly upsertSet: (input: UpsertSetInput & { userId: string }) => Effect.Effect<void, Error>;
  readonly pauseWorkout: (workoutLogId: string, userId: string) => Effect.Effect<void, Error>;
  readonly resumeWorkout: (workoutLogId: string, userId: string) => Effect.Effect<void, Error>;
  readonly resetWorkout: (workoutLogId: string, userId: string) => Effect.Effect<{ programId: string; dayId: string }, Error>;
  readonly deleteWorkout: (workoutLogId: string, userId: string) => Effect.Effect<void, Error>;
  readonly completeWorkout: (input: CompleteWorkoutInput & { userId: string }) => Effect.Effect<void, Error>;
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
  readonly getWorkoutSession: (
    workoutId: string,
    programsService: { getDayWithExercises: (programId: string, dayId: string) => Effect.Effect<{ id: string; title: string; programName: string; exercises: WorkoutSessionExercise[] } | null, Error> }
  ) => Effect.Effect<WorkoutSessionData | null, Error>;
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
            const [newLog] = await db
              .insert(schema.exerciseLogs)
              .values({
                workoutLogId: input.workoutLogId,
                exerciseId: input.exerciseId,
                exerciseName: input.exerciseName,
                exerciseOrder: input.exerciseOrder,
              })
              .returning();
            exerciseLog = newLog;
          }

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

    const resumeWorkout = (workoutLogId: string, userId: string): Effect.Effect<void, Error> =>
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
            return;
          }

          const pauseDuration = Math.round(
            (new Date().getTime() - workout.lastPausedAt.getTime()) / 1000
          );

          await db
            .update(schema.workoutLogs)
            .set({
              status: "active",
              lastPausedAt: null,
              accumulatedPauseSeconds: (workout.accumulatedPauseSeconds || 0) + pauseDuration,
            })
            .where(eq(schema.workoutLogs.id, workoutLogId));
        },
        catch: (e) => new Error(`Failed to resume workout: ${e}`),
      });

    const resetWorkout = (workoutLogId: string, userId: string): Effect.Effect<{ programId: string; dayId: string }, Error> =>
      Effect.tryPromise({
        try: async () => {
          const [updatedLog] = await db
            .update(schema.workoutLogs)
            .set({
              startedAt: new Date(),
              status: "active",
              lastPausedAt: null,
              accumulatedPauseSeconds: 0,
              completedAt: null,
            })
            .where(and(
              eq(schema.workoutLogs.id, workoutLogId),
              eq(schema.workoutLogs.userId, userId)
            ))
            .returning({
              programId: schema.workoutLogs.programId,
              dayId: schema.workoutLogs.dayId,
            });

          if (!updatedLog) {
            throw new Error("Workout not found or unauthorized");
          }

          const exerciseLogs = await db.query.exerciseLogs.findMany({
            where: eq(schema.exerciseLogs.workoutLogId, workoutLogId),
            columns: { id: true },
          });

          if (exerciseLogs.length > 0) {
            const exerciseLogIds = exerciseLogs.map((log) => log.id);
            await db.delete(schema.setLogs).where(inArray(schema.setLogs.exerciseLogId, exerciseLogIds));
            await db.delete(schema.exerciseLogs).where(inArray(schema.exerciseLogs.id, exerciseLogIds));
          }

          return updatedLog;
        },
        catch: (e) => new Error(`Failed to reset workout: ${e}`),
      });

    const deleteWorkout = (workoutLogId: string, userId: string): Effect.Effect<void, Error> =>
      Effect.tryPromise({

        try: async () => {
          const exerciseLogs = await db.query.exerciseLogs.findMany({
            where: eq(schema.exerciseLogs.workoutLogId, workoutLogId),
            columns: { id: true },
          });

          if (exerciseLogs.length > 0) {
            const exerciseLogIds = exerciseLogs.map((log) => log.id);
            await db.delete(schema.setLogs).where(inArray(schema.setLogs.exerciseLogId, exerciseLogIds));
            await db.delete(schema.exerciseLogs).where(inArray(schema.exerciseLogs.id, exerciseLogIds));
          }


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
              status: "completed",
              durationSeconds: input.durationSeconds,
              rating: input.rating,
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

    const swapExercise = (input: SwapExerciseInput): Effect.Effect<void, Error> =>
      Effect.tryPromise({
        try: async () => {
          await db.delete(schema.exerciseLogs)
            .where(and(
              eq(schema.exerciseLogs.workoutLogId, input.workoutLogId),
              eq(schema.exerciseLogs.exerciseOrder, input.exerciseOrder)
            ));

          await db.insert(schema.exerciseLogs).values({
            workoutLogId: input.workoutLogId,
            exerciseId: input.newExerciseId,
            exerciseName: input.newExerciseName,
            exerciseOrder: input.exerciseOrder,
          });
        },
        catch: (e) => new Error(`Failed to swap exercise: ${e}`),
      });

    const getHistory = (
      userId: string,
      limit: number = 50
    ): Effect.Effect<WorkoutHistoryEntry[], Error> =>
      Effect.tryPromise({
        try: async () => {
          const logs = await db.query.workoutLogs.findMany({
            where: eq(schema.workoutLogs.userId, userId),
            orderBy: [desc(schema.workoutLogs.startedAt)],
            limit,
            with: {
              day: true,
              exerciseLogs: true,
            },
          });

          return logs.map((log) => ({
            id: log.id,
            programId: log.programId,
            dayId: log.dayId,
            dayTitle: log.day.title,
            startedAt: log.startedAt,
            completedAt: log.completedAt,
            durationSeconds: log.durationSeconds,
            rating: log.rating,
            exerciseCount: log.exerciseLogs.length,
          }));
        },
        catch: (e) => new Error(`Failed to fetch workout history: ${e}`),
      });

    const getWorkoutById = (id: string): Effect.Effect<WorkoutDetail | null, Error> =>
      Effect.tryPromise({
        try: async () => {
          const log = await db.query.workoutLogs.findFirst({
            where: eq(schema.workoutLogs.id, id),
            with: {
              day: true,
              exerciseLogs: {
                with: {
                  exercise: true,
                  setLogs: {
                    orderBy: (setLogs, { asc }) => [asc(setLogs.setNumber)],
                  },
                },
              },
            },
          });
          if (!log) return null;
          
          return {
            id: log.id,
            programId: log.programId,
            dayId: log.dayId,
            userId: log.userId,
            startedAt: log.startedAt,
            completedAt: log.completedAt,
            status: log.status,
            lastPausedAt: log.lastPausedAt,
            accumulatedPauseSeconds: log.accumulatedPauseSeconds,
            durationSeconds: log.durationSeconds,
            rating: log.rating,
            day: {
              id: log.day.id,
              title: log.day.title,
            },
            exerciseLogs: log.exerciseLogs.map((exLog) => ({
              id: exLog.id,
              exerciseId: exLog.exerciseId,
              exerciseName: exLog.exercise.name,
              exerciseOrder: exLog.exerciseOrder,
              targetSets: exLog.exercise.targetSets ?? 3,
              targetReps: exLog.exercise.targetReps ?? "8-12",
              restSeconds: exLog.exercise.restSeconds ?? 90,
              videoUrl: exLog.exercise.videoUrl,
              thumbnailUrl: exLog.exercise.thumbnailUrl,
              setLogs: exLog.setLogs.map((setLog) => ({
                setNumber: setLog.setNumber,
                reps: setLog.reps,
                weight: setLog.weight.toString(),
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
          const logs = await db.query.workoutLogs.findMany({
            where: eq(schema.workoutLogs.userId, userId),
            orderBy: [desc(schema.workoutLogs.startedAt)],
            limit,
            with: {
              exerciseLogs: {
                where: eq(schema.exerciseLogs.exerciseId, exerciseId),
                with: {
                  setLogs: {
                    orderBy: (sets, { asc }) => [asc(sets.setNumber)],
                  },
                },
              },
            },
          });

          return logs
            .filter((log) => log.exerciseLogs.length > 0)
            .map((log) => ({
              workoutDate: log.startedAt,
              sets: log.exerciseLogs[0].setLogs.map((set) => ({
                setNumber: set.setNumber,
                reps: set.reps,
                weight: set.weight,
              })),
            }));
        },
        catch: (e) => new Error(`Failed to fetch exercise history: ${e}`),
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
              eq(schema.workoutLogs.dayId, dayId)
            ),
            orderBy: [desc(schema.workoutLogs.startedAt)],
            with: {
              exerciseLogs: {
                with: {
                  setLogs: true,
                },
              },
            },
          });


          if (!workout) return null;

          const sets = workout.exerciseLogs.flatMap((exLog) =>
            exLog.setLogs.map((setLog) => ({
              exerciseId: exLog.exerciseId,
              setNumber: setLog.setNumber,
              reps: setLog.reps,
              weight: setLog.weight.toString(),
            }))
          );

          return {
            id: workout.id,
            startedAt: workout.startedAt,
            sets,
            status: workout.status as "active" | "paused",
            lastPausedAt: workout.lastPausedAt,
            accumulatedPauseSeconds: workout.accumulatedPauseSeconds,
            isCompleted: workout.completedAt !== null,
            completedAt: workout.completedAt,
            durationSeconds: workout.durationSeconds,
            rating: workout.rating,
          };
        },
        catch: (e) => new Error(`Failed to fetch most recent workout: ${e}`),
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

    const getWorkoutSession = (
      workoutId: string,
      programsService: { getDayWithExercises: (programId: string, dayId: string) => Effect.Effect<{ id: string; title: string; programName: string; exercises: WorkoutSessionExercise[] } | null, Error> }
    ): Effect.Effect<WorkoutSessionData | null, Error> =>
      Effect.tryPromise({
        try: async () => {
          const workout = await db.query.workoutLogs.findFirst({
            where: eq(schema.workoutLogs.id, workoutId),
            with: {
              day: true,
              exerciseLogs: {
                with: {
                  exercise: true,
                  setLogs: {
                    orderBy: (setLogs, { asc }) => [asc(setLogs.setNumber)],
                  },
                },
              },
            },
          });

          if (!workout) return null;

          const day = await Effect.runPromise(programsService.getDayWithExercises(workout.programId, workout.dayId));
          if (!day) return null;

          let exercises = day.exercises;

          if (workout.exerciseLogs && workout.exerciseLogs.length > 0) {
            const orderToExerciseMap = new Map<number, WorkoutSessionExercise>();

            for (const exLog of workout.exerciseLogs) {
              const exerciseOrder = exLog.exerciseOrder;
              if (exerciseOrder >= 0) {
                orderToExerciseMap.set(exerciseOrder, {
                  id: exLog.exerciseId,
                  name: exLog.exerciseName,
                  targetSets: exLog.exercise.targetSets ?? 3,
                  targetReps: exLog.exercise.targetReps ?? "8-12",
                  restSeconds: exLog.exercise.restSeconds ?? 90,
                  videoUrl: exLog.exercise.videoUrl,
                  thumbnailUrl: exLog.exercise.thumbnailUrl,
                });
              }
            }

            exercises = day.exercises.map((originalExercise, index) => {
              const swappedExercise = orderToExerciseMap.get(index);
              if (swappedExercise && swappedExercise.id !== originalExercise.id) {
                return swappedExercise;
              }
              return originalExercise;
            });
          }

          const sets = workout.exerciseLogs?.flatMap((exLog) =>
            exLog.setLogs.map((sLog) => ({
              exerciseId: exLog.exerciseId,
              setNumber: sLog.setNumber,
              reps: sLog.reps,
              weight: sLog.weight.toString(),
            }))
          ) ?? [];

          return {
            workout: {
              id: workout.id,
              programId: workout.programId,
              dayId: workout.dayId,
              dayTitle: day.title,
              programName: day.programName,
              startedAt: workout.startedAt.toISOString(),
              completedAt: workout.completedAt?.toISOString() ?? null,
              status: workout.status,
              lastPausedAt: workout.lastPausedAt?.toISOString() ?? null,
              accumulatedPauseSeconds: workout.accumulatedPauseSeconds,
              durationSeconds: workout.durationSeconds,
              rating: workout.rating,
            },
            exercises,
            sets,
          };
        },
        catch: (e) => new Error(`Failed to fetch workout session: ${e}`),
      });

    return {
      startWorkout,
      upsertSet,
      pauseWorkout,
      resumeWorkout,
      resetWorkout,
      deleteWorkout,
      completeWorkout,
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
