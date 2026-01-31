import { NextRequest, NextResponse } from "next/server";
import { Effect } from "effect";
import { auth } from "@/lib/auth";
import { runEffect, ProgramsService } from "@/lib/services";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const programs = await runEffect(
      Effect.gen(function* () {
        const service = yield* ProgramsService;
        const allPrograms = yield* service.getAll();
        return allPrograms.map((p) => ({
          id: p.id,
          name: p.name,
          daysPerWeek: p.daysPerWeek,
        }));
      })
    );

    return NextResponse.json(programs);
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json(
      { error: "Failed to fetch programs" },
      { status: 500 }
    );
  }
}
