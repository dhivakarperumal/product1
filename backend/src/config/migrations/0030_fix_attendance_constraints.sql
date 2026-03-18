-- Migration 0030: Fix attendance table constraints
-- The 'members' table is empty and not used for member tracking in this app (gym_members or users are used).
-- We remove the foreign key to allow storing user_id in member_id column.

ALTER TABLE attendance DROP FOREIGN KEY attendance_ibfk_1;

-- Also ensure member_id is indexed for performance
CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance(member_id);
