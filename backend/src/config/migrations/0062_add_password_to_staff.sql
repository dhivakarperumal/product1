-- Migration 0062: Add password_hash to staff table for trainer login

ALTER TABLE staff ADD COLUMN password_hash VARCHAR(255) AFTER email;

CREATE INDEX idx_staff_email_username ON staff(email, username);
