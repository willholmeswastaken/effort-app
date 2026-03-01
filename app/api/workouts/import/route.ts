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

    if (!body.date || !body.exercises || !Array.isArray(body.exercises)) {
      return NextResponse.json(
        { error: "Missing required fields: date, exercises" },
        { status: 400 }
      );
    }

    await runEffect(
      Effect.gen(function* () {
        const service = yield* WorkoutsService;
        return yield* service.importExerciseData({
          userId: session.user.id,
          date: new Date(body.date),
          exercises: body.exercises,
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
