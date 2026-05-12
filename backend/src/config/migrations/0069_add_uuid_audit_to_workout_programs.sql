-- Migration 0069: Normalize workout_programs identifiers to UUID-style values and backfill audit data

ALTER TABLE workout_programs
  MODIFY COLUMN created_by CHAR(36) NULL,
  MODIFY COLUMN updated_by CHAR(36) NULL;

ALTER TABLE workout_programs
  ADD INDEX IF NOT EXISTS idx_workout_programs_created_by (created_by),
  ADD INDEX IF NOT EXISTS idx_workout_programs_updated_by (updated_by);

-- Backfill numeric trainer_id values from staff.id to staff.employee_id
UPDATE workout_programs wp
INNER JOIN staff s ON wp.trainer_id = CAST(s.id AS CHAR)
SET wp.trainer_id = s.employee_id
WHERE wp.trainer_id REGEXP '^[0-9]+$'
  AND s.employee_id IS NOT NULL;

-- Backfill numeric member_id values from members.id to members.member_id
UPDATE workout_programs wp
INNER JOIN members m ON wp.member_id = CAST(m.id AS CHAR)
SET wp.member_id = m.member_id
WHERE wp.member_id REGEXP '^[0-9]+$'
  AND m.member_id IS NOT NULL;

-- Backfill created_by and updated_by from users IDs to UUIDs
UPDATE workout_programs wp
INNER JOIN users u ON wp.created_by = u.id
SET wp.created_by = u.user_uuid
WHERE wp.created_by IS NOT NULL;

UPDATE workout_programs wp
INNER JOIN users u ON wp.updated_by = u.id
SET wp.updated_by = u.user_uuid
WHERE wp.updated_by IS NOT NULL;

-- Backfill created_by and updated_by from staff IDs to trainer employee UUIDs
UPDATE workout_programs wp
INNER JOIN staff s ON wp.created_by = s.id
SET wp.created_by = s.employee_id
WHERE wp.created_by IS NOT NULL;

UPDATE workout_programs wp
INNER JOIN staff s ON wp.updated_by = s.id
SET wp.updated_by = s.employee_id
WHERE wp.updated_by IS NOT NULL;

-- Backfill created_by and updated_by from member IDs to member UUIDs
UPDATE workout_programs wp
INNER JOIN members m ON wp.created_by = m.id
SET wp.created_by = m.member_id
WHERE wp.created_by IS NOT NULL;

UPDATE workout_programs wp
INNER JOIN members m ON wp.updated_by = m.id
SET wp.updated_by = m.member_id
WHERE wp.updated_by IS NOT NULL;
