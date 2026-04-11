-- Migration 0036: add admin ownership fields to users and products tables

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS admin_id INT NULL;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS admin_id INT NULL;

-- Make admin users self-owned so admin scoping works for existing admin rows
UPDATE users
SET admin_id = id
WHERE role = 'admin' AND admin_id IS NULL;
