-- Migration 0020: add email, mobile, and user_id to diet_plans table

ALTER TABLE diet_plans ADD COLUMN member_email VARCHAR(150);
ALTER TABLE diet_plans ADD COLUMN member_mobile VARCHAR(20);
ALTER TABLE diet_plans ADD COLUMN user_id INT;
