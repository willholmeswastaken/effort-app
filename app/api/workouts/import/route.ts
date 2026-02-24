import { NextRequest, NextResponse } from "next/server";
import { Effect } from "effect";
import { auth } from "@/lib/auth";
import { runEffect, WorkoutsService } from "@/lib/services";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.exerciseId || !body.exerciseName || !body.date || !body.sets || !Array.isArray(body.sets)) {
      return NextResponse.json(
        { error: "Missing required fields: exerciseId, exerciseName, date, sets" },
        { status: 400 }
      );
    }

    await runEffect(
      Effect.gen(function* () {
        const service = yield* WorkoutsService;
        return yield* service.importExerciseData({
          userId: session.user.id,
          exerciseId: body.exerciseId,
          exerciseName: body.exerciseName,
          date: new Date(body.date),
          sets: body.sets,
        });
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error importing exercise data:", error);
    return NextResponse.json(
      { error: "Failed to import exercise data" },
      { status: 500 }
    );
  }
}
