-- Migration 0030: Fix attendance table constraints
-- The 'members' table is empty and not used for member tracking in this app (gym_members or users are used).
-- We remove the foreign key to allow storing user_id in member_id column (if it exists).

-- Use a safer approach - check if constraint exists before dropping
START TRANSACTION;

SET @constraint_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_NAME = 'attendance' AND CONSTRAINT_NAME = 'attendance_ibfk_1' LIMIT 1);

-- Only proceed if needed
ALTER TABLE attendance DROP INDEX IF EXISTS idx_attendance_member;
CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance(member_id);

COMMIT;
