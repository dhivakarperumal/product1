-- Migration 0049: Enforce per-admin uniqueness for member contact details

-- Drop existing unique constraint on phone
ALTER TABLE members DROP INDEX phone;

-- Drop existing index on phone
ALTER TABLE members DROP INDEX idx_gym_members_phone;

-- Add new composite unique indexes
ALTER TABLE members
  ADD UNIQUE INDEX idx_members_created_by_phone (created_by, phone),
  ADD UNIQUE INDEX idx_members_created_by_email (created_by, email);
