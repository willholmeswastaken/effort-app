import { Effect, Layer } from "effect";

import { DatabaseService, DatabaseServiceLive } from "./Database";
import { ProgramsService, ProgramsServiceLive } from "./Programs";
import { WorkoutsService, WorkoutsServiceLive } from "./Workouts";
import { InsightsService, InsightsServiceLive } from "./Insights";
import { UserService, UserServiceLive } from "./User";

export { DatabaseService } from "./Database";
export { ProgramsService, type ProgramWithDays, type ProgramForHome } from "./Programs";
export {
  WorkoutsService,
  type UpsertSetInput,
  type StartWorkoutInput,
  type CompleteWorkoutInput,
  type WorkoutHistoryEntry,
  type ExerciseHistoryEntry,
  type WorkoutDetail,
  type WorkoutSessionData,
  type WorkoutSessionExercise,
  type WorkoutSessionSet,
} from "./Workouts";
export { InsightsService, type InsightsSummary, type ExerciseProgressionPoint } from "./Insights";
export { UserService, type UserPreferencesData } from "./User";

const ServicesLayer = Layer.mergeAll(
  ProgramsServiceLive,
  WorkoutsServiceLive,
  InsightsServiceLive,
  UserServiceLive
);

export const AppLayer = Layer.provideMerge(ServicesLayer, DatabaseServiceLive);

export type AppContext =
  | DatabaseService
  | ProgramsService
  | WorkoutsService
  | InsightsService
  | UserService;

export const runEffect = <A, E>(
  effect: Effect.Effect<A, E, AppContext>
): Promise<A> => Effect.runPromise(Effect.provide(effect, AppLayer));

export const runEffectEither = <A, E>(
  effect: Effect.Effect<A, E, AppContext>
): Promise<{ _tag: "Right"; right: A } | { _tag: "Left"; left: E }> =>
  Effect.runPromise(
    Effect.either(Effect.provide(effect, AppLayer))
  );
