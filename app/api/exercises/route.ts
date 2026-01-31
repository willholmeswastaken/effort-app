import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    // Fetch all muscle groups with their exercises
    const muscleGroups = await db.query.muscleGroups.findMany({
      orderBy: [asc(schema.muscleGroups.orderIndex)],
      with: {
        exercises: {
          columns: {
            id: true,
            name: true,
            thumbnailUrl: true,
            targetSets: true,
            targetReps: true,
            restSeconds: true,
            videoUrl: true,
          },
        },
      },
    });

    return NextResponse.json(muscleGroups);
  } catch (error) {
    console.error("Error fetching muscle groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch muscle groups" },
      { status: 500 }
    );
  }
}
