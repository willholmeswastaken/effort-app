import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { runEffect, AdminService } from "@/lib/services";
import { Effect } from "effect";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ dayId: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { dayId } = await params;
  const body = await req.json();

  await runEffect(
    Effect.gen(function* () {
      const admin = yield* AdminService;
      return yield* admin.reorderDayExercises(dayId, body.orderedIds);
    })
  );

  return NextResponse.json({ success: true });
}
