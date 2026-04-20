-- Migration 0060: Add admin_uuid column to orders and memberships for admin isolation
-- Allows filtering orders/memberships by creating admin so each admin only sees their own members' records

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS admin_uuid CHAR(36) NULL COMMENT 'UUID of admin who created this order',
  ADD INDEX IF NOT EXISTS idx_orders_admin_uuid (admin_uuid);

ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS admin_uuid CHAR(36) NULL COMMENT 'UUID of admin who created this membership',
  ADD INDEX IF NOT EXISTS idx_memberships_admin_uuid (admin_uuid);

-- Add member_uuid to orders if not exists (for referencing members table)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS member_uuid CHAR(36) NULL COMMENT 'UUID of member for this order',
  ADD INDEX IF NOT EXISTS idx_orders_member_uuid (member_uuid);
