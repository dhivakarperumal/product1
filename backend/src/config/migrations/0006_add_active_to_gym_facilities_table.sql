-- Migration 0006: add active flag to gym_facilities table

ALTER TABLE gym_facilities
  ADD COLUMN IF NOT EXISTS active TINYINT(1) DEFAULT 1;

-- make sure existing rows are set to true if null
UPDATE gym_facilities SET active = 1 WHERE active IS NULL;
