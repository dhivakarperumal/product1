-- Migration 0058: Add plan_id (UUID) column to memberships table

-- Add plan_id column to store the UUID from gym_plans table
ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS plan_id CHAR(36) NULL;

-- Add index for plan_id
ALTER TABLE memberships
  ADD INDEX IF NOT EXISTS idx_memberships_plan_id (plan_id);
