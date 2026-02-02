import { Effect, pipe } from "effect";
import { runEffect, ProgramsService, UserService } from "@/lib/services";
import type { HomeData } from "@/lib/queries/home-data";

export async function getHomeDataDirect(userId: string): Promise<HomeData> {
  const result = await runEffect(
    pipe(
      Effect.gen(function* () {
        const userService = yield* UserService;
        const programsService = yield* ProgramsService;

        const prefs = yield* userService.getPreferences(userId);

        if (!prefs.hasOnboarded) {
          return { type: "redirect" as const, to: "/onboarding" };
        }

        const activeProgramId = prefs.activeProgramId;
        if (!activeProgramId) {
          return { type: "redirect" as const, to: "/onboarding" };
        }

        const program = yield* programsService.getProgramForHome(
          activeProgramId,
          userId,
          prefs.activeProgramInstanceId
        );

        if (!program) {
          return { type: "redirect" as const, to: "/onboarding" };
        }

        const allDays = program.weeks.flatMap((w) => w.days);
        const isProgramComplete =
          allDays.length > 0 && allDays.every((d) => d.isCompleted);
        const nextWorkout =
          allDays.find((d) => d.isInProgress) ??
          allDays.find((d) => !d.isCompleted) ??
          null;

        return {
          type: "success" as const,
          activeProgram: program,
          userPreferences: {
            activeProgramId: prefs.activeProgramId,
            activeProgramInstanceId: prefs.activeProgramInstanceId,
            hasOnboarded: prefs.hasOnboarded,
          },
          isProgramComplete,
          nextWorkout: nextWorkout
            ? { programId: activeProgramId, dayId: nextWorkout.id, isInProgress: nextWorkout.isInProgress }
            : null,
        };
      }),
      Effect.catchAll((error) => {
        console.error("Failed to fetch homepage data:", error);
        return Effect.succeed({ type: "redirect" as const, to: "/onboarding" });
      })
    )
  );

  return result;
}
