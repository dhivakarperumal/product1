-- Migration 0053: Change plan_id to UUID format (CHAR(36))

-- Update existing plan_id values to UUIDs
UPDATE gym_plans SET plan_id = UUID();

-- Alter the plan_id column type to CHAR(36)
ALTER TABLE gym_plans 
  MODIFY COLUMN plan_id CHAR(36) NOT NULL,
  DROP INDEX idx_gym_plans_plan_id,
  ADD INDEX idx_gym_plans_plan_id (plan_id);

-- Verify the changes
-- SELECT COUNT(*) as total_plans, MIN(LENGTH(plan_id)) as min_len, MAX(LENGTH(plan_id)) as max_len FROM gym_plans;
