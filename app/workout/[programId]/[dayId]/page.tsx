import { redirect } from "next/navigation";
import { Effect, pipe } from "effect";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import { runEffect, WorkoutsService, UserService } from "@/lib/services";
import { getQueryClient } from "@/lib/get-query-client";
import { workoutQueryKeys } from "@/lib/queries/workout-session";
import { workoutKeys } from "@/lib/queries";
import { headers } from "next/headers";
import WorkoutSessionClient from "./client";

export const dynamic = "force-dynamic";

interface WorkoutPageProps {
  params: Promise<{
    programId: string;
    dayId: string;
  }>;
}

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  const { programId, dayId } = await params;

  const headersList = await headers();
  
  const [session, queryClient] = await Promise.all([
    auth.api.getSession({ headers: headersList }),
    Promise.resolve(getQueryClient())
  ]);

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const workoutId = await runEffect(
    pipe(
      Effect.gen(function* () {
        const workoutsService = yield* WorkoutsService;
        const userService = yield* UserService;

        const prefs = yield* userService.getPreferences(userId);

        const id = yield* workoutsService.startWorkout({
          userId,
          programId,
          dayId,
          programInstanceId: prefs.activeProgramInstanceId,
        });

        return id;
      }),
      Effect.catchAll((error) => {
        console.error("Failed to start workout:", error);
        return Effect.succeed(null);
      })
    )
  );

  if (!workoutId) {
    redirect("/");
  }

  const sessionData = await runEffect(
    pipe(
      Effect.gen(function* () {
        const workoutsService = yield* WorkoutsService;
        return yield* workoutsService.getWorkoutSession(workoutId);
      }),
      Effect.catchAll((error) => {
        console.error("Failed to hydrate workout session:", error);
        return Effect.succeed(null);
      })
    )
  );

  if (sessionData) {
    queryClient.setQueryData(workoutQueryKeys.session(workoutId), sessionData, {
      updatedAt: Date.now(),
    });

    const exerciseIds = sessionData.exercises.map(e => e.id);
    
    if (exerciseIds.length > 0) {
      const lastLiftsData = await runEffect(
        Effect.gen(function* () {
          const workoutsService = yield* WorkoutsService;
          return yield* workoutsService.getLastLifts(userId, exerciseIds);
        })
      );
      
      const lastLiftsObject = Object.fromEntries(lastLiftsData);
      queryClient.setQueryData(workoutKeys.lastLifts(exerciseIds), lastLiftsObject, {
        updatedAt: Date.now(),
      });
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WorkoutSessionClient workoutId={workoutId} />
    </HydrationBoundary>
  );
}
