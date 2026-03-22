import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { runEffect, AdminService } from "@/lib/services";
import { Effect } from "effect";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json();

  await runEffect(
    Effect.gen(function* () {
      const admin = yield* AdminService;
      return yield* admin.updateDayExercise(id, {
        targetSetsOverride: body.targetSetsOverride,
        targetRepsOverride: body.targetRepsOverride,
        restSecondsOverride: body.restSecondsOverride,
      });
    })
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  await runEffect(
    Effect.gen(function* () {
      const admin = yield* AdminService;
      return yield* admin.removeDayExercise(id);
    })
  );

  return NextResponse.json({ success: true });
}
