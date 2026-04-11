-- Migration 0042: Add admin_id to workout_programs and diet_plans

ALTER TABLE workout_programs 
ADD COLUMN admin_id INT,
ADD FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE diet_plans 
ADD COLUMN admin_id INT,
ADD FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;

-- Index for filtering by admin
ALTER TABLE workout_programs ADD INDEX idx_admin_id (admin_id);
ALTER TABLE diet_plans ADD INDEX idx_admin_id (admin_id);
