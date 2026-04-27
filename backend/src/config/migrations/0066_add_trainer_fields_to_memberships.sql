-- Migration 0066: Add trainer fields to memberships table

ALTER TABLE memberships 
ADD COLUMN trainerId INT AFTER paymentMode,
ADD COLUMN trainerName VARCHAR(100) AFTER trainerId,
ADD COLUMN trainerEmployeeId VARCHAR(50) AFTER trainerName;

-- Add foreign key constraint to staff table
ALTER TABLE memberships 
ADD CONSTRAINT fk_memberships_trainer 
FOREIGN KEY (trainerId) REFERENCES staff(id) ON DELETE SET NULL;

-- Create index for trainer queries
CREATE INDEX idx_memberships_trainer_id ON memberships(trainerId);

-- Update existing memberships with trainer info from trainer_assignments if available
UPDATE memberships m
INNER JOIN trainer_assignments ta ON m.userId = ta.user_id AND m.planId = ta.plan_id
LEFT JOIN staff s ON ta.trainer_id = s.id
SET 
  m.trainerId = ta.trainer_id,
  m.trainerName = ta.trainer_name,
  m.trainerEmployeeId = s.employee_id
WHERE m.trainerId IS NULL;
