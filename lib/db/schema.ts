import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  uuid,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPreferences = pgTable(
  "user_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    activeProgramId: text("active_program_id"),
    activeProgramInstanceId: uuid("active_program_instance_id"),
    hasOnboarded: boolean("has_onboarded").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("idx_user_preferences_user").on(table.userId)]
);

export const muscleGroups = pgTable("muscle_groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  coverImage: text("cover_image"),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const muscleGroupsRelations = relations(muscleGroups, ({ many }) => ({
  exercises: many(exercises),
}));

export const programs = pgTable("programs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  daysPerWeek: integer("days_per_week").notNull(),
  isSystem: boolean("is_system").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const programsRelations = relations(programs, ({ many }) => ({
  weeks: many(programWeeks),
}));

export const programWeeks = pgTable(
  "program_weeks",
  {
    id: text("id").primaryKey(),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    weekNumber: integer("week_number").notNull(),
  },
  (table) => [unique("uniq_program_week").on(table.programId, table.weekNumber)]
);

export const programWeeksRelations = relations(programWeeks, ({ one, many }) => ({
  program: one(programs, {
    fields: [programWeeks.programId],
    references: [programs.id],
  }),
  days: many(workoutDays),
}));

export const workoutDays = pgTable(
  "workout_days",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    weekId: text("week_id")
      .notNull()
      .references(() => programWeeks.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    dayOrder: integer("day_order").notNull(),
  },
  (table) => [index("idx_workout_days_week").on(table.weekId)]
);

export const workoutDaysRelations = relations(workoutDays, ({ one, many }) => ({
  week: one(programWeeks, {
    fields: [workoutDays.weekId],
    references: [programWeeks.id],
  }),
  dayExercises: many(dayExercises),
}));

export const exercises = pgTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  muscleGroupId: text("muscle_group_id").references(() => muscleGroups.id),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  targetSets: integer("target_sets").default(3),
  targetReps: text("target_reps").default("8-12"),
  restSeconds: integer("rest_seconds").default(90),
});

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  muscleGroup: one(muscleGroups, {
    fields: [exercises.muscleGroupId],
    references: [muscleGroups.id],
  }),
  dayExercises: many(dayExercises),
  alternatives: many(exerciseAlternatives, { relationName: "exercise" }),
  alternativeOf: many(exerciseAlternatives, { relationName: "alternative" }),
}));

export const dayExercises = pgTable(
  "day_exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dayId: uuid("day_id")
      .notNull()
      .references(() => workoutDays.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    exerciseOrder: integer("exercise_order").notNull(),
  },
  (table) => [index("idx_day_exercises_day").on(table.dayId)]
);

export const dayExercisesRelations = relations(dayExercises, ({ one }) => ({
  day: one(workoutDays, {
    fields: [dayExercises.dayId],
    references: [workoutDays.id],
  }),
  exercise: one(exercises, {
    fields: [dayExercises.exerciseId],
    references: [exercises.id],
  }),
}));

export const exerciseAlternatives = pgTable(
  "exercise_alternatives",
  {
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    alternativeId: text("alternative_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
  },
  (table) => [
    {
      pk: { columns: [table.exerciseId, table.alternativeId] },
    },
  ]
);

export const exerciseAlternativesRelations = relations(
  exerciseAlternatives,
  ({ one }) => ({
    exercise: one(exercises, {
      fields: [exerciseAlternatives.exerciseId],
      references: [exercises.id],
      relationName: "exercise",
    }),
    alternative: one(exercises, {
      fields: [exerciseAlternatives.alternativeId],
      references: [exercises.id],
      relationName: "alternative",
    }),
  })
);

export const workoutLogs = pgTable(
  "workout_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id),
    programInstanceId: uuid("program_instance_id"),
    dayId: uuid("day_id")
      .notNull()
      .references(() => workoutDays.id),
    startedAt: timestamp("started_at").notNull(),
    completedAt: timestamp("completed_at"),
    status: text("status", { enum: ["active", "paused", "completed"] }).default("active").notNull(),
    lastPausedAt: timestamp("last_paused_at"),
    accumulatedPauseSeconds: integer("accumulated_pause_seconds").default(0).notNull(),
    durationSeconds: integer("duration_seconds"),
    rating: integer("rating"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_workout_logs_user").on(table.userId),
    index("idx_workout_logs_date").on(table.startedAt),
    index("idx_workout_logs_instance").on(table.programInstanceId),
    index("idx_workout_logs_start_lookup").on(table.userId, table.programId, table.dayId, table.programInstanceId, table.startedAt),
  ]
);

export const workoutLogsRelations = relations(workoutLogs, ({ one, many }) => ({
  program: one(programs, {
    fields: [workoutLogs.programId],
    references: [programs.id],
  }),
  day: one(workoutDays, {
    fields: [workoutLogs.dayId],
    references: [workoutDays.id],
  }),
  exerciseLogs: many(exerciseLogs),
}));

export const exerciseLogs = pgTable(
  "exercise_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workoutLogId: uuid("workout_log_id")
      .notNull()
      .references(() => workoutLogs.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercises.id),
    exerciseName: text("exercise_name").notNull(),
    exerciseOrder: integer("exercise_order").notNull().default(0),
  },
  (table) => [
    index("idx_exercise_logs_workout").on(table.workoutLogId),
    index("idx_exercise_logs_exercise").on(table.exerciseId),
    index("idx_exercise_logs_workout_exercise").on(table.workoutLogId, table.exerciseId),
    index("idx_exercise_logs_lookup").on(table.workoutLogId, table.exerciseOrder),
  ]
);

export const exerciseLogsRelations = relations(exerciseLogs, ({ one, many }) => ({
  workoutLog: one(workoutLogs, {
    fields: [exerciseLogs.workoutLogId],
    references: [workoutLogs.id],
  }),
  exercise: one(exercises, {
    fields: [exerciseLogs.exerciseId],
    references: [exercises.id],
  }),
  setLogs: many(setLogs),
}));

export const setLogs = pgTable(
  "set_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    exerciseLogId: uuid("exercise_log_id")
      .notNull()
      .references(() => exerciseLogs.id, { onDelete: "cascade" }),
    setNumber: integer("set_number").notNull(),
    reps: integer("reps").notNull(),
    weight: decimal("weight", { precision: 10, scale: 2 }).notNull(),
    completed: boolean("completed").default(true),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_set_logs_exercise").on(table.exerciseLogId),
    index("idx_set_logs_exercise_number").on(table.exerciseLogId, table.setNumber),
    unique("uniq_set_log").on(table.exerciseLogId, table.setNumber),
  ]
);

export const setLogsRelations = relations(setLogs, ({ one }) => ({
  exerciseLog: one(exerciseLogs, {
    fields: [setLogs.exerciseLogId],
    references: [exerciseLogs.id],
  }),
}));

export type MuscleGroup = typeof muscleGroups.$inferSelect;
export type MuscleGroupInsert = typeof muscleGroups.$inferInsert;
export type Exercise = typeof exercises.$inferSelect;
export type ExerciseInsert = typeof exercises.$inferInsert;
export type Program = typeof programs.$inferSelect;
export type ProgramInsert = typeof programs.$inferInsert;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type WorkoutLogInsert = typeof workoutLogs.$inferInsert;
export type ExerciseLog = typeof exerciseLogs.$inferSelect;
export type SetLog = typeof setLogs.$inferSelect;
export type SetLogInsert = typeof setLogs.$inferInsert;
