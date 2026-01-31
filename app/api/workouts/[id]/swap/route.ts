import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { runEffect, WorkoutsService } from "@/lib/services";
import { Effect, pipe } from "effect";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workoutLogId } = await context.params;
    const body = await request.json();
    const { exerciseOrder, newExerciseId, newExerciseName } = body;

    if (exerciseOrder === undefined || !newExerciseId || !newExerciseName) {
      return NextResponse.json(
        { error: "exerciseOrder, newExerciseId, and newExerciseName are required" },
        { status: 400 }
      );
    }

    await runEffect(
      pipe(
        Effect.gen(function* () {
          const workoutsService = yield* WorkoutsService;
          yield* workoutsService.swapExercise({
            workoutLogId,
            exerciseOrder,
            newExerciseId,
            newExerciseName,
          });
        }),
        Effect.catchAll((error) => {
          console.error("Failed to swap exercise:", error);
          return Effect.fail(error);
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error swapping exercise:", error);
    return NextResponse.json(
      { error: "Failed to swap exercise" },
      { status: 500 }
    );
  }
}
