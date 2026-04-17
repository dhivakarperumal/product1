-- Migration 0040: Add login fields to members table

ALTER TABLE members ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member';

-- Add indexes for login performance
ALTER TABLE members ADD INDEX IF NOT EXISTS idx_email_members (email);
ALTER TABLE members ADD INDEX IF NOT EXISTS idx_username_members (username);
ALTER TABLE members ADD INDEX IF NOT EXISTS idx_mobile_members (phone);