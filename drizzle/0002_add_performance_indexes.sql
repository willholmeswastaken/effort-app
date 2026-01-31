-- Add composite index for faster workout queries by user, program, and completion status
CREATE INDEX idx_workout_logs_user_program_completed 
ON workout_logs (user_id, program_id, completed_at);

-- Add index for faster exercise log lookups by workout
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout_exercise 
ON exercise_logs (workout_log_id, exercise_id);
