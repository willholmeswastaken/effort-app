import { Context, Effect, Layer } from "effect";
import { eq, and, isNotNull, sql } from "drizzle-orm";
import { DatabaseService, type DrizzleDatabase } from "./Database";
import * as schema from "@/lib/db/schema";


export interface ProgramWithDays {
  id: string;
  name: string;
  description: string | null;
  daysPerWeek: number;
  weeks: Array<{
    id: string;
    weekNumber: number;
    days: Array<{
      id: string;
      title: string;
      dayOrder: number;
      exercises: Array<{
        id: string;
        name: string;
        targetSets: number | null;
        targetReps: string | null;
        restSeconds: number | null;
        videoUrl: string | null;
        thumbnailUrl: string | null;
      }>;
    }>;
  }>;
}

export interface ProgramWithMeta {
  id: string;
  name: string;
  description: string | null;
  daysPerWeek: number;
  weekCount: number;
}

export interface DayWithExercises {
  id: string;
  title: string;
  dayOrder: number;
  programId: string;
  programName: string;
  exercises: Array<{
    id: string;
    name: string;
    targetSets: number;
    targetReps: string;
    restSeconds: number;
    videoUrl: string | null;
    thumbnailUrl: string | null;
    muscleGroupId: string | null;
  }>;
}

export interface ProgramForHome {
  id: string;
  name: string;
  daysPerWeek: number;
  weeks: Array<{
    id: string;
    weekNumber: number;
    days: Array<{
      id: string;
      title: string;
      dayOrder: number;
      isCompleted: boolean;
      isInProgress: boolean;
      exerciseCount: number;
    }>;
  }>;
}


export interface ProgramsServiceInterface {
  readonly getAll: () => Effect.Effect<schema.Program[], Error>;
  readonly getAllWithMeta: () => Effect.Effect<ProgramWithMeta[], Error>;
  readonly getById: (id: string) => Effect.Effect<schema.Program | null, Error>;
  readonly getWithDays: (id: string) => Effect.Effect<ProgramWithDays | null, Error>;
  readonly getDayWithExercises: (programId: string, dayId: string) => Effect.Effect<DayWithExercises | null, Error>;
  readonly getProgramForHome: (programId: string, userId: string, programInstanceId?: string | null) => Effect.Effect<ProgramForHome | null, Error>;
  readonly createProgramInstance: (userId: string, programId: string) => Effect.Effect<string, Error>;
}


export class ProgramsService extends Context.Tag("ProgramsService")<
  ProgramsService,
  ProgramsServiceInterface
>() {}


export const ProgramsServiceLive = Layer.effect(
  ProgramsService,
  Effect.gen(function* () {
    const db = yield* DatabaseService;

    const getAll = (): Effect.Effect<schema.Program[], Error> =>
      Effect.tryPromise({
        try: () => db.select().from(schema.programs),
        catch: (e) => new Error(`Failed to fetch programs: ${e}`),
      });

    const getAllWithMeta = (): Effect.Effect<ProgramWithMeta[], Error> =>
      Effect.tryPromise({

        try: async () => {
          const programs = await db.query.programs.findMany({
            with: {
              weeks: {
                columns: { id: true },
              },
            },
          });

          return programs.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            daysPerWeek: p.daysPerWeek,
            weekCount: p.weeks.length,
          }));
        },
        catch: (e) => new Error(`Failed to fetch programs with meta: ${e}`),
      });

    const getById = (id: string): Effect.Effect<schema.Program | null, Error> =>
      Effect.tryPromise({
        try: async () => {
          const result = await db
            .select()
            .from(schema.programs)
            .where(eq(schema.programs.id, id));
          return result[0] ?? null;
        },
        catch: (e) => new Error(`Failed to fetch program ${id}: ${e}`),
      });

    const getWithDays = (id: string): Effect.Effect<ProgramWithDays | null, Error> =>
      Effect.tryPromise({
        try: async () => {
          const program = await db.query.programs.findFirst({
            where: eq(schema.programs.id, id),
            with: {
              weeks: {
                orderBy: (weeks, { asc }) => [asc(weeks.weekNumber)],
                with: {
                  days: {
                    orderBy: (days, { asc }) => [asc(days.dayOrder)],
                    with: {
                      dayExercises: {
                        orderBy: (de, { asc }) => [asc(de.exerciseOrder)],
                        with: {
                          exercise: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });

          if (!program) return null;

          return {
            ...program,
            weeks: program.weeks.map((week) => ({
              id: week.id,
              weekNumber: week.weekNumber,
              days: week.days.map((day) => ({
                id: day.id,
                title: day.title,
                dayOrder: day.dayOrder,
                exercises: day.dayExercises.map((de) => de.exercise),
              })),
            })),
          };
        },
        catch: (e) => new Error(`Failed to fetch program with days ${id}: ${e}`),
      });

    const getDayWithExercises = (programId: string, dayId: string): Effect.Effect<DayWithExercises | null, Error> =>
      Effect.tryPromise({
        try: async () => {
          const day = await db.query.workoutDays.findFirst({
            where: eq(schema.workoutDays.id, dayId),
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

          if (!day || day.week.program.id !== programId) return null;

          return {
            id: day.id,
            title: day.title,
            dayOrder: day.dayOrder,
            programId: day.week.program.id,
            programName: day.week.program.name,
            exercises: day.dayExercises.map((de) => ({
              id: de.exercise.id,
              name: de.exercise.name,
              targetSets: de.exercise.targetSets ?? 3,
              targetReps: de.exercise.targetReps ?? "8-12",
              restSeconds: de.exercise.restSeconds ?? 90,
              videoUrl: de.exercise.videoUrl,
              thumbnailUrl: de.exercise.thumbnailUrl,
              muscleGroupId: de.exercise.muscleGroupId ?? null,
            })),
          };
        },
        catch: (e) => new Error(`Failed to fetch day ${dayId}: ${e}`),
      });

    const getProgramForHome = (programId: string, userId: string, programInstanceId?: string | null): Effect.Effect<ProgramForHome | null, Error> =>
      Effect.tryPromise({
        try: async () => {
          const workoutLogsQuery = programInstanceId
            ? db
                .select({ 
                  dayId: schema.workoutLogs.dayId,
                  completedAt: schema.workoutLogs.completedAt,
                })
                .from(schema.workoutLogs)
                .where(
                  and(
                    eq(schema.workoutLogs.userId, userId),
                    eq(schema.workoutLogs.programId, programId),
                    eq(schema.workoutLogs.programInstanceId, programInstanceId)
                  )
                )
            : db
                .select({ 
                  dayId: schema.workoutLogs.dayId,
                  completedAt: schema.workoutLogs.completedAt,
                })
                .from(schema.workoutLogs)
                .where(
                  and(
                    eq(schema.workoutLogs.userId, userId),
                    eq(schema.workoutLogs.programId, programId)
                  )
                );

          const [program, workoutLogs] = await Promise.all([
            db.query.programs.findFirst({
              where: eq(schema.programs.id, programId),
              with: {
                weeks: {
                  orderBy: (weeks, { asc }) => [asc(weeks.weekNumber)],
                  with: {
                    days: {
                      orderBy: (days, { asc }) => [asc(days.dayOrder)],
                      with: {
                        dayExercises: {
                          columns: { id: true },
                        },
                      },
                    },
                  },
                },
              },
            }),
            workoutLogsQuery,
          ]);


          if (!program) return null;

          const completedDayIds = new Set<string>();
          const inProgressDayIds = new Set<string>();
          for (const log of workoutLogs) {
            if (log.completedAt !== null) {
              completedDayIds.add(log.dayId);
            } else {
              inProgressDayIds.add(log.dayId);
            }
          }

          return {
            id: program.id,
            name: program.name,
            daysPerWeek: program.daysPerWeek,
            weeks: program.weeks.map((week) => ({
              id: week.id,
              weekNumber: week.weekNumber,
              days: week.days.map((day) => ({
                id: day.id,
                title: day.title,
                dayOrder: day.dayOrder,
                isCompleted: completedDayIds.has(day.id),
                isInProgress: inProgressDayIds.has(day.id) && !completedDayIds.has(day.id),
                exerciseCount: day.dayExercises.length,
              })),
            })),
          };
        },
        catch: (e) => new Error(`Failed to fetch program for home: ${e}`),
      });

    const createProgramInstance = (userId: string, programId: string): Effect.Effect<string, Error> =>
      Effect.tryPromise({
        try: async () => {
          const newInstanceId = crypto.randomUUID();
          
          await db
            .update(schema.userPreferences)
            .set({ 
              activeProgramInstanceId: newInstanceId,
              updatedAt: new Date(),
            })
            .where(eq(schema.userPreferences.userId, userId));
          
          return newInstanceId;
        },
        catch: (e) => new Error(`Failed to create program instance: ${e}`),
      });

    return {
      getAll,
      getAllWithMeta,
      getById,
      getWithDays,
      getDayWithExercises,
      getProgramForHome,
      createProgramInstance,
    };
  })
);
