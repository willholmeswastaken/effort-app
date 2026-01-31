import { NextRequest, NextResponse } from "next/server";
import { Effect } from "effect";
import { auth } from "@/lib/auth";
import { runEffect, WorkoutsService } from "@/lib/services";
import { revalidatePath } from "next/cache";

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

    const { programId, dayId } = await runEffect(
      Effect.gen(function* () {
        const service = yield* WorkoutsService;
        return yield* service.resetWorkout(id, session.user.id);
      })
    );

    revalidatePath(`/workout/${programId}/${dayId}`);
    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resetting workout:", error);
    return NextResponse.json(
      { error: "Failed to reset workout" },
      { status: 500 }
    );
  }
}
