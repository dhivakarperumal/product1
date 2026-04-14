-- Migration 0059: Fix memberships table to properly store member_id (UUID) and plan_id (UUID)
-- 
-- IMPORTANT: This migration is REQUIRED for the buy plan feature to work correctly.
-- 
-- The issue: 
--   - Originally userId and planId columns were INT (referencing users.id and gym_plans.id)
--   - But members and plans now use UUID (CHAR(36)) identifiers
--   - So we need to store UUID values, not INT values
--
-- What this fix does:
--   - Changes member_id column from INT to CHAR(36) to store member_id UUID
--   - Adds plan_id column as CHAR(36) to store plan_id UUID
--   - Updates foreign key constraints to reference UUID columns
--
-- Data flow:
--   1. Frontend sends: userId (member integer ID), planId (plan integer ID)
--   2. Backend looks up the UUIDs from integer IDs
--   3. Backend stores in memberships table:
--      - userId column = member_id UUID (UUID from members.member_id)
--      - planId column = plan_id UUID (UUID from gym_plans.plan_id)
--      - member_id column = member_id UUID (reference)
--      - plan_id column = plan_id UUID (reference)

-- First, drop the old foreign key constraints that reference INT values
ALTER TABLE memberships
  DROP FOREIGN KEY IF EXISTS `fk_memberships_member_id`;

-- Make member_id store the actual member_id UUID (CHAR(36)) instead of INT
ALTER TABLE memberships
  MODIFY COLUMN member_id CHAR(36) NULL;

-- Update existing foreign key for member_id to reference members(member_id) instead of members(id)
ALTER TABLE memberships
  ADD CONSTRAINT fk_memberships_member_id FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE;

-- Ensure plan_id column exists and is CHAR(36) for UUID storage
ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS plan_id CHAR(36) NULL;

-- Update foreign key for plan_id if it exists and is incorrect
ALTER TABLE memberships
  DROP FOREIGN KEY IF EXISTS `fk_memberships_plan_id`,
  ADD CONSTRAINT fk_memberships_plan_id FOREIGN KEY (plan_id) REFERENCES gym_plans(plan_id) ON DELETE CASCADE;

-- Add/update indexes
ALTER TABLE memberships
  ADD INDEX IF NOT EXISTS idx_memberships_member_id (member_id),
  ADD INDEX IF NOT EXISTS idx_memberships_plan_id (plan_id);

-- Optional: Drop the old INT-based foreign keys if they reference the wrong tables
ALTER TABLE memberships
  DROP FOREIGN KEY IF EXISTS memberships_ibfk_1,
  DROP FOREIGN KEY IF EXISTS memberships_ibfk_2;
