import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { runEffect, AdminService } from "@/lib/services";
import { Effect } from "effect";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ weekId: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { weekId } = await params;

  const week = await runEffect(
    Effect.gen(function* () {
      const admin = yield* AdminService;
      return yield* admin.getWeek(weekId);
    })
  );

  if (!week) {
    return NextResponse.json({ error: "Week not found" }, { status: 404 });
  }

  return NextResponse.json(week);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ weekId: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { weekId } = await params;
  const body = await req.json();
  const applyToAll = body.applyToAll === true;

  await runEffect(
    Effect.gen(function* () {
      const admin = yield* AdminService;
      const input = { days: body.days };
      if (applyToAll) {
        return yield* admin.saveAllWeeks(weekId, input);
      }
      return yield* admin.saveWeek(weekId, input);
    })
  );

  return NextResponse.json({ success: true });
}
