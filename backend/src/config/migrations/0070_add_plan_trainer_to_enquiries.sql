-- Migration 0070: Add plan and trainer references to enquiries

ALTER TABLE enquiries
  ADD COLUMN plan_id VARCHAR(255) NULL,
  ADD COLUMN trainer_id VARCHAR(255) NULL;
