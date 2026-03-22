import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { runEffect, AdminService } from "@/lib/services";
import { Effect } from "effect";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ dayId: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { dayId } = await params;
  const body = await req.json();

  const dayExerciseId = await runEffect(
    Effect.gen(function* () {
      const admin = yield* AdminService;
      return yield* admin.addDayExercise(
        dayId,
        body.exerciseId,
        body.exerciseOrder,
        {
          targetSets: body.targetSetsOverride,
          targetReps: body.targetRepsOverride,
          restSeconds: body.restSecondsOverride,
        }
      );
    })
  );

  return NextResponse.json({ id: dayExerciseId }, { status: 201 });
}
