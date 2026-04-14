-- Migration 0051: Add created_by and updated_by audit fields to memberships table

ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS created_by CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by CHAR(36) NULL;

ALTER TABLE memberships
  ADD INDEX IF NOT EXISTS idx_memberships_created_by (created_by),
  ADD INDEX IF NOT EXISTS idx_memberships_updated_by (updated_by);
