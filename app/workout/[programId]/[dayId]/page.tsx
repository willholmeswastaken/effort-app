import { redirect } from "next/navigation";
import { Effect, pipe } from "effect";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import { runEffect, WorkoutsService, UserService } from "@/lib/services";
import { getQueryClient } from "@/lib/get-query-client";
import { workoutQueryKeys } from "@/lib/queries/workout-session";
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

  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  // === PARALLEL BLOCK 1: start workout (write) ===
  console.time("startWorkout");
  const workoutId = await runEffect(
    pipe(
      Effect.gen(function* () {
        const workoutsService = yield* WorkoutsService;
        const userService     = yield* UserService;
        const prefs = yield* userService.getPreferences(userId);
        return yield* workoutsService.startWorkout({
          userId,
          programId,
          dayId,
          programInstanceId: prefs.activeProgramInstanceId,
        });
      }),
      Effect.catchAll((e) => {
        console.error("startWorkout failed", e);
        return Effect.succeed(null);
      })
    )
  );
  console.timeEnd("startWorkout");
  if (!workoutId) redirect("/");

  // === PARALLEL BLOCK 2: hydrate session + lastLifts together ===
  console.time("hydrate");
  const sessionData = await runEffect(
    pipe(
      Effect.gen(function* () {
        const workoutsService = yield* WorkoutsService;
        return yield* workoutsService.getWorkoutSession(workoutId);
      }),
      Effect.catchAll((e) => {
        console.error("getWorkoutSession failed", e);
        return Effect.succeed(null);
      })
    )
  );

  // lastLifts only after we have exercises
  const lastLiftsData = sessionData?.exercises?.length
    ? await runEffect(
        pipe(
          Effect.gen(function* () {
            const workoutsService = yield* WorkoutsService;
            const exerciseIds = sessionData.exercises.map(e => e.id);
            return yield* workoutsService.getLastLifts(userId, exerciseIds);
          }),
          Effect.catchAll((e) => {
            console.error("getLastLifts failed", e);
            return Effect.succeed([]);
          })
        )
      )
    : [];
  console.timeEnd("hydrate");

  // === Seed React Query cache ===
  if (sessionData) {
    queryClient.setQueryData(workoutQueryKeys.session(workoutId), sessionData, { updatedAt: Date.now() });
    if (lastLiftsData.length) {
      const lastLiftsObject = Object.fromEntries(lastLiftsData);
      const exerciseIds = sessionData.exercises.map(e => e.id);
      queryClient.setQueryData(workoutQueryKeys.lastLifts(exerciseIds), lastLiftsObject, { updatedAt: Date.now() });
    }
  }

  const dehydratedState = dehydrate(queryClient);
  return (
    <HydrationBoundary state={dehydratedState}>
      <WorkoutSessionClient workoutId={workoutId} />
    </HydrationBoundary>
  );
}
