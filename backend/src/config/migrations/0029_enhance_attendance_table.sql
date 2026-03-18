-- Migration 0029: Enhance attendance table for trainer marking
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS trainer_id INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Present',
ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 8) NULL,
ADD COLUMN IF NOT EXISTS lng DECIMAL(11, 8) NULL,
ADD COLUMN IF NOT EXISTS date DATE DEFAULT NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_trainer ON attendance(trainer_id);
