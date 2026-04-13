-- Migration 0050: Enforce per-admin uniqueness for enquiry contact details

-- Drop existing indexes
ALTER TABLE enquiries DROP INDEX idx_enquiries_created_by;
ALTER TABLE enquiries DROP INDEX idx_enquiries_updated_by;

-- Add new composite unique indexes
ALTER TABLE enquiries
  ADD UNIQUE INDEX idx_enquiries_created_by_phone (created_by, phone),
  ADD UNIQUE INDEX idx_enquiries_created_by_email (created_by, email);