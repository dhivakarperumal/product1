-- Migration 0032: Add location_name to attendance table
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS location_name TEXT;
