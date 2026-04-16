-- Migration 0040: Add login fields to members table

ALTER TABLE members ADD COLUMN password_hash TEXT;
ALTER TABLE members ADD COLUMN role VARCHAR(50) DEFAULT 'member';

-- Add indexes for login performance
ALTER TABLE members ADD INDEX idx_email_members (email);
ALTER TABLE members ADD INDEX idx_username_members (username);
ALTER TABLE members ADD INDEX idx_mobile_members (phone);