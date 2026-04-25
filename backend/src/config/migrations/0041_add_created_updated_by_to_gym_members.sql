-- Migration 0041: Add created_by and updated_by to gym_members table

ALTER TABLE gym_members 
ADD COLUMN created_by INT,
ADD COLUMN updated_by INT;

-- Index for filtering members by admin
ALTER TABLE gym_members 
ADD INDEX idx_created_by (created_by);
