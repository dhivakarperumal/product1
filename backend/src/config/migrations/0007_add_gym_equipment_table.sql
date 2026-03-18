-- Migration 0007: Create gym_equipment table

CREATE TABLE IF NOT EXISTS gym_equipment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  purchase_date DATE NOT NULL,
  `condition` VARCHAR(50) DEFAULT 'Good',
  status VARCHAR(50) DEFAULT 'available',
  service_due_month VARCHAR(7),
  under_warranty TINYINT(1) DEFAULT 0,
  under_maintenance TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create index on status for faster queries
CREATE INDEX idx_equipment_status ON gym_equipment(status);
CREATE INDEX idx_equipment_category ON gym_equipment(category);
