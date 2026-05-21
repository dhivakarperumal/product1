-- Migration 0070: Normalize diet_plans audit fields to UUIDs and backfill trainer/member identifiers

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE diet_plans
  MODIFY COLUMN created_by CHAR(36) NULL,
  MODIFY COLUMN updated_by CHAR(36) NULL;

ALTER TABLE diet_plans
  ADD INDEX IF NOT EXISTS idx_diet_plans_created_by (created_by),
  ADD INDEX IF NOT EXISTS idx_diet_plans_updated_by (updated_by);

-- Backfill numeric trainer_id values from staff.id to staff.employee_id
UPDATE diet_plans dp
INNER JOIN staff s ON dp.trainer_id COLLATE utf8mb4_unicode_ci = CAST(s.id AS CHAR) COLLATE utf8mb4_unicode_ci
SET dp.trainer_id = s.employee_id
WHERE dp.trainer_id REGEXP '^[0-9]+$'
  AND s.employee_id IS NOT NULL;

-- Backfill numeric member_id values from members.id to members.member_id
UPDATE diet_plans dp
INNER JOIN members m ON dp.member_id COLLATE utf8mb4_unicode_ci = CAST(m.id AS CHAR) COLLATE utf8mb4_unicode_ci
SET dp.member_id = m.member_id
WHERE dp.member_id REGEXP '^[0-9]+$'
  AND m.member_id IS NOT NULL;

-- Backfill created_by and updated_by from users IDs to UUIDs
UPDATE diet_plans dp
INNER JOIN users u ON dp.created_by COLLATE utf8mb4_unicode_ci = CAST(u.id AS CHAR) COLLATE utf8mb4_unicode_ci
SET dp.created_by = u.user_uuid
WHERE dp.created_by IS NOT NULL;

UPDATE diet_plans dp
INNER JOIN users u ON dp.updated_by COLLATE utf8mb4_unicode_ci = CAST(u.id AS CHAR) COLLATE utf8mb4_unicode_ci
SET dp.updated_by = u.user_uuid
WHERE dp.updated_by IS NOT NULL;

-- Backfill created_by and updated_by from staff IDs to staff.employee_id
UPDATE diet_plans dp
INNER JOIN staff s ON dp.created_by COLLATE utf8mb4_unicode_ci = CAST(s.id AS CHAR) COLLATE utf8mb4_unicode_ci
SET dp.created_by = s.employee_id
WHERE dp.created_by IS NOT NULL;

UPDATE diet_plans dp
INNER JOIN staff s ON dp.updated_by COLLATE utf8mb4_unicode_ci = CAST(s.id AS CHAR) COLLATE utf8mb4_unicode_ci
SET dp.updated_by = s.employee_id
WHERE dp.updated_by IS NOT NULL;

-- Backfill created_by and updated_by from member IDs to member UUIDs
UPDATE diet_plans dp
INNER JOIN members m ON dp.created_by COLLATE utf8mb4_unicode_ci = CAST(m.id AS CHAR) COLLATE utf8mb4_unicode_ci
SET dp.created_by = m.member_id
WHERE dp.created_by IS NOT NULL;

UPDATE diet_plans dp
INNER JOIN members m ON dp.updated_by COLLATE utf8mb4_unicode_ci = CAST(m.id AS CHAR) COLLATE utf8mb4_unicode_ci
SET dp.updated_by = m.member_id
WHERE dp.updated_by IS NOT NULL;

SET FOREIGN_KEY_CHECKS = 1;
