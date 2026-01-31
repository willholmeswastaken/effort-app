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

  // Create query client after auth check
  const queryClient = getQueryClient();

  // Single combined operation: get preferences + start workout + get session
  // This reduces 3 round-trips to 2 round-trips
  const result = await runEffect(
    pipe(
      Effect.gen(function* () {
        const workoutsService = yield* WorkoutsService;
        const userService = yield* UserService;
        
        // Fetch preferences (required for startWorkout)
        const prefs = yield* userService.getPreferences(userId);
        
        // Combined: start workout AND get session data in one go
        // This eliminates one network round-trip vs calling startWorkout then getWorkoutSession
        const { workoutId, session: sessionData } = yield* workoutsService.startWorkoutAndGetSession({
          userId,
          programId,
          dayId,
          programInstanceId: prefs.activeProgramInstanceId,
        });
        
        return { workoutId, sessionData };
      }),
      Effect.catchAll((e) => {
        console.error("Failed to start workout:", e);
        return Effect.succeed(null);
      })
    )
  );
  
  if (!result) redirect("/");
  
  const { workoutId, sessionData } = result;

  // Prefetch last lifts in parallel (non-blocking for initial render)
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
