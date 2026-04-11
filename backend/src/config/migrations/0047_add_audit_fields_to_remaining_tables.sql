-- Migration 0047: Add created_by and updated_by audit fields to remaining tables for admin UUID tracking

-- Add audit fields to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS created_by CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by CHAR(36) NULL;

ALTER TABLE orders
  ADD INDEX IF NOT EXISTS idx_orders_created_by (created_by),
  ADD INDEX IF NOT EXISTS idx_orders_updated_by (updated_by);

-- Add audit fields to reviews table
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS created_by CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by CHAR(36) NULL;

ALTER TABLE reviews
  ADD INDEX IF NOT EXISTS idx_reviews_created_by (created_by),
  ADD INDEX IF NOT EXISTS idx_reviews_updated_by (updated_by);

-- Add audit fields to trainer_assignments table
ALTER TABLE trainer_assignments
  ADD COLUMN IF NOT EXISTS created_by CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by CHAR(36) NULL;

ALTER TABLE trainer_assignments
  ADD INDEX IF NOT EXISTS idx_trainer_assignments_created_by (created_by),
  ADD INDEX IF NOT EXISTS idx_trainer_assignments_updated_by (updated_by);

-- Add audit fields to attendance table
ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS created_by CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by CHAR(36) NULL;

ALTER TABLE attendance
  ADD INDEX IF NOT EXISTS idx_attendance_created_by (created_by),
  ADD INDEX IF NOT EXISTS idx_attendance_updated_by (updated_by);

-- Add audit fields to gym_facilities table
ALTER TABLE gym_facilities
  ADD COLUMN IF NOT EXISTS created_by CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by CHAR(36) NULL;

ALTER TABLE gym_facilities
  ADD INDEX IF NOT EXISTS idx_gym_facilities_created_by (created_by),
  ADD INDEX IF NOT EXISTS idx_gym_facilities_updated_by (updated_by);

-- Add audit fields to gym_equipment table
ALTER TABLE gym_equipment
  ADD COLUMN IF NOT EXISTS created_by CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by CHAR(36) NULL;

ALTER TABLE gym_equipment
  ADD INDEX IF NOT EXISTS idx_gym_equipment_created_by (created_by),
  ADD INDEX IF NOT EXISTS idx_gym_equipment_updated_by (updated_by);

-- Add audit fields to services table
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS created_by CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by CHAR(36) NULL;

ALTER TABLE services
  ADD INDEX IF NOT EXISTS idx_services_created_by (created_by),
  ADD INDEX IF NOT EXISTS idx_services_updated_by (updated_by);

-- Add audit fields to user_addresses table
ALTER TABLE user_addresses
  ADD COLUMN IF NOT EXISTS created_by CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by CHAR(36) NULL;

ALTER TABLE user_addresses
  ADD INDEX IF NOT EXISTS idx_user_addresses_created_by (created_by),
  ADD INDEX IF NOT EXISTS idx_user_addresses_updated_by (updated_by);

-- Add audit fields to message_history table
ALTER TABLE message_history
  ADD COLUMN IF NOT EXISTS created_by CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by CHAR(36) NULL;

ALTER TABLE message_history
  ADD INDEX IF NOT EXISTS idx_message_history_created_by (created_by),
  ADD INDEX IF NOT EXISTS idx_message_history_updated_by (updated_by);

-- Add audit fields to gym_plans table (if not already present)
ALTER TABLE gym_plans
  ADD COLUMN IF NOT EXISTS created_by CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by CHAR(36) NULL;

ALTER TABLE gym_plans
  ADD INDEX IF NOT EXISTS idx_gym_plans_created_by (created_by),
  ADD INDEX IF NOT EXISTS idx_gym_plans_updated_by (updated_by);
