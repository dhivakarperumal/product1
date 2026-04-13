-- Migration 0048: Add height, weight, and bmi columns to enquiries table

ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS height DECIMAL(5,2) NULL AFTER location,
  ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2) NULL AFTER height,
  ADD COLUMN IF NOT EXISTS bmi DECIMAL(5,2) NULL AFTER weight;
