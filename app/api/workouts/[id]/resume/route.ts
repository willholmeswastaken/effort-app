import { NextRequest, NextResponse } from "next/server";
import { Effect } from "effect";
import { auth } from "@/lib/auth";
import { runEffect, WorkoutsService } from "@/lib/services";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await runEffect(
      Effect.gen(function* () {
        const service = yield* WorkoutsService;
        return yield* service.resumeWorkout(id, session.user.id);
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resuming workout:", error);
    return NextResponse.json(
      { error: "Failed to resume workout" },
      { status: 500 }
    );
  }
}
