-- Migration 0046: Add created_by and updated_by to enquiries table

ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS created_by CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by CHAR(36) NULL;

ALTER TABLE enquiries
  ADD INDEX IF NOT EXISTS idx_enquiries_created_by (created_by),
  ADD INDEX IF NOT EXISTS idx_enquiries_updated_by (updated_by);
