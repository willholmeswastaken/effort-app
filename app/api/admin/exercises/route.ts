import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { runEffect, AdminService } from "@/lib/services";
import { Effect } from "effect";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const body = await req.json();

  if (!body.id || !body.name || !body.muscleGroupId) {
    return NextResponse.json(
      { error: "id, name, and muscleGroupId are required" },
      { status: 400 }
    );
  }

  const exerciseId = await runEffect(
    Effect.gen(function* () {
      const admin = yield* AdminService;
      return yield* admin.createExercise({
        id: body.id,
        name: body.name,
        muscleGroupId: body.muscleGroupId,
        targetSets: body.targetSets ?? 3,
        targetReps: body.targetReps ?? "8-12",
        restSeconds: body.restSeconds ?? 90,
      });
    })
  );

  return NextResponse.json({ id: exerciseId }, { status: 201 });
}
