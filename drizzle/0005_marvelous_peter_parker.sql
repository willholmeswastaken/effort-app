ALTER TABLE "day_exercises" ADD COLUMN "target_sets_override" integer;--> statement-breakpoint
ALTER TABLE "day_exercises" ADD COLUMN "target_reps_override" text;--> statement-breakpoint
ALTER TABLE "day_exercises" ADD COLUMN "rest_seconds_override" integer;--> statement-breakpoint
ALTER TABLE "exercise_logs" ADD COLUMN "target_sets" integer DEFAULT 3;--> statement-breakpoint
ALTER TABLE "exercise_logs" ADD COLUMN "target_reps" text DEFAULT '8-12';--> statement-breakpoint
ALTER TABLE "exercise_logs" ADD COLUMN "rest_seconds" integer DEFAULT 90;--> statement-breakpoint
ALTER TABLE "exercise_logs" ADD COLUMN "video_url" text;--> statement-breakpoint
ALTER TABLE "exercise_logs" ADD COLUMN "thumbnail_url" text;--> statement-breakpoint
ALTER TABLE "exercise_logs" ADD COLUMN "sets_snapshot" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workout_logs" ADD COLUMN "program_name" text;--> statement-breakpoint
ALTER TABLE "workout_logs" ADD COLUMN "day_title" text;--> statement-breakpoint
ALTER TABLE "workout_logs" ADD COLUMN "day_exercises_snapshot" text;