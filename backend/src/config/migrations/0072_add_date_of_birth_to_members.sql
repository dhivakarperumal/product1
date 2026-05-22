-- Migration 0072: Add date_of_birth column to members table

ALTER TABLE members ADD COLUMN date_of_birth DATE NULL AFTER gender;

CREATE INDEX idx_members_date_of_birth ON members(date_of_birth);
