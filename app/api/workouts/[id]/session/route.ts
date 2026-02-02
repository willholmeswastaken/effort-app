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
          
          if (workout.exercises && workout.exercises.length > 0) {
            // Build a map of exerciseOrder -> logged exercise info
            const orderToExerciseMap = new Map<number, {
              id: string;
              name: string;
              targetSets: number;
              targetReps: string;
              restSeconds: number;
              videoUrl: string | null;
              thumbnailUrl: string | null;
              muscleGroupId: string | null;
            }>();
            
            for (const exercise of workout.exercises) {
              const exerciseOrder = exercise.exerciseOrder;
              if (exerciseOrder >= 0) {
                orderToExerciseMap.set(exerciseOrder, {
                  id: exercise.id,
                  name: exercise.name,
                  targetSets: exercise.targetSets,
                  targetReps: exercise.targetReps,
                  restSeconds: exercise.restSeconds,
                  videoUrl: exercise.videoUrl,
                  thumbnailUrl: exercise.thumbnailUrl,
                  muscleGroupId: null, // Will be filled from day.exercises
                });
              }
            }
            
            // Apply swaps
            exercises = day.exercises.map((originalExercise, index) => {
              const swappedExercise = orderToExerciseMap.get(index);
              if (swappedExercise && swappedExercise.id !== originalExercise.id) {
                // Preserve muscleGroupId from the original exercise position (it may have been swapped)
                return {
                  ...swappedExercise,
                  muscleGroupId: originalExercise.muscleGroupId,
                };
              }
              return originalExercise;
            });
          }

          // Build sets from exercises
          const sets = workout.exercises?.flatMap((exercise) =>
            exercise.sets.map((s) => ({
              exerciseId: exercise.id,
              setNumber: s.setNumber,
              reps: s.reps,
              weight: s.weight,
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
