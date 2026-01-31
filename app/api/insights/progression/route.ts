import { NextRequest, NextResponse } from "next/server";
import { Effect } from "effect";
import { auth } from "@/lib/auth";
import { runEffect, InsightsService } from "@/lib/services";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const exerciseId = searchParams.get("exerciseId");
    const days = parseInt(searchParams.get("days") || "90", 10);

    if (!exerciseId) {
      return NextResponse.json(
        { error: "exerciseId is required" },
        { status: 400 }
      );
    }

    const progression = await runEffect(
      Effect.gen(function* () {
        const service = yield* InsightsService;
        return yield* service.getExerciseProgression(
          session.user.id,
          exerciseId,
          days
        );
      })
    );

    return NextResponse.json(progression);
  } catch (error) {
    console.error("Error fetching exercise progression:", error);
    return NextResponse.json(
      { error: "Failed to fetch progression" },
      { status: 500 }
    );
  }
}
