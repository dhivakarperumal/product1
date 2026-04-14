-- Migration 0052: Change member_id to UUID format (CHAR(36))

-- Update existing member_id values to UUIDs (using MySQL UUID function)
-- For existing records, we'll use a combination of UUID and sequential IDs
UPDATE members SET member_id = CONCAT(UUID(), '-', LPAD(id, 6, '0')) LIMIT 1000000;

-- Alter the member_id column type to CHAR(36)
ALTER TABLE members 
  MODIFY COLUMN member_id CHAR(36) NOT NULL,
  DROP INDEX idx_gym_members_member_id,
  ADD INDEX idx_members_member_id (member_id);

-- Verify the changes
-- SELECT COUNT(*) as total_members, MIN(LENGTH(member_id)) as min_len, MAX(LENGTH(member_id)) as max_len FROM members;
