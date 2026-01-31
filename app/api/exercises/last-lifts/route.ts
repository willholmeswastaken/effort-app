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
    const { exerciseIds } = body as { exerciseIds: string[] };

    if (!exerciseIds || !Array.isArray(exerciseIds)) {
      return NextResponse.json({ error: "Invalid exerciseIds" }, { status: 400 });
    }

    const lastLiftsMap = await runEffect(
      Effect.gen(function* () {
        const service = yield* WorkoutsService;
        return yield* service.getLastLifts(session.user.id, exerciseIds);
      })
    );

    // Convert Map to serializable object
    const lastLifts: Record<string, Array<{ date: string; sets: Array<{ setNumber: number; reps: number; weight: number }> }>> = {};
    for (const [exerciseId, entries] of lastLiftsMap.entries()) {
      lastLifts[exerciseId] = entries.map((e) => ({
        date: e.date.toISOString(),
        sets: e.sets,
      }));
    }

    return NextResponse.json(lastLifts);
  } catch (error) {
    console.error("Error fetching last lifts:", error);
    return NextResponse.json(
      { error: "Failed to fetch last lifts" },
      { status: 500 }
    );
  }
}
