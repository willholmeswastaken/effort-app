import { Context, Effect, Layer } from "effect";
import { eq, and, asc, inArray } from "drizzle-orm";
import { DatabaseService } from "./Database";
import * as schema from "@/lib/db/schema";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface AdminProgramSummary {
  id: string;
  name: string;
  description: string | null;
  daysPerWeek: number;
  weekCount: number;
  isSystem: boolean | null;
}

export interface AdminWeekDetail {
  id: string;
  programId: string;
  weekNumber: number;
  days: Array<{
    id: string;
    title: string;
    dayOrder: number;
    exercises: Array<{
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
    }>;
  }>;
}

export interface CreateProgramInput {
  name: string;
  description?: string;
  daysPerWeek: number;
  weekCount: number;
  dayTitles?: string[];
}

export interface UpdateProgramInput {
  name?: string;
  description?: string | null;
  daysPerWeek?: number;
}

export interface SaveDayExercise {
  exerciseId: string;
  exerciseOrder: number;
  targetSetsOverride?: number | null;
  targetRepsOverride?: string | null;
  restSecondsOverride?: number | null;
}

export interface SaveDay {
  id?: string;
  title: string;
  dayOrder: number;
  exercises: SaveDayExercise[];
}

export interface SaveWeekInput {
  days: SaveDay[];
}

// ─── Service Interface ──────────────────────────────────────────────────────────

export interface AdminServiceInterface {
  readonly getAllPrograms: () => Effect.Effect<AdminProgramSummary[], Error>;
  readonly createProgram: (input: CreateProgramInput) => Effect.Effect<string, Error>;
  readonly updateProgram: (id: string, input: UpdateProgramInput) => Effect.Effect<void, Error>;
  readonly deleteProgram: (id: string) => Effect.Effect<void, Error>;
  readonly getWeek: (weekId: string) => Effect.Effect<AdminWeekDetail | null, Error>;
  readonly saveWeek: (weekId: string, input: SaveWeekInput) => Effect.Effect<void, Error>;
  readonly saveAllWeeks: (weekId: string, input: SaveWeekInput) => Effect.Effect<void, Error>;
  readonly addDayExercise: (dayId: string, exerciseId: string, exerciseOrder: number, overrides?: { targetSets?: number | null; targetReps?: string | null; restSeconds?: number | null }) => Effect.Effect<string, Error>;
  readonly updateDayExercise: (dayExerciseId: string, overrides: { targetSetsOverride?: number | null; targetRepsOverride?: string | null; restSecondsOverride?: number | null }) => Effect.Effect<void, Error>;
  readonly removeDayExercise: (dayExerciseId: string) => Effect.Effect<void, Error>;
  readonly reorderDayExercises: (dayId: string, orderedIds: string[]) => Effect.Effect<void, Error>;
  readonly createExercise: (input: { id: string; name: string; muscleGroupId: string; targetSets: number; targetReps: string; restSeconds: number }) => Effect.Effect<string, Error>;
}

export class AdminService extends Context.Tag("AdminService")<
  AdminService,
  AdminServiceInterface
>() {}

// ─── Implementation ─────────────────────────────────────────────────────────────

export const AdminServiceLive = Layer.effect(
  AdminService,
  Effect.gen(function* () {
    const db = yield* DatabaseService;

    const getAllPrograms = (): Effect.Effect<AdminProgramSummary[], Error> =>
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
            isSystem: p.isSystem,
          }));
        },
        catch: (e) => new Error(`Failed to fetch programs: ${e}`),
      });

    const createProgram = (input: CreateProgramInput): Effect.Effect<string, Error> =>
      Effect.tryPromise({
        try: async () => {
          const programId = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

          await db.insert(schema.programs).values({
            id: programId,
            name: input.name,
            description: input.description ?? null,
            daysPerWeek: input.daysPerWeek,
            isSystem: true,
          });

          const defaultDayTitles = Array.from({ length: input.daysPerWeek }, (_, i) => `Day ${i + 1}`);
          const dayTitles = input.dayTitles ?? defaultDayTitles;

          for (let w = 1; w <= input.weekCount; w++) {
            const weekId = `${programId}-week-${w}`;
            await db.insert(schema.programWeeks).values({
              id: weekId,
              programId,
              weekNumber: w,
            });

            for (let d = 0; d < input.daysPerWeek; d++) {
              await db.insert(schema.workoutDays).values({
                weekId,
                title: dayTitles[d] ?? `Day ${d + 1}`,
                dayOrder: d + 1,
              });
            }
          }

          return programId;
        },
        catch: (e) => new Error(`Failed to create program: ${e}`),
      });

    const updateProgram = (id: string, input: UpdateProgramInput): Effect.Effect<void, Error> =>
      Effect.tryPromise({
        try: async () => {
          const updateData: Record<string, unknown> = {};
          if (input.name !== undefined) updateData.name = input.name;
          if (input.description !== undefined) updateData.description = input.description;
          if (input.daysPerWeek !== undefined) updateData.daysPerWeek = input.daysPerWeek;
          if (Object.keys(updateData).length > 0) {
            await db.update(schema.programs).set(updateData).where(eq(schema.programs.id, id));
          }
        },
        catch: (e) => new Error(`Failed to update program: ${e}`),
      });

    const deleteProgram = (id: string): Effect.Effect<void, Error> =>
      Effect.tryPromise({
        try: () => db.delete(schema.programs).where(eq(schema.programs.id, id)).then(() => undefined),
        catch: (e) => new Error(`Failed to delete program: ${e}`),
      });

    const getWeek = (weekId: string): Effect.Effect<AdminWeekDetail | null, Error> =>
      Effect.tryPromise({
        try: async () => {
          const week = await db.query.programWeeks.findFirst({
            where: eq(schema.programWeeks.id, weekId),
            with: {
              days: {
                orderBy: [asc(schema.workoutDays.dayOrder)],
                with: {
                  dayExercises: {
                    orderBy: [asc(schema.dayExercises.exerciseOrder)],
                    with: {
                      exercise: true,
                    },
                  },
                },
              },
            },
          });

          if (!week) return null;

          return {
            id: week.id,
            programId: week.programId,
            weekNumber: week.weekNumber,
            days: week.days.map((day) => ({
              id: day.id,
              title: day.title,
              dayOrder: day.dayOrder,
              exercises: day.dayExercises.map((de) => ({
                dayExerciseId: de.id,
                exerciseId: de.exerciseId,
                exerciseName: de.exercise.name,
                muscleGroupId: de.exercise.muscleGroupId,
                exerciseOrder: de.exerciseOrder,
                targetSets: de.targetSetsOverride ?? de.exercise.targetSets ?? 3,
                targetReps: de.targetRepsOverride ?? de.exercise.targetReps ?? "8-12",
                restSeconds: de.restSecondsOverride ?? de.exercise.restSeconds ?? 90,
                targetSetsOverride: de.targetSetsOverride,
                targetRepsOverride: de.targetRepsOverride,
                restSecondsOverride: de.restSecondsOverride,
              })),
            })),
          };
        },
        catch: (e) => new Error(`Failed to fetch week: ${e}`),
      });

    const addDayExercise = (
      dayId: string,
      exerciseId: string,
      exerciseOrder: number,
      overrides?: { targetSets?: number | null; targetReps?: string | null; restSeconds?: number | null }
    ): Effect.Effect<string, Error> =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .insert(schema.dayExercises)
            .values({
              dayId,
              exerciseId,
              exerciseOrder,
              targetSetsOverride: overrides?.targetSets,
              targetRepsOverride: overrides?.targetReps,
              restSecondsOverride: overrides?.restSeconds,
            })
            .returning({ id: schema.dayExercises.id });
          return row.id;
        },
        catch: (e) => new Error(`Failed to add exercise to day: ${e}`),
      });

    const updateDayExercise = (
      dayExerciseId: string,
      overrides: { targetSetsOverride?: number | null; targetRepsOverride?: string | null; restSecondsOverride?: number | null }
    ): Effect.Effect<void, Error> =>
      Effect.tryPromise({
        try: async () => {
          const updateData: Record<string, unknown> = {};
          if (overrides.targetSetsOverride !== undefined) updateData.targetSetsOverride = overrides.targetSetsOverride;
          if (overrides.targetRepsOverride !== undefined) updateData.targetRepsOverride = overrides.targetRepsOverride;
          if (overrides.restSecondsOverride !== undefined) updateData.restSecondsOverride = overrides.restSecondsOverride;
          if (Object.keys(updateData).length > 0) {
            await db.update(schema.dayExercises).set(updateData).where(eq(schema.dayExercises.id, dayExerciseId));
          }
        },
        catch: (e) => new Error(`Failed to update day exercise: ${e}`),
      });

    const removeDayExercise = (dayExerciseId: string): Effect.Effect<void, Error> =>
      Effect.tryPromise({
        try: () => db.delete(schema.dayExercises).where(eq(schema.dayExercises.id, dayExerciseId)).then(() => undefined),
        catch: (e) => new Error(`Failed to remove day exercise: ${e}`),
      });

    const reorderDayExercises = (dayId: string, orderedIds: string[]): Effect.Effect<void, Error> =>
      Effect.tryPromise({
        try: async () => {
          for (let i = 0; i < orderedIds.length; i++) {
            await db
              .update(schema.dayExercises)
              .set({ exerciseOrder: i + 1 })
              .where(
                and(
                  eq(schema.dayExercises.id, orderedIds[i]),
                  eq(schema.dayExercises.dayId, dayId)
                )
              );
          }
        },
        catch: (e) => new Error(`Failed to reorder exercises: ${e}`),
      });

    const saveAllWeeks = (weekId: string, input: SaveWeekInput): Effect.Effect<void, Error> =>
      Effect.tryPromise({
        try: async () => {
          // Find the program this week belongs to
          const week = await db.query.programWeeks.findFirst({
            where: eq(schema.programWeeks.id, weekId),
            columns: { programId: true },
          });
          if (!week) throw new Error("Week not found");

          // Get all weeks for this program
          const allWeeks = await db
            .select({ id: schema.programWeeks.id })
            .from(schema.programWeeks)
            .where(eq(schema.programWeeks.programId, week.programId))
            .orderBy(asc(schema.programWeeks.weekNumber));

          // Save to every week
          for (const w of allWeeks) {
            await _saveWeekDirect(w.id, input);
          }
        },
        catch: (e) => new Error(`Failed to save all weeks: ${e}`),
      });

    // Internal helper to save a week (used by saveWeek and saveAllWeeks)
    async function _saveWeekDirect(weekId: string, input: SaveWeekInput): Promise<void> {
      const existingDays = await db
        .select({ id: schema.workoutDays.id })
        .from(schema.workoutDays)
        .where(eq(schema.workoutDays.weekId, weekId));

      const existingDayIds = new Set(existingDays.map((d) => d.id));
      const inputDayIds = new Set(input.days.filter((d) => d.id).map((d) => d.id!));

      const daysToDelete = [...existingDayIds].filter((id) => !inputDayIds.has(id));
      if (daysToDelete.length > 0) {
        await db.delete(schema.workoutDays).where(inArray(schema.workoutDays.id, daysToDelete));
      }

      for (const day of input.days) {
        let dayId: string;

        if (day.id && existingDayIds.has(day.id)) {
          dayId = day.id;
          await db
            .update(schema.workoutDays)
            .set({ title: day.title, dayOrder: day.dayOrder })
            .where(eq(schema.workoutDays.id, dayId));
        } else {
          const [newDay] = await db
            .insert(schema.workoutDays)
            .values({ weekId, title: day.title, dayOrder: day.dayOrder })
            .returning({ id: schema.workoutDays.id });
          dayId = newDay.id;
        }

        await db.delete(schema.dayExercises).where(eq(schema.dayExercises.dayId, dayId));

        if (day.exercises.length > 0) {
          await db.insert(schema.dayExercises).values(
            day.exercises.map((ex) => ({
              dayId,
              exerciseId: ex.exerciseId,
              exerciseOrder: ex.exerciseOrder,
              targetSetsOverride: ex.targetSetsOverride,
              targetRepsOverride: ex.targetRepsOverride,
              restSecondsOverride: ex.restSecondsOverride,
            }))
          );
        }
      }
    }

    const createExercise = (input: { id: string; name: string; muscleGroupId: string; targetSets: number; targetReps: string; restSeconds: number }): Effect.Effect<string, Error> =>
      Effect.tryPromise({
        try: async () => {
          await db.insert(schema.exercises).values({
            id: input.id,
            name: input.name,
            muscleGroupId: input.muscleGroupId,
            targetSets: input.targetSets,
            targetReps: input.targetReps,
            restSeconds: input.restSeconds,
          });
          return input.id;
        },
        catch: (e) => new Error(`Failed to create exercise: ${e}`),
      });

    return {
      getAllPrograms,
      createProgram,
      updateProgram,
      deleteProgram,
      getWeek,
      saveWeek: (weekId, input) => Effect.tryPromise({ try: () => _saveWeekDirect(weekId, input), catch: (e) => new Error(`Failed to save week: ${e}`) }),
      saveAllWeeks,
      addDayExercise,
      updateDayExercise,
      removeDayExercise,
      reorderDayExercises,
      createExercise,
    };
  })
);
