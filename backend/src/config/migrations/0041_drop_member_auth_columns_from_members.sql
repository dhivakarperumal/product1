-- Migration 0041: Remove legacy auth columns from members table

ALTER TABLE members
  DROP COLUMN IF EXISTS username,
  DROP COLUMN IF EXISTS password_hash;

DROP INDEX IF EXISTS idx_username_members ON members;
DROP INDEX IF EXISTS idx_mobile_members ON members;
