import inquirer from "inquirer";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { like, asc, eq } from "drizzle-orm";

export async function runPlanCommand() {
  console.log("\n=== Manage Workout Plans ===\n");

  // Get all programs
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
      choices: [
        ...programs.map((p) => ({
          name: `${p.name} (${p.daysPerWeek}x/week)`,
          value: p.id,
        })),
      ],
    },
  ]);

  // Get program details with days and exercises
  const program = await db.query.programs.findFirst({
    where: eq(schema.programs.id, programId),
    with: {
      weeks: {
        orderBy: (weeks, { asc }) => [asc(weeks.weekNumber)],
        with: {
          days: {
            orderBy: (days, { asc }) => [asc(days.dayOrder)],
            with: {
              dayExercises: {
                orderBy: (de, { asc }) => [asc(de.exerciseOrder)],
                with: {
                  exercise: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!program) {
    console.log("Program not found.\n");
    return;
  }

  // Flatten all days with exercises
  const allDays = program.weeks.flatMap((week) =>
    week.days.map((day) => ({
      weekNumber: week.weekNumber,
      dayId: day.id,
      title: day.title,
      dayOrder: day.dayOrder,
      exercises: day.dayExercises.map((de) => ({
        id: de.exercise.id,
        dayExerciseId: de.id,
        name: de.exercise.name,
        targetSets: de.exercise.targetSets ?? 3,
        targetReps: de.exercise.targetReps ?? "8-12",
        restSeconds: de.exercise.restSeconds ?? 90,
        // Override values
        targetSetsOverride: de.targetSetsOverride,
        targetRepsOverride: de.targetRepsOverride,
        restSecondsOverride: de.restSecondsOverride,
      })),
    }))
  );

  // Show program structure
  console.log(`\nProgram: ${program.name}`);
  console.log(`Description: ${program.description || "N/A"}`);
  console.log(`Weeks: ${program.weeks.length}, Days/week: ${program.daysPerWeek}\n`);

  // Ask what to do
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: [
        { name: "View all exercises in program", value: "view" },
        { name: "Edit exercise targets (global)", value: "edit-global" },
        { name: "Edit exercise targets (per-day)", value: "edit-day" },
      ],
    },
  ]);

  if (action === "view") {
    console.log("\n=== Exercises in Program ===\n");
    for (const day of allDays) {
      console.log(`Week ${day.weekNumber}, Day ${day.dayOrder}: ${day.title}`);
      for (const exercise of day.exercises) {
        const sets = exercise.targetSetsOverride ?? exercise.targetSets;
        const reps = exercise.targetRepsOverride ?? exercise.targetReps;
        const rest = exercise.restSecondsOverride ?? exercise.restSeconds;
        const override = exercise.targetSetsOverride !== null ? " (override)" : "";
        console.log(
          `  - ${exercise.name}: ${sets}×${reps}, ${rest}s rest${override}`
        );
      }
      console.log();
    }
    return;
  }

  if (action === "edit-global") {
    // Select an exercise to edit (global - affects all days)
    const allExercises = [...new Map(allDays.flatMap((d) => d.exercises).map((e) => [e.id, e])).values()];

    const { exerciseId } = await inquirer.prompt([
      {
        type: "list",
        name: "exerciseId",
        message: "Select exercise to edit:",
        choices: allExercises.map((e) => ({
          name: `${e.name} (${e.targetSets}×${e.targetReps})`,
          value: e.id,
        })),
      },
    ]);

    const exercise = allExercises.find((e) => e.id === exerciseId)!;

    console.log(`\nEditing: ${exercise.name}`);
    console.log(`Current: ${exercise.targetSets} sets × ${exercise.targetReps} reps, ${exercise.restSeconds}s rest\n`);

    const { targetSets, targetReps, restSeconds } = await inquirer.prompt([
      {
        type: "input",
        name: "targetSets",
        message: "Target sets:",
        default: exercise.targetSets.toString(),
      },
      {
        type: "input",
        name: "targetReps",
        message: "Target reps:",
        default: exercise.targetReps,
      },
      {
        type: "input",
        name: "restSeconds",
        message: "Rest seconds:",
        default: exercise.restSeconds.toString(),
      },
    ]);

    await db
      .update(schema.exercises)
      .set({
        targetSets: parseInt(targetSets, 10) || 3,
        targetReps,
        restSeconds: parseInt(restSeconds, 10) || 90,
      })
      .where(eq(schema.exercises.id, exerciseId));

    console.log("\nExercise targets updated!\n");
    return;
  }

  if (action === "edit-day") {
    // First select the day
    const { dayId } = await inquirer.prompt([
      {
        type: "list",
        name: "dayId",
        message: "Select day:",
        choices: allDays.map((d) => ({
          name: `Week ${d.weekNumber}, Day ${d.dayOrder}: ${d.title}`,
          value: d.dayId,
        })),
      },
    ]);

    const day = allDays.find((d) => d.dayId === dayId)!;

    console.log(`\nDay: ${day.title}`);
    console.log("Exercises:");

    for (const exercise of day.exercises) {
      const sets = exercise.targetSetsOverride ?? exercise.targetSets;
      const reps = exercise.targetRepsOverride ?? exercise.targetReps;
      const rest = exercise.restSecondsOverride ?? exercise.restSeconds;
      const override = exercise.targetSetsOverride !== null ? " [OVERRIDE SET]" : "";
      console.log(
        `  ${exercise.name}: ${sets}×${reps}, ${rest}s rest${override}`
      );
    }

    // Select exercise to edit
    const { exerciseDayId } = await inquirer.prompt([
      {
        type: "list",
        name: "exerciseDayId",
        message: "Select exercise to edit:",
        choices: day.exercises.map((e) => ({
          name: `${e.name}`,
          value: e.dayExerciseId,
        })),
      },
    ]);

    const exercise = day.exercises.find((e) => e.dayExerciseId === exerciseDayId)!;

    console.log(`\nEditing: ${exercise.name} (in ${day.title})`);
    console.log(`Current targets: ${exercise.targetSets}×${exercise.targetReps}, ${exercise.restSeconds}s rest`);
    if (exercise.targetSetsOverride !== null) {
      console.log(`Current override: ${exercise.targetSetsOverride}×${exercise.targetRepsOverride}, ${exercise.restSecondsOverride}s rest`);
    }

    const { targetSets, targetReps, restSeconds, clearOverrides } = await inquirer.prompt([
      {
        type: "input",
        name: "targetSets",
        message: "Target sets (leave empty to keep override or use default):",
        default: exercise.targetSetsOverride?.toString() ?? "",
      },
      {
        type: "input",
        name: "targetReps",
        message: "Target reps:",
        default: exercise.targetRepsOverride ?? exercise.targetReps,
      },
      {
        type: "input",
        name: "restSeconds",
        message: "Rest seconds:",
        default: exercise.restSecondsOverride?.toString() ?? exercise.restSeconds.toString(),
      },
      {
        type: "confirm",
        name: "clearOverrides",
        message: "Clear all overrides and use exercise defaults?",
        default: false,
      },
    ]);

    if (clearOverrides) {
      await db
        .update(schema.dayExercises)
        .set({
          targetSetsOverride: null,
          targetRepsOverride: null,
          restSecondsOverride: null,
        })
        .where(eq(schema.dayExercises.id, exerciseDayId));
      console.log("\nOverrides cleared. Will use exercise defaults.\n");
    } else {
      // Parse values - empty string means use default
      const setsValue = targetSets.trim() ? parseInt(targetSets, 10) : null;
      const repsValue = targetReps.trim() || null;
      const restValue = restSeconds.trim() ? parseInt(restSeconds, 10) : null;

      await db
        .update(schema.dayExercises)
        .set({
          targetSetsOverride: setsValue,
          targetRepsOverride: repsValue,
          restSecondsOverride: restValue,
        })
        .where(eq(schema.dayExercises.id, exerciseDayId));
      console.log("\nPer-day overrides updated!\n");
    }
  }
}
