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
          const session = yield* workoutsService.getWorkoutSession(workoutId);
          if (!session) {
            return { error: "Workout not found" };
          }
          return session;
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
