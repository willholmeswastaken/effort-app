import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { runEffect, WorkoutsService, ProgramsService } from "@/lib/services";
import { Effect, pipe } from "effect";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workoutId } = await context.params;

    const result = await runEffect(
      pipe(
        Effect.gen(function* () {
          const workoutsService = yield* WorkoutsService;
          const programsService = yield* ProgramsService;

          const workout = yield* workoutsService.getWorkoutById(workoutId);
          if (!workout) {
            return { error: "Workout not found" };
          }

          // Get day exercises
          const day = yield* programsService.getDayWithExercises(workout.programId, workout.dayId);
          if (!day) {
            return { error: "Day not found" };
          }

          // Build exercises list with swaps applied
          let exercises = day.exercises;
          
          if (workout.exerciseLogs && workout.exerciseLogs.length > 0) {
            // Build a map of exerciseOrder -> logged exercise info
            const orderToExerciseMap = new Map<number, {
              id: string;
              name: string;
              targetSets: number;
              targetReps: string;
              restSeconds: number;
              videoUrl: string | null;
              thumbnailUrl: string | null;
            }>();
            
            for (const exLog of workout.exerciseLogs) {
              const exerciseOrder = exLog.exerciseOrder;
              if (exerciseOrder >= 0) {
                orderToExerciseMap.set(exerciseOrder, {
                  id: exLog.exerciseId,
                  name: exLog.exerciseName,
                  targetSets: exLog.targetSets,
                  targetReps: exLog.targetReps,
                  restSeconds: exLog.restSeconds,
                  videoUrl: exLog.videoUrl,
                  thumbnailUrl: exLog.thumbnailUrl,
                });
              }
            }
            
            // Apply swaps
            exercises = day.exercises.map((originalExercise, index) => {
              const swappedExercise = orderToExerciseMap.get(index);
              if (swappedExercise && swappedExercise.id !== originalExercise.id) {
                return swappedExercise;
              }
              return originalExercise;
            });
          }

          // Build sets from exerciseLogs
          const sets = workout.exerciseLogs?.flatMap((exLog) =>
            exLog.setLogs.map((sLog) => ({
              exerciseId: exLog.exerciseId,
              setNumber: sLog.setNumber,
              reps: sLog.reps,
              weight: sLog.weight,
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
        }),
        Effect.catchAll((error) => {
          console.error("Failed to fetch workout session:", error);
          return Effect.succeed({ error: "Failed to fetch workout session" });
        })
      )
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching workout session:", error);
    return NextResponse.json(
      { error: "Failed to fetch workout session" },
      { status: 500 }
    );
  }
}
