-- Migration 0023: Update gym_plans table with complete schema for pricing page

ALTER TABLE gym_plans 
ADD COLUMN IF NOT EXISTS duration VARCHAR(50);

ALTER TABLE gym_plans 
ADD COLUMN IF NOT EXISTS trainer_included TINYINT(1) DEFAULT 0;

ALTER TABLE gym_plans 
ADD COLUMN IF NOT EXISTS facilities JSON;

ALTER TABLE gym_plans 
ADD COLUMN IF NOT EXISTS features JSON;
