import { NextRequest, NextResponse } from "next/server";
import { Effect } from "effect";
import { auth } from "@/lib/auth";
import { runEffect, ProgramsService } from "@/lib/services";
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

    const { id: programId } = await params;

    const newInstanceId = await runEffect(
      Effect.gen(function* () {
        const service = yield* ProgramsService;
        return yield* service.createProgramInstance(session.user.id, programId);
      })
    );

    revalidatePath("/");

    return NextResponse.json({ success: true, instanceId: newInstanceId });
  } catch (error) {
    console.error("Error restarting program:", error);
    return NextResponse.json(
      { error: "Failed to restart program" },
      { status: 500 }
    );
  }
}
