-- Migration 0040: Add login fields to gym_members table

ALTER TABLE gym_members ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE gym_members ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member';

-- Add indexes for login performance
ALTER TABLE gym_members ADD INDEX IF NOT EXISTS idx_email_members (email);
ALTER TABLE gym_members ADD INDEX IF NOT EXISTS idx_mobile_members (phone);