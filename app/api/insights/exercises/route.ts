import { NextRequest, NextResponse } from "next/server";
import { eq, sql, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export interface LoggedExercise {
  id: string;
  name: string;
  sessionCount: number;
  currentMax: number;
  previousMax: number;
  changePercent: number;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all exercises the user has logged, with stats
    const exerciseLogs = await db
      .select({
        exerciseId: schema.exerciseLogs.exerciseId,
        exerciseName: schema.exerciseLogs.exerciseName,
        workoutDate: schema.workoutLogs.startedAt,
        maxWeight: sql<number>`MAX(CAST(${schema.setLogs.weight} AS FLOAT))`.as(
          "maxWeight"
        ),
      })
      .from(schema.exerciseLogs)
      .innerJoin(
        schema.workoutLogs,
        eq(schema.exerciseLogs.workoutLogId, schema.workoutLogs.id)
      )
      .innerJoin(
        schema.setLogs,
        eq(schema.setLogs.exerciseLogId, schema.exerciseLogs.id)
      )
      .where(eq(schema.workoutLogs.userId, session.user.id))
      .groupBy(
        schema.exerciseLogs.exerciseId,
        schema.exerciseLogs.exerciseName,
        schema.workoutLogs.startedAt
      )
      .orderBy(desc(schema.workoutLogs.startedAt));

    // Aggregate by exercise
    const exerciseMap = new Map<
      string,
      {
        id: string;
        name: string;
        sessions: { date: Date; maxWeight: number }[];
      }
    >();

    for (const log of exerciseLogs) {
      const existing = exerciseMap.get(log.exerciseId);
      if (existing) {
        existing.sessions.push({
          date: log.workoutDate,
          maxWeight: log.maxWeight || 0,
        });
      } else {
        exerciseMap.set(log.exerciseId, {
          id: log.exerciseId,
          name: log.exerciseName,
          sessions: [{ date: log.workoutDate, maxWeight: log.maxWeight || 0 }],
        });
      }
    }

    // Calculate stats for each exercise
    const exercises: LoggedExercise[] = Array.from(exerciseMap.values())
      .filter((ex) => ex.sessions.length >= 1)
      .map((ex) => {
        const sessionCount = ex.sessions.length;
        const currentMax = Math.max(...ex.sessions.map((s) => s.maxWeight));

        // Get "previous" max from first half of sessions
        const midPoint = Math.floor(sessionCount / 2);
        const previousMax =
          sessionCount > 1
            ? Math.max(...ex.sessions.slice(midPoint).map((s) => s.maxWeight))
            : currentMax;

        const changePercent =
          previousMax > 0
            ? ((currentMax - previousMax) / previousMax) * 100
            : 0;

        return {
          id: ex.id,
          name: ex.name,
          sessionCount,
          currentMax,
          previousMax,
          changePercent: Math.round(changePercent * 10) / 10,
        };
      })
      .sort((a, b) => b.sessionCount - a.sessionCount);

    return NextResponse.json(exercises);
  } catch (error) {
    console.error("Error fetching logged exercises:", error);
    return NextResponse.json(
      { error: "Failed to fetch exercises" },
      { status: 500 }
    );
  }
}
