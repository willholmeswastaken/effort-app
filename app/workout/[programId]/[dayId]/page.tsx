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
  
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  // Create query client after auth check (lighter weight)
  const queryClient = getQueryClient();

  // Phase 1: Start workout (required - creates workout log)
  const workoutId = await runEffect(
    pipe(
      Effect.gen(function* () {
        const workoutsService = yield* WorkoutsService;
        const userService = yield* UserService;
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
  
  if (!workoutId) redirect("/");

  // Phase 2: Fetch session data (must wait for workoutId)
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

  if (!sessionData) redirect("/");

  // Phase 3: Fetch last lifts in parallel (non-blocking for initial render)
  // Start fetching but don't await - let client handle it if needed
  const lastLiftsPromise = sessionData.exercises.length > 0
    ? runEffect(
        pipe(
          Effect.gen(function* () {
            const workoutsService = yield* WorkoutsService;
            const exerciseIds = sessionData.exercises.map(e => e.id);
            return yield* workoutsService.getLastLifts(userId, exerciseIds);
          }),
          Effect.catchAll((e) => {
            console.error("getLastLifts failed", e);
            return Effect.succeed(new Map());
          })
        )
      )
    : Promise.resolve(new Map());

  // Seed React Query cache with critical data (session)
  queryClient.setQueryData(
    workoutQueryKeys.session(workoutId), 
    sessionData, 
    { updatedAt: Date.now() }
  );

  // Prefetch last lifts (non-blocking)
  const exerciseIds = sessionData.exercises.map(e => e.id);
  queryClient.prefetchQuery({
    queryKey: workoutQueryKeys.lastLifts(exerciseIds),
    queryFn: () => lastLiftsPromise.then(data => Object.fromEntries(data)),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const dehydratedState = dehydrate(queryClient);
  return (
    <HydrationBoundary state={dehydratedState}>
      <WorkoutSessionClient workoutId={workoutId} />
    </HydrationBoundary>
  );
}
