import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Effect, pipe } from "effect";
import { auth } from "@/lib/auth";
import { runEffect, ProgramsService, UserService } from "@/lib/services";
import { OnboardingClient } from "./client";

export default async function OnboardingPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    redirect("/login");
  }

  const result = await runEffect(
    pipe(
      Effect.gen(function* () {
        const userService = yield* UserService;
        const programsService = yield* ProgramsService;
        
        const prefs = yield* userService.getPreferences(session.user.id);
        
        if (prefs.hasOnboarded) {
          return { type: "redirect" as const };
        }
        
        const programs = yield* programsService.getAllWithMeta();
        return { type: "success" as const, programs };
      }),
      Effect.catchAll(() => {
        return Effect.succeed({ type: "success" as const, programs: [] as Array<{
          id: string;
          name: string;
          description: string | null;
          daysPerWeek: number;
          weekCount: number;
        }> });
      })
    )
  );

  if (result.type === "redirect") {
    redirect("/");
  }

  return <OnboardingClient programs={result.programs} />;
}
