"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Effect } from "effect";
import { auth } from "@/lib/auth";
import { runEffect, WorkoutsService } from "@/lib/services";

export async function resetWorkoutAction(workoutLogId: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const { programId, dayId } = await runEffect(
      Effect.gen(function* () {
        const service = yield* WorkoutsService;
        return yield* service.resetWorkout(workoutLogId, session.user.id);
      })
    );

    revalidatePath(`/workout/${programId}/${dayId}`);
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to reset workout:", error);
    return { success: false, error: "Failed to reset workout" };
  }
}

