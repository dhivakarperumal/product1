-- Migration 0067: Add EMI (Equated Monthly Installment) support

-- Add EMI fields to memberships table
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS isEMI TINYINT(1) DEFAULT 0 AFTER paymentMode;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS emiMonths INT DEFAULT 0 AFTER isEMI;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS emiAmount DECIMAL(10,2) DEFAULT 0 AFTER emiMonths;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS emiStartDate DATE AFTER emiAmount;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS totalAmount DECIMAL(10,2) AFTER emiStartDate;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS nextEMIDate DATE AFTER totalAmount;

-- Create EMI payments tracking table
CREATE TABLE IF NOT EXISTS emi_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  membershipId INT NOT NULL,
  installmentNumber INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  dueDate DATE NOT NULL,
  paidDate DATE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, overdue, cancelled
  paymentMethod VARCHAR(50),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (membershipId) REFERENCES memberships(id) ON DELETE CASCADE,
  UNIQUE KEY unique_membership_installment (membershipId, installmentNumber)
);

CREATE INDEX idx_emi_payments_status ON emi_payments(status);
CREATE INDEX idx_emi_payments_dueDate ON emi_payments(dueDate);
CREATE INDEX idx_emi_payments_membershipId ON emi_payments(membershipId);
