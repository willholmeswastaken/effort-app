import { NextRequest, NextResponse } from "next/server";
import { Effect } from "effect";
import { auth } from "@/lib/auth";
import { runEffect, WorkoutsService, type StartWorkoutInput } from "@/lib/services";

// Start a new workout
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { programId, dayId } = body as { programId: string; dayId: string };

    if (!programId || !dayId) {
      return NextResponse.json(
        { error: "programId and dayId are required" },
        { status: 400 }
      );
    }

    const workoutId = await runEffect(
      Effect.gen(function* () {
        const service = yield* WorkoutsService;
        return yield* service.startWorkout({
          userId: session.user.id,
          programId,
          dayId,
        });
      })
    );

    return NextResponse.json({ id: workoutId });
  } catch (error) {
    console.error("Error starting workout:", error);
    return NextResponse.json(
      { error: "Failed to start workout" },
      { status: 500 }
    );
  }
}

// Get workout history
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);

    const history = await runEffect(
      Effect.gen(function* () {
        const service = yield* WorkoutsService;
        return yield* service.getHistory(session.user.id, limit);
      })
    );

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching workout history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
