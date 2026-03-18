-- Migration 0023: ensure updated_at column exists on user_addresses

ALTER TABLE user_addresses
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
