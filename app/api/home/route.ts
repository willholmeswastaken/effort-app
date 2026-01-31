import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Effect, pipe } from "effect";
import { auth } from "@/lib/auth";
import { runEffect, ProgramsService, UserService } from "@/lib/services";

export async function GET() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runEffect(
    pipe(
      Effect.gen(function* () {
        const userService = yield* UserService;
        const programsService = yield* ProgramsService;

        const prefs = yield* userService.getPreferences(session.user.id);

        if (!prefs.hasOnboarded) {
          return { type: "redirect" as const, to: "/onboarding" };
        }

        let activeProgramId = prefs.activeProgramId;
        if (!activeProgramId) {
          return { type: "redirect" as const, to: "/onboarding" };
        }

        const program = yield* programsService.getProgramForHome(
          activeProgramId, 
          session.user.id, 
          prefs.activeProgramInstanceId
        );

        if (!program) {
          return { type: "redirect" as const, to: "/onboarding" };
        }

        const allDays = program.weeks.flatMap(w => w.days);
        const isProgramComplete = allDays.length > 0 && allDays.every(d => d.isCompleted);
        const nextWorkout = allDays.find(d => !d.isCompleted) 
          ?? allDays.find(d => d.isInProgress)
          ?? null;

        return {
          type: "success" as const,
          activeProgram: program,
          userPreferences: { 
            activeProgramId: prefs.activeProgramId, 
            activeProgramInstanceId: prefs.activeProgramInstanceId,
            hasOnboarded: prefs.hasOnboarded,
          },
          isProgramComplete,
          nextWorkout: nextWorkout ? { programId: activeProgramId, dayId: nextWorkout.id } : null,
        };
      }),
      Effect.catchAll((error) => {
        console.error("Failed to fetch homepage data:", error);
        return Effect.succeed({ type: "redirect" as const, to: "/onboarding" });
      })
    )
  );

  return NextResponse.json(result);
}
