import { Context, Effect, Layer } from "effect";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/lib/db/schema";

export type DrizzleDatabase = ReturnType<typeof drizzle<typeof schema>>;

export class DatabaseService extends Context.Tag("DatabaseService")<
  DatabaseService,
  DrizzleDatabase
>() {}

export const DatabaseServiceLive = Layer.sync(DatabaseService, () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
  });
  return drizzle(pool, { schema });
});

export const withDatabase = <A>(
  f: (db: DrizzleDatabase) => Promise<A>
): Effect.Effect<A, Error, DatabaseService> =>
  Effect.gen(function* () {
    const db = yield* DatabaseService;
    return yield* Effect.tryPromise({
      try: () => f(db),
      catch: (e) => new Error(String(e)),
    });
  });
