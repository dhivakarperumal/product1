-- Migration 0035: add Google authentication columns to users table

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS picture VARCHAR(500);
