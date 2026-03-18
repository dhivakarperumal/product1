-- Migration 0019: add email, mobile, and user_id to workout_programs table

ALTER TABLE workout_programs ADD COLUMN member_email VARCHAR(150);
ALTER TABLE workout_programs ADD COLUMN member_mobile VARCHAR(20);
ALTER TABLE workout_programs ADD COLUMN user_id INT;
