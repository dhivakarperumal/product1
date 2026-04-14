-- Migration 0057: Update memberships table to reference members instead of users

-- Make userId nullable since members may not have a linked user
ALTER TABLE memberships 
  MODIFY COLUMN userId INT NULL;

-- Add member_id to track which member this membership belongs to
ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS member_id INT NULL,
  ADD COLUMN IF NOT EXISTS member_name VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS member_email VARCHAR(100) NULL;

-- Add foreign key constraint for member_id
ALTER TABLE memberships
  ADD CONSTRAINT fk_memberships_member_id FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

-- Add index for member_id
ALTER TABLE memberships
  ADD INDEX IF NOT EXISTS idx_memberships_member_id (member_id);
