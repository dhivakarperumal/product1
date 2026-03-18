-- Migration 0010: add username and mobile columns to users table

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username VARCHAR(100),
  ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);

-- ensure username uniqueness when provided
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
