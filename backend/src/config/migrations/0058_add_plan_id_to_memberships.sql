-- Migration 0058: Add plan_id (UUID) column to memberships table

-- Add plan_id column to store the UUID from gym_plans table
ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS plan_id CHAR(36) NULL;

-- Add a foreign key constraint for plan_id referencing gym_plans(plan_id)
ALTER TABLE memberships
  DROP FOREIGN KEY IF EXISTS fk_memberships_plan_id,
  ADD CONSTRAINT fk_memberships_plan_id FOREIGN KEY (plan_id) REFERENCES gym_plans(plan_id) ON DELETE CASCADE;

-- Add index for plan_id
ALTER TABLE memberships
  ADD INDEX IF NOT EXISTS idx_memberships_plan_id (plan_id);

-- Populate existing plan_id values from planId using gym_plans lookup (optional - for existing records)
-- UPDATE memberships m 
-- JOIN gym_plans gp ON gp.id = m.planId 
-- SET m.plan_id = gp.plan_id 
-- WHERE m.plan_id IS NULL;
