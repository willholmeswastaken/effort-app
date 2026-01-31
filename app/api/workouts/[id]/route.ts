import { NextRequest, NextResponse } from "next/server";
import { Effect } from "effect";
import { auth } from "@/lib/auth";
import { runEffect, WorkoutsService } from "@/lib/services";

// Complete a workout
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { durationSeconds, rating } = body as {
      durationSeconds: number;
      rating: number;
    };

    await runEffect(
      Effect.gen(function* () {
        const service = yield* WorkoutsService;
        return yield* service.completeWorkout({
          workoutLogId: id,
          durationSeconds,
          rating,
          userId: session.user.id,
        });
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing workout:", error);
    return NextResponse.json(
      { error: "Failed to complete workout" },
      { status: 500 }
    );
  }
}

// Get single workout
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const workout = await runEffect(
      Effect.gen(function* () {
        const service = yield* WorkoutsService;
        return yield* service.getWorkoutById(id);
      })
    );

    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    return NextResponse.json(workout);
  } catch (error) {
    console.error("Error fetching workout:", error);
    return NextResponse.json(
      { error: "Failed to fetch workout" },
      { status: 500 }
    );
  }
}
