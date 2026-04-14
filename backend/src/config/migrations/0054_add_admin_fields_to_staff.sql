-- Migration 0054: Add admin_uuid and audit fields to staff table

ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS admin_uuid CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS created_by CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by CHAR(36) NULL;

ALTER TABLE staff
  ADD INDEX IF NOT EXISTS idx_staff_admin_uuid (admin_uuid),
  ADD INDEX IF NOT EXISTS idx_staff_created_by (created_by),
  ADD INDEX IF NOT EXISTS idx_staff_updated_by (updated_by);
