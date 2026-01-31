/**
 * Script to clear all workout data for a specific user.
 * 
 * Usage: npx tsx lib/db/clear-user-data.ts <userId>
 * 
 * This will delete:
 * - All workout logs for the user
 * - Reset user preferences (activeProgramInstanceId)
 * 
 * Exercise logs and set logs will be cascade deleted automatically.
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

const userId = process.argv[2];

if (!userId) {
  console.error("❌ Usage: npx tsx lib/db/clear-user-data.ts <userId>");
  console.error("   You must provide a userId as an argument.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool, { schema });

async function clearUserData() {
  console.log(`\n🔍 Looking up user: ${userId}\n`);
  
  // First, check if user exists
  const userPrefs = await db.query.userPreferences.findFirst({
    where: eq(schema.userPreferences.userId, userId),
  });
  
  if (!userPrefs) {
    console.log("⚠️  No user preferences found for this user.");
    console.log("   The user may not exist or has never started a workout.\n");
  }
  
  // Get count of workout logs before deletion
  const workoutLogs = await db.query.workoutLogs.findMany({
    where: eq(schema.workoutLogs.userId, userId),
    columns: { id: true },
  });
  
  console.log(`📊 Found ${workoutLogs.length} workout log(s) for this user.\n`);
  
  if (workoutLogs.length === 0 && !userPrefs) {
    console.log("✅ Nothing to delete. User data is already clean.\n");
    await pool.end();
    process.exit(0);
  }
  
  // Confirm deletion
  console.log("⚠️  This will delete:");
  console.log(`   - ${workoutLogs.length} workout log(s)`);
  console.log("   - All associated exercise logs and set logs");
  console.log("   - Reset program instance in user preferences\n");
  
  // Delete workout logs (exercise logs and set logs cascade delete)
  if (workoutLogs.length > 0) {
    console.log("🗑️  Deleting workout logs...");
    const deleted = await db
      .delete(schema.workoutLogs)
      .where(eq(schema.workoutLogs.userId, userId))
      .returning({ id: schema.workoutLogs.id });
    console.log(`   ✅ Deleted ${deleted.length} workout log(s)\n`);
  }
  
  // Reset user preferences
  if (userPrefs) {
    console.log("🔄 Resetting user preferences...");
    await db
      .update(schema.userPreferences)
      .set({
        activeProgramInstanceId: null,
      })
      .where(eq(schema.userPreferences.userId, userId));
    console.log("   ✅ Reset activeProgramInstanceId to null\n");
  }
  
  console.log("🎉 User data cleared successfully!");
  console.log("   The user can now start fresh with a new program instance.\n");
  
  await pool.end();
  process.exit(0);
}

clearUserData().catch(async (err) => {
  console.error("❌ Error clearing user data:", err);
  await pool.end();
  process.exit(1);
});

