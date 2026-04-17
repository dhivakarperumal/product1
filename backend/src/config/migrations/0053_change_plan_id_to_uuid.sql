-- Migration 0053: Change plan_id to UUID format (CHAR(36))

-- Step 1: Drop existing index before modifying column
ALTER TABLE gym_plans DROP INDEX IF EXISTS idx_gym_plans_plan_id;

-- Step 2: Alter column to allow longer values
ALTER TABLE gym_plans MODIFY COLUMN plan_id VARCHAR(100) NULL;

-- Step 3: Update all existing plan_id values to UUIDs (convert from PL001, PL002, etc to real UUIDs)
UPDATE gym_plans SET plan_id = UUID() WHERE plan_id IS NOT NULL AND LENGTH(plan_id) <= 10;

-- Step 4: Make sure no NULL values remain
UPDATE gym_plans SET plan_id = UUID() WHERE plan_id IS NULL;

-- Step 5: Remove uniqueness constraint if it exists and re-add with new type
ALTER TABLE gym_plans DROP INDEX IF EXISTS idx_gym_plans_plan_id;

-- Step 6: Convert to CHAR(36) and add back as unique
ALTER TABLE gym_plans MODIFY COLUMN plan_id CHAR(36) NOT NULL UNIQUE;

-- Step 7: Add index for performance
CREATE INDEX idx_gym_plans_plan_id ON gym_plans(plan_id);
