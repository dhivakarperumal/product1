-- Migration 0055: Remove foreign key constraints on staff audit fields

-- Drop the problematic foreign key constraint on created_by
ALTER TABLE staff DROP FOREIGN KEY IF EXISTS fk_staff_created_by;

-- Drop the problematic foreign key constraint on updated_by if it exists
ALTER TABLE staff DROP FOREIGN KEY IF EXISTS fk_staff_updated_by;

-- Ensure the columns are properly typed and nullable for audit purposes
ALTER TABLE staff
  MODIFY COLUMN created_by CHAR(36) NULL,
  MODIFY COLUMN updated_by CHAR(36) NULL;
