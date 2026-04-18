-- Migration 0060: Add member_uuid to orders table

ALTER TABLE orders ADD COLUMN IF NOT EXISTS member_uuid VARCHAR(255) AFTER user_id;
