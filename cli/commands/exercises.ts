import inquirer from "inquirer";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { asc, eq, sql, ilike } from "drizzle-orm";

const args = process.argv.slice(2);

export async function runExercisesCommand() {
  console.log("\n=== Exercise Library ===\n");

  // Check for --search argument
  let query = "";
  const searchIndex = args.indexOf("--search");
  if (searchIndex !== -1 && args[searchIndex + 1]) {
    query = args[searchIndex + 1].toLowerCase().trim();
  }

  // Check for --list argument to list all without interactive mode
  const listAll = args.includes("--list");

  // If no argument provided and not listing all, prompt for search
  if (!query && !listAll) {
    const search = await inquirer.prompt([
      {
        type: "input",
        name: "query",
        message: "Search exercises (leave empty to list all):",
        default: "",
      },
    ]);
    query = search.query.toLowerCase().trim();
  }

  let results;
  if (query) {
    results = await db
      .select({
        id: schema.exercises.id,
        name: schema.exercises.name,
        targetSets: schema.exercises.targetSets,
        targetReps: schema.exercises.targetReps,
        restSeconds: schema.exercises.restSeconds,
        muscleGroupName: schema.muscleGroups.name,
      })
      .from(schema.exercises)
      .leftJoin(
        schema.muscleGroups,
        eq(schema.exercises.muscleGroupId, schema.muscleGroups.id)
      )
      .where(ilike(schema.exercises.name, `%${query}%`))
      .orderBy(asc(schema.exercises.name));
  } else {
    // List all exercises (limit to 50 for performance)
    results = await db
      .select({
        id: schema.exercises.id,
        name: schema.exercises.name,
        targetSets: schema.exercises.targetSets,
        targetReps: schema.exercises.targetReps,
        restSeconds: schema.exercises.restSeconds,
        muscleGroupName: schema.muscleGroups.name,
      })
      .from(schema.exercises)
      .leftJoin(
        schema.muscleGroups,
        eq(schema.exercises.muscleGroupId, schema.muscleGroups.id)
      )
      .orderBy(asc(schema.exercises.name))
      .limit(50);
  }

  if (results.length === 0) {
    console.log("No exercises found.\n");
    return;
  }

  console.log(`Found ${results.length} exercise(s):\n`);

  for (const exercise of results) {
    const muscleGroup = exercise.muscleGroupName
      ? ` [${exercise.muscleGroupName}]`
      : "";
    console.log(`  ${exercise.name}${muscleGroup}`);
    console.log(
      `    Targets: ${exercise.targetSets ?? 3} sets × ${exercise.targetReps ?? "8-12"} reps, ${exercise.restSeconds ?? 90}s rest`
    );
  }
  console.log();
}
