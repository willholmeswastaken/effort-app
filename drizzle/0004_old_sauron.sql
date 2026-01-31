CREATE INDEX "idx_exercise_logs_workout_exercise" ON "exercise_logs" USING btree ("workout_log_id","exercise_id");--> statement-breakpoint
CREATE INDEX "idx_exercise_logs_lookup" ON "exercise_logs" USING btree ("workout_log_id","exercise_order");--> statement-breakpoint
CREATE INDEX "idx_set_logs_exercise_number" ON "set_logs" USING btree ("exercise_log_id","set_number");--> statement-breakpoint
CREATE INDEX "idx_workout_days_week" ON "workout_days" USING btree ("week_id");--> statement-breakpoint
CREATE INDEX "idx_workout_logs_start_lookup" ON "workout_logs" USING btree ("user_id","program_id","day_id","program_instance_id","started_at");