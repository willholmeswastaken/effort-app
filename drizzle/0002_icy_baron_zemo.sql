ALTER TABLE "user_preferences" ADD COLUMN "active_program_instance_id" uuid;--> statement-breakpoint
ALTER TABLE "workout_logs" ADD COLUMN "program_instance_id" uuid;--> statement-breakpoint
CREATE INDEX "idx_workout_logs_instance" ON "workout_logs" USING btree ("program_instance_id");-->statement-breakpoint

-- Backfill: Generate a unique instance ID for each user+program combination
WITH instance_ids AS (
  SELECT DISTINCT user_id, program_id, gen_random_uuid() AS instance_id
  FROM workout_logs
)
UPDATE workout_logs wl
SET program_instance_id = ii.instance_id
FROM instance_ids ii
WHERE wl.user_id = ii.user_id AND wl.program_id = ii.program_id;-->statement-breakpoint

-- Set active_program_instance_id in user_preferences from the most recent workout instance
UPDATE user_preferences up
SET active_program_instance_id = (
  SELECT wl.program_instance_id
  FROM workout_logs wl
  WHERE wl.user_id = up.user_id AND wl.program_id = up.active_program_id
  ORDER BY wl.created_at DESC
  LIMIT 1
)
WHERE up.active_program_id IS NOT NULL;