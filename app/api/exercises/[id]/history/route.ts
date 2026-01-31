import { NextRequest, NextResponse } from "next/server";
import { Effect } from "effect";
import { auth } from "@/lib/auth";
import { runEffect, WorkoutsService } from "@/lib/services";

// Get exercise history for a specific exercise
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: exerciseId } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "10", 10);

    const history = await runEffect(
      Effect.gen(function* () {
        const service = yield* WorkoutsService;
        return yield* service.getExerciseHistory(session.user.id, exerciseId, limit);
      })
    );

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching exercise history:", error);
    return NextResponse.json(
      { error: "Failed to fetch exercise history" },
      { status: 500 }
    );
  }
}
