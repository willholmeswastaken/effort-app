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
  const startTime = performance.now();
  const { programId, dayId } = await params;
  const headersList = await headers();
  
  // Timing: Auth
  const authStart = performance.now();
  const session = await auth.api.getSession({ headers: headersList });
  const authEnd = performance.now();
  console.log(`[WorkoutPage] Auth: ${(authEnd - authStart).toFixed(2)}ms`);
  
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  // Create query client after auth check
  const queryClient = getQueryClient();

  // Timing: Start workout + get session (combined)
  const dbStart = performance.now();
  const result = await runEffect(
    pipe(
      Effect.gen(function* () {
        const workoutsService = yield* WorkoutsService;
        const userService = yield* UserService;
        
        // Timing: Get preferences
        const prefsStart = performance.now();
        const prefs = yield* userService.getPreferences(userId);
        const prefsEnd = performance.now();
        console.log(`[WorkoutPage] GetPreferences: ${(prefsEnd - prefsStart).toFixed(2)}ms`);
        
        // Timing: Start workout and get session (combined operation)
        const sessionStart = performance.now();
        const { workoutId, session: sessionData } = yield* workoutsService.startWorkoutAndGetSession({
          userId,
          programId,
          dayId,
          programInstanceId: prefs.activeProgramInstanceId,
        });
        const sessionEnd = performance.now();
        console.log(`[WorkoutPage] StartWorkoutAndGetSession: ${(sessionEnd - sessionStart).toFixed(2)}ms`);
        
        return { workoutId, sessionData };
      }),
      Effect.catchAll((e) => {
        console.error("Failed to start workout:", e);
        return Effect.succeed(null);
      })
    )
  );
  const dbEnd = performance.now();
  console.log(`[WorkoutPage] Total DB operations: ${(dbEnd - dbStart).toFixed(2)}ms`);
  
  if (!result) redirect("/");
  
  const { workoutId, sessionData } = result;

  // Timing: Last lifts prefetch (non-blocking, logged for observability)
  const lastLiftsStart = performance.now();
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
      ).then(result => {
        const lastLiftsEnd = performance.now();
        console.log(`[WorkoutPage] GetLastLifts (async): ${(lastLiftsEnd - lastLiftsStart).toFixed(2)}ms`);
        return result;
      })
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

  const endTime = performance.now();
  console.log(`[WorkoutPage] Total server render: ${(endTime - startTime).toFixed(2)}ms`);

  const dehydratedState = dehydrate(queryClient);
  return (
    <HydrationBoundary state={dehydratedState}>
      <WorkoutSessionClient workoutId={workoutId} />
    </HydrationBoundary>
  );
}
