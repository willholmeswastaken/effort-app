import { Context, Effect, Layer } from "effect";
import { eq } from "drizzle-orm";
import { DatabaseService } from "./Database";
import * as schema from "@/lib/db/schema";

export interface UserPreferencesData {
  activeProgramId: string | null;
  activeProgramInstanceId: string | null;
  hasOnboarded: boolean;
}

export interface UserServiceInterface {
  readonly getPreferences: (userId: string) => Effect.Effect<UserPreferencesData, Error>;
  readonly updatePreferences: (
    userId: string,
    data: Partial<UserPreferencesData>
  ) => Effect.Effect<void, Error>;
  readonly ensurePreferences: (userId: string) => Effect.Effect<void, Error>;
}

export class UserService extends Context.Tag("UserService")<
  UserService,
  UserServiceInterface
>() {}

export const UserServiceLive = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const db = yield* DatabaseService;

    const getPreferences = (userId: string): Effect.Effect<UserPreferencesData, Error> =>
      Effect.tryPromise({
        try: async () => {
          const prefs = await db.query.userPreferences.findFirst({
            where: eq(schema.userPreferences.userId, userId),
          });

          return {
            activeProgramId: prefs?.activeProgramId ?? null,
            activeProgramInstanceId: prefs?.activeProgramInstanceId ?? null,
            hasOnboarded: prefs?.hasOnboarded ?? false,
          };
        },
        catch: (e) => new Error(`Failed to fetch user preferences: ${e}`),
      });

    const updatePreferences = (
      userId: string,
      data: Partial<UserPreferencesData>
    ): Effect.Effect<void, Error> =>
      Effect.tryPromise({
        try: async () => {
          await db
            .insert(schema.userPreferences)
            .values({
              userId,
              activeProgramId: data.activeProgramId,
              hasOnboarded: data.hasOnboarded,
            })
            .onConflictDoUpdate({
              target: schema.userPreferences.userId,
              set: {
                ...data,
                updatedAt: new Date(),
              },
            });
        },
        catch: (e) => new Error(`Failed to update user preferences: ${e}`),
      });

    const ensurePreferences = (userId: string): Effect.Effect<void, Error> =>
      Effect.tryPromise({
        try: async () => {
          await db
            .insert(schema.userPreferences)
            .values({ userId })
            .onConflictDoNothing();
        },
        catch: (e) => new Error(`Failed to ensure user preferences: ${e}`),
      });

    return {
      getPreferences,
      updatePreferences,
      ensurePreferences,
    };
  })
);
