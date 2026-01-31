import { Context, Effect, Layer } from "effect";
import { eq, sql, desc, and, gte } from "drizzle-orm";
import { DatabaseService } from "./Database";
import * as schema from "@/lib/db/schema";

export interface InsightsSummary {
  totalWorkouts: number;
  thisWeekWorkouts: number;
  totalTimeSeconds: number;
  totalVolume: number;
  totalSets: number;
  averageRating: number | null;
}

export interface ExerciseProgressionPoint {
  date: Date;
  maxWeight: number;
}

export interface InsightsServiceInterface {
  readonly getSummary: (userId: string) => Effect.Effect<InsightsSummary, Error>;
  readonly getExerciseProgression: (
    userId: string,
    exerciseId: string,
    days?: number
  ) => Effect.Effect<ExerciseProgressionPoint[], Error>;
}

export class InsightsService extends Context.Tag("InsightsService")<
  InsightsService,
  InsightsServiceInterface
>() {}

export const InsightsServiceLive = Layer.effect(
  InsightsService,
  Effect.gen(function* () {
    const db = yield* DatabaseService;

    const getSummary = (userId: string): Effect.Effect<InsightsSummary, Error> =>
      Effect.tryPromise({
        try: async () => {
          const workouts = await db.query.workoutLogs.findMany({
            where: and(
              eq(schema.workoutLogs.userId, userId),
              sql`${schema.workoutLogs.completedAt} IS NOT NULL`
            ),
            with: {
              exerciseLogs: {
                with: {
                  setLogs: true,
                },
              },
            },
          });

          const totalWorkouts = workouts.length;

          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const thisWeekWorkouts = workouts.filter(
            (w) => w.startedAt >= weekAgo
          ).length;

          const totalTimeSeconds = workouts.reduce(
            (sum, w) => sum + (w.durationSeconds ?? 0),
            0
          );

          let totalVolume = 0;
          let totalSets = 0;
          for (const workout of workouts) {
            for (const exLog of workout.exerciseLogs) {
              for (const set of exLog.setLogs) {
                totalSets++;
                totalVolume += set.reps * parseFloat(set.weight);
              }
            }
          }

          const ratedWorkouts = workouts.filter((w) => w.rating !== null);
          const averageRating =
            ratedWorkouts.length > 0
              ? ratedWorkouts.reduce((sum, w) => sum + (w.rating ?? 0), 0) /
                ratedWorkouts.length
              : null;

          return {
            totalWorkouts,
            thisWeekWorkouts,
            totalTimeSeconds,
            totalVolume: Math.round(totalVolume),
            totalSets,
            averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
          };
        },
        catch: (e) => new Error(`Failed to fetch insights summary: ${e}`),
      });

    const getExerciseProgression = (
      userId: string,
      exerciseId: string,
      days: number = 90
    ): Effect.Effect<ExerciseProgressionPoint[], Error> =>
      Effect.tryPromise({
        try: async () => {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);

          const workouts = await db.query.workoutLogs.findMany({
            where: and(
              eq(schema.workoutLogs.userId, userId),
              gte(schema.workoutLogs.startedAt, startDate)
            ),
            orderBy: [desc(schema.workoutLogs.startedAt)],
            with: {
              exerciseLogs: {
                where: eq(schema.exerciseLogs.exerciseId, exerciseId),
                with: {
                  setLogs: true,
                },
              },
            },
          });

          return workouts
            .filter((w) => w.exerciseLogs.length > 0)
            .map((w) => {
              const maxWeight = Math.max(
                ...w.exerciseLogs[0].setLogs.map((s) => parseFloat(s.weight))
              );
              return {
                date: w.startedAt,
                maxWeight,
              };
            })
            .reverse();
        },
        catch: (e) => new Error(`Failed to fetch exercise progression: ${e}`),
      });

    return {
      getSummary,
      getExerciseProgression,
    };
  })
);
