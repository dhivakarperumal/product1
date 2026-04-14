-- Migration 0053: Add memberId to memberships table so memberships can link to gym members

ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS memberId INT(11) DEFAULT NULL;

ALTER TABLE memberships
  ADD INDEX IF NOT EXISTS idx_memberships_memberId (memberId);

ALTER TABLE memberships
  ADD CONSTRAINT fk_memberships_memberId FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE SET NULL;