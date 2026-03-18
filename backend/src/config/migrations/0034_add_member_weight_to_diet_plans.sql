-- Migration 0034: add member_weight to diet_plans table
ALTER TABLE diet_plans ADD COLUMN member_weight VARCHAR(20);
