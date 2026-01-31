import { NextRequest, NextResponse } from "next/server";
import { Effect } from "effect";
import { auth } from "@/lib/auth";
import { runEffect, WorkoutsService, type UpsertSetInput } from "@/lib/services";

// Upsert a set (real-time saving)
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as UpsertSetInput;

    if (!body.workoutLogId || !body.exerciseId || body.setNumber === undefined) {
      return NextResponse.json(
        { error: "workoutLogId, exerciseId, and setNumber are required" },
        { status: 400 }
      );
    }

    await runEffect(
      Effect.gen(function* () {
        const service = yield* WorkoutsService;
        return yield* service.upsertSet({ ...body, userId: session.user.id });
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error upserting set:", error);
    return NextResponse.json(
      { error: "Failed to save set" },
      { status: 500 }
    );
  }
}
