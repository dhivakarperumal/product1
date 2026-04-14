-- Migration 0052: Ensure gym_plans created_by and updated_by store UUID values

ALTER TABLE gym_plans
  ADD COLUMN IF NOT EXISTS created_by CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by CHAR(36) NULL;

ALTER TABLE gym_plans
  MODIFY COLUMN created_by CHAR(36) NULL,
  MODIFY COLUMN updated_by CHAR(36) NULL;

UPDATE gym_plans
SET created_by = NULL
WHERE created_by = '0';

UPDATE gym_plans
SET updated_by = NULL
WHERE updated_by = '0';

ALTER TABLE gym_plans
  ADD INDEX IF NOT EXISTS idx_gym_plans_created_by (created_by),
  ADD INDEX IF NOT EXISTS idx_gym_plans_updated_by (updated_by);
