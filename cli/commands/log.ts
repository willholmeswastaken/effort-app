import inquirer from "inquirer";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { like, asc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

interface ParsedSet {
  setNumber: number;
  reps: number;
  weight: number;
}

/**
 * Parse set string like "3x10@100" (sets x reps @ weight)
 * Can handle multiple: "3x10@100, 4x8@90"
 */
function parseSetString(input: string): ParsedSet[] {
  const sets: ParsedSet[] = [];
  const parts = input.split(",").map((s) => s.trim());

  for (const part of parts) {
    // Match pattern: sets x reps @ weight
    const match = part.match(/^(\d+)x(\d+)@(\d+(?:\.\d+)?)$/);
    if (match) {
      const setsCount = parseInt(match[1], 10);
      const reps = parseInt(match[2], 10);
      const weight = parseFloat(match[3]);

      for (let i = 0; i < setsCount; i++) {
        sets.push({
          setNumber: sets.length + 1,
          reps,
          weight,
        });
      }
    }
  }

  return sets;
}

export async function runLogCommand() {
  console.log("\n=== Log Historical Workout ===\n");

  // First, get the user (for now, we'll use a simple approach - list users)
  const users = await db.select().from(schema.user);

  if (users.length === 0) {
    console.log("No users found. Please onboard first.\n");
    return;
  }

  const { userId } = await inquirer.prompt([
    {
      type: "list",
      name: "userId",
      message: "Select user:",
      choices: users.map((u) => ({
        name: u.name || u.email,
        value: u.id,
      })),
    },
  ]);

  // Get programs for this user
  const programs = await db.select().from(schema.programs).orderBy(asc(schema.programs.name));

  if (programs.length === 0) {
    console.log("No programs found.\n");
    return;
  }

  const { programId } = await inquirer.prompt([
    {
      type: "list",
      name: "programId",
      message: "Select program:",
      choices: programs.map((p) => ({
        name: p.name,
        value: p.id,
      })),
    },
  ]);

  // Get days for this program
  const days = await db
    .select({
      id: schema.workoutDays.id,
      title: schema.workoutDays.title,
      dayOrder: schema.workoutDays.dayOrder,
    })
    .from(schema.workoutDays)
    .innerJoin(schema.programWeeks, eq(schema.workoutDays.weekId, schema.programWeeks.id))
    .where(eq(schema.programWeeks.programId, programId))
    .orderBy(asc(schema.workoutDays.dayOrder));

  const { dayId } = await inquirer.prompt([
    {
      type: "list",
      name: "dayId",
      message: "Select workout day:",
      choices: days.map((d) => ({
        name: d.title,
        value: d.id,
      })),
    },
  ]);

  // Get the workout date
  const { workoutDate } = await inquirer.prompt([
    {
      type: "input",
      name: "workoutDate",
      message: "Workout date (YYYY-MM-DD):",
      default: new Date().toISOString().split("T")[0],
    },
  ]);

  const date = new Date(workoutDate);
  if (isNaN(date.getTime())) {
    console.log("Invalid date format. Please use YYYY-MM-DD.\n");
    return;
  }

  // Create a workout log entry for historical data
  const program = programs.find((p) => p.id === programId)!;
  const day = days.find((d) => d.id === dayId)!;

  const [workoutLog] = await db
    .insert(schema.workoutLogs)
    .values({
      userId,
      programId,
      dayId,
      startedAt: date,
      completedAt: date,
      status: "completed",
      durationSeconds: 0, // Historical data won't have duration
      programName: program.name,
      dayTitle: day.title,
      dayExercisesSnapshot: "[]", // Historical entries don't need snapshot
    })
    .returning();

  console.log(`\nCreated workout log for ${workoutDate}\n`);

  // Now add exercises
  let addMoreExercises = true;

  while (addMoreExercises) {
    // Search for exercise
    const { exerciseQuery } = await inquirer.prompt([
      {
        type: "input",
        name: "exerciseQuery",
        message: "Search for exercise (or 'new' to add a new one):",
      },
    ]);

    // Find or create exercise
    let exercise;

    if (exerciseQuery.toLowerCase() === "new") {
      // Create a new exercise
      const { name, targetSets, targetReps, restSeconds } = await inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "Exercise name:",
        },
        {
          type: "input",
          name: "targetSets",
          message: "Target sets (default 3):",
          default: "3",
        },
        {
          type: "input",
          name: "targetReps",
          message: "Target reps (default 8-12):",
          default: "8-12",
        },
        {
          type: "input",
          name: "restSeconds",
          message: "Rest seconds (default 90):",
          default: "90",
        },
      ]);

      const [newExercise] = await db
        .insert(schema.exercises)
        .values({
          id: uuidv4(),
          name,
          targetSets: parseInt(targetSets, 10) || 3,
          targetReps,
          restSeconds: parseInt(restSeconds, 10) || 90,
        })
        .returning();

      exercise = newExercise;
    } else {
      // Search for existing exercise
      const results = await db
        .select()
        .from(schema.exercises)
        .where(like(schema.exercises.name, `%${exerciseQuery}%`))
        .orderBy(asc(schema.exercises.name))
        .limit(10);

      if (results.length === 0) {
        console.log("No exercises found. Try a different search or 'new' to create one.\n");
        continue;
      }

      const { exerciseId } = await inquirer.prompt([
        {
          type: "list",
          name: "exerciseId",
          message: "Select exercise:",
          choices: [
            ...results.map((e) => ({
              name: e.name,
              value: e.id,
            })),
            { name: "[Create new exercise]", value: "new" },
          ],
        },
      ]);

      if (exerciseId === "new") {
        const { name } = await inquirer.prompt([
          {
            type: "input",
            name: "name",
            message: "Exercise name:",
          },
        ]);

        const [newExercise] = await db
          .insert(schema.exercises)
          .values({
            id: uuidv4(),
            name,
            targetSets: 3,
            targetReps: "8-12",
            restSeconds: 90,
          })
          .returning();

        exercise = newExercise;
      } else {
        exercise = results.find((e) => e.id === exerciseId);
      }
    }

    // Get the sets for this exercise
    const { setsString } = await inquirer.prompt([
      {
        type: "input",
        name: "setsString",
        message: "Enter sets (format: 3x10@100, 4x8@90):",
      },
    ]);

    const parsedSets = parseSetString(setsString);

    if (parsedSets.length === 0) {
      console.log("Could not parse sets. Format: sets x reps @ weight, e.g., 3x10@100\n");
      continue;
    }

    console.log(`Parsed ${parsedSets.length} sets:`);
    for (const set of parsedSets) {
      console.log(`  Set ${set.setNumber}: ${set.reps} reps @ ${set.weight} lbs`);
    }

    // Create exercise log
    const [exerciseLog] = await db
      .insert(schema.exerciseLogs)
      .values({
        workoutLogId: workoutLog.id,
        exerciseId: exercise!.id,
        exerciseName: exercise!.name,
        exerciseOrder: 0,
        targetSets: exercise!.targetSets ?? 3,
        targetReps: exercise!.targetReps ?? "8-12",
        restSeconds: exercise!.restSeconds ?? 90,
      })
      .returning();

    // Insert all sets
    for (const set of parsedSets) {
      await db.insert(schema.setLogs).values({
        exerciseLogId: exerciseLog.id,
        setNumber: set.setNumber,
        reps: set.reps,
        weight: set.weight.toString(),
      });
    }

    console.log(`Logged ${parsedSets.length} sets for ${exercise!.name}\n`);

    const { continue: cont } = await inquirer.prompt([
      {
        type: "confirm",
        name: "continue",
        message: "Add another exercise?",
        default: false,
      },
    ]);

    addMoreExercises = cont;
  }

  console.log("Historical workout logged successfully!\n");
}
