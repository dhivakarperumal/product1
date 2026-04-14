-- Migration 0056: Change employee_id to UUID format (CHAR(36))

-- Update existing employee_id values to UUIDs
UPDATE staff SET employee_id = UUID();

-- Alter the employee_id column type to CHAR(36)
ALTER TABLE staff 
  MODIFY COLUMN employee_id CHAR(36) NOT NULL,
  DROP INDEX idx_staff_employee_id,
  ADD INDEX idx_staff_employee_id (employee_id);

-- Verify the changes
-- SELECT COUNT(*) as total_staff, MIN(LENGTH(employee_id)) as min_len, MAX(LENGTH(employee_id)) as max_len FROM staff;
