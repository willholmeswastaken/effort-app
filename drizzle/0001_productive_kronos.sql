ALTER TABLE "day_exercises" ALTER COLUMN "day_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "workout_days" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "workout_days" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "workout_logs" ALTER COLUMN "day_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "workout_logs" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "workout_logs" ADD COLUMN "last_paused_at" timestamp;--> statement-breakpoint
ALTER TABLE "workout_logs" ADD COLUMN "accumulated_pause_seconds" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_exercise_logs_exercise" ON "exercise_logs" USING btree ("exercise_id");