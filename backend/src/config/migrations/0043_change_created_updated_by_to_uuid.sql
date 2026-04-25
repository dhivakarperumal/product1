-- Migration 0043: Change created_by and updated_by columns to store user_uuid instead of user ID

-- Temporarily disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Drop all foreign key constraints that reference created_by or updated_by
ALTER TABLE gym_members 
DROP FOREIGN KEY IF EXISTS gym_members_ibfk_1;

ALTER TABLE gym_members 
DROP FOREIGN KEY IF EXISTS gym_members_ibfk_2;

ALTER TABLE gym_members 
DROP FOREIGN KEY IF EXISTS fk_gym_members_created_by;

ALTER TABLE gym_members 
DROP FOREIGN KEY IF EXISTS fk_gym_members_updated_by;

ALTER TABLE users 
DROP FOREIGN KEY IF EXISTS fk_users_created_by;

ALTER TABLE users 
DROP FOREIGN KEY IF EXISTS fk_users_updated_by;

-- Drop indexes on these columns if they exist
ALTER TABLE users 
DROP INDEX IF EXISTS idx_users_created_by;

ALTER TABLE users 
DROP INDEX IF EXISTS idx_users_updated_by;

ALTER TABLE gym_members 
DROP INDEX IF EXISTS idx_gym_members_created_by;

ALTER TABLE gym_members 
DROP INDEX IF EXISTS idx_gym_members_updated_by;

-- Change column types from INT to CHAR(36) for UUID storage  
ALTER TABLE users 
MODIFY COLUMN created_by CHAR(36) NULL,
MODIFY COLUMN updated_by CHAR(36) NULL;

ALTER TABLE gym_members 
MODIFY COLUMN created_by CHAR(36) NULL,
MODIFY COLUMN updated_by CHAR(36) NULL;

-- Add indexes on the new UUID columns for performance
ALTER TABLE users 
ADD INDEX idx_users_created_by (created_by),
ADD INDEX idx_users_updated_by (updated_by);

ALTER TABLE gym_members 
ADD INDEX idx_gym_members_created_by (created_by),
ADD INDEX idx_gym_members_updated_by (updated_by);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
