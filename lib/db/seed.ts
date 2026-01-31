import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import seedData from "./seed-data.json";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool, { schema });

async function seed() {
  console.log("🌱 Starting database seed...\n");

  // 1. Seed Muscle Groups
  if (seedData.muscleGroups?.length) {
    console.log("📦 Seeding muscle groups...");
    await db
      .insert(schema.muscleGroups)
      .values(seedData.muscleGroups)
      .onConflictDoNothing();
    console.log(`✅ Seeded ${seedData.muscleGroups.length} muscle groups\n`);
  }

  // 2. Seed Exercises
  if (seedData.exercises?.length) {
    console.log("💪 Seeding exercises...");
    await db
      .insert(schema.exercises)
      .values(seedData.exercises)
      .onConflictDoNothing();
    console.log(`✅ Seeded ${seedData.exercises.length} exercises\n`);
  }

  // 3. Seed Programs
  if (seedData.programs?.length) {
    console.log("📋 Seeding programs...");
    await db
      .insert(schema.programs)
      .values(seedData.programs)
      .onConflictDoNothing();
    console.log(`✅ Seeded ${seedData.programs.length} programs\n`);
  }

  // 4. Seed Program Weeks
  if (seedData.programWeeks?.length) {
    console.log("📅 Seeding program weeks...");
    // Cast to handle the UUID type - drizzle will use defaultRandom() for id
    const weeksWithoutId = seedData.programWeeks.map((week: any) => ({
      id: week.id, // Use provided ID
      programId: week.programId,
      weekNumber: week.weekNumber,
    }));
    await db
      .insert(schema.programWeeks)
      .values(weeksWithoutId as any)
      .onConflictDoNothing();
    console.log(`✅ Seeded ${seedData.programWeeks.length} program weeks\n`);
  }

  // 5. Seed Workout Days
  if (seedData.workoutDays?.length) {
    console.log("🏋️ Seeding workout days...");
    await db
      .insert(schema.workoutDays)
      .values(seedData.workoutDays)
      .onConflictDoNothing();
    console.log(`✅ Seeded ${seedData.workoutDays.length} workout days\n`);
  }

  // 6. Seed Day Exercises (junction table)
  if (seedData.dayExercises?.length) {
    console.log("🔗 Seeding day-exercise mappings...");
    await db
      .insert(schema.dayExercises)
      .values(seedData.dayExercises)
      .onConflictDoNothing();
    console.log(`✅ Seeded ${seedData.dayExercises.length} day-exercise mappings\n`);
  }

  console.log("🎉 Database seeding completed!");

  await pool.end();
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  pool.end();
  process.exit(1);
});
