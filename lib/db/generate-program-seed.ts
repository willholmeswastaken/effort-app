/**
 * Script to generate program seed data from programs.json
 * Run with: npx tsx lib/db/generate-program-seed.ts
 */

import { randomUUID } from "crypto";
import programsData from "../../programs.json";
import seedData from "./seed-data.json";
import * as fs from "fs";

interface Exercise {
  exercise_id: string;
  name: string;
  video: string;
  thumbnail: string;
  sets: number;
  reps: number[];
  order: number;
}

interface Session {
  id: string;
  name: string;
  exercises: Exercise[];
}

interface Workout {
  id: string;
  name: string;
  total_sessions: number;
  sessions: Session[];
}

interface ProgramData {
  id: string;
  name: string;
  description: string;
  background_image: string;
  workouts: Workout[];
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanDescription(desc: string): string {
  return desc
    .replace(/&rsquo;/g, "'")
    .replace(/\\r/g, "")
    .split("\r")[0]
    .trim();
}

function generateSeedData() {
  const rawProgram = (programsData as any).data.getVendorWorkouts.data as ProgramData;
  const programId = generateSlug(rawProgram.name);

  // 1. Generate program
  const programs = [
    {
      id: programId,
      name: rawProgram.name,
      description: cleanDescription(rawProgram.description),
      daysPerWeek: rawProgram.workouts[0]?.total_sessions || 5,
      isSystem: true,
    },
  ];

  // 2. Generate program weeks
  const programWeeks = rawProgram.workouts.map((workout, index) => ({
    id: `${programId}-week-${index + 1}`,
    programId: programId,
    weekNumber: index + 1,
  }));

  // 3. Generate workout days with UUID ids
  // Create a map from session.id to UUID for dayExercises reference
  const sessionIdToUuid = new Map<string, string>();
  const workoutDays: any[] = [];
  
  rawProgram.workouts.forEach((workout, weekIndex) => {
    workout.sessions.forEach((session, dayIndex) => {
      const uuid = randomUUID();
      sessionIdToUuid.set(session.id, uuid);
      workoutDays.push({
        id: uuid,
        weekId: `${programId}-week-${weekIndex + 1}`,
        title: session.name,
        dayOrder: dayIndex,
      });
    });
  });

  // 4. Collect all unique exercises from the program
  const exerciseMap = new Map<string, any>();
  
  rawProgram.workouts.forEach((workout) => {
    workout.sessions.forEach((session) => {
      session.exercises.forEach((exercise) => {
        const exerciseId = generateSlug(exercise.name);
        if (!exerciseMap.has(exerciseId)) {
          exerciseMap.set(exerciseId, {
            id: exerciseId,
            name: exercise.name,
            videoUrl: exercise.video,
            thumbnailUrl: exercise.thumbnail,
          });
        }
      });
    });
  });

  // Merge with existing exercises (don't duplicate)
  const existingExerciseIds = new Set(seedData.exercises.map((e: any) => e.id));
  const newExercises = Array.from(exerciseMap.values()).filter(
    (e) => !existingExerciseIds.has(e.id)
  );

  // 5. Generate day exercises (junction table) using UUID references
  const dayExercises: any[] = [];
  rawProgram.workouts.forEach((workout) => {
    workout.sessions.forEach((session) => {
      const dayUuid = sessionIdToUuid.get(session.id)!;
      session.exercises.forEach((exercise, exerciseIndex) => {
        dayExercises.push({
          dayId: dayUuid,
          exerciseId: generateSlug(exercise.name),
          exerciseOrder: exerciseIndex,
        });
      });
    });
  });

  return {
    programs,
    programWeeks,
    workoutDays,
    newExercises,
    dayExercises,
  };
}

// Generate and output
const result = generateSeedData();

console.log("📊 Generated program seed data:");
console.log(`  Programs: ${result.programs.length}`);
console.log(`  Week definitions: ${result.programWeeks.length}`);
console.log(`  Workout days: ${result.workoutDays.length}`);
console.log(`  New exercises to add: ${result.newExercises.length}`);
console.log(`  Day-exercise mappings: ${result.dayExercises.length}`);

// Merge with existing seed data
const updatedSeedData = {
  ...seedData,
  exercises: [...seedData.exercises, ...result.newExercises],
  programs: result.programs,
  programWeeks: result.programWeeks,
  workoutDays: result.workoutDays,
  dayExercises: result.dayExercises,
};

// Write updated seed data
fs.writeFileSync(
  "./lib/db/seed-data.json",
  JSON.stringify(updatedSeedData, null, 2)
);

console.log("\n✅ Updated seed-data.json with program data!");
