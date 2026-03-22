import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { runEffect, AdminService } from "@/lib/services";
import { Effect } from "effect";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const programs = await runEffect(
    Effect.gen(function* () {
      const admin = yield* AdminService;
      return yield* admin.getAllPrograms();
    })
  );

  return NextResponse.json(programs);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const programId = await runEffect(
    Effect.gen(function* () {
      const admin = yield* AdminService;
      return yield* admin.createProgram({
        name: body.name,
        description: body.description,
        daysPerWeek: body.daysPerWeek,
        weekCount: body.weekCount ?? 1,
        dayTitles: body.dayTitles,
      });
    })
  );

  return NextResponse.json({ id: programId }, { status: 201 });
}
