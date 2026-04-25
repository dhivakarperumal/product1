-- Migration 0064: Add user_id column to members table

ALTER TABLE members
  ADD COLUMN user_id INT NULL AFTER id;

ALTER TABLE members
  ADD INDEX idx_members_user_id (user_id);
