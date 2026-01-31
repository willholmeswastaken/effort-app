import { redirect } from "next/navigation";
import { Effect, pipe } from "effect";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import { runEffect, WorkoutsService, UserService, ProgramsService } from "@/lib/services";
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

  if (!session?.user) {
    redirect("/login");
  }

  // Start or get existing workout
  const workoutId = await runEffect(
    pipe(
      Effect.gen(function* () {
        const workoutsService = yield* WorkoutsService;
        const userService = yield* UserService;

        // Get user preferences to get activeProgramInstanceId
        const prefs = yield* userService.getPreferences(session.user.id);

        // Start or get in-progress/completed workout
        const id = yield* workoutsService.startWorkout({
          userId: session.user.id,
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

  // Fetch workout session data directly from service layer and populate cache
  const queryClient = getQueryClient();
  
  const sessionData = await runEffect(
    Effect.gen(function* () {
      const workoutsService = yield* WorkoutsService;
      const programsService = yield* ProgramsService;
      return yield* workoutsService.getWorkoutSession(workoutId, programsService);
    })
  );

  if (sessionData) {
    queryClient.setQueryData(workoutQueryKeys.session(workoutId), sessionData, {
      updatedAt: Date.now(),
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WorkoutSessionClient workoutId={workoutId} />
    </HydrationBoundary>
  );
}
