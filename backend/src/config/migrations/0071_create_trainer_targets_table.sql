CREATE TABLE IF NOT EXISTS trainer_targets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trainer_id VARCHAR(255) NOT NULL,
  trainer_name VARCHAR(255),
  assigned_days INT NOT NULL DEFAULT 0,
  assigned_amount DECIMAL(13,2) NOT NULL DEFAULT 0,
  total_membership_collected DECIMAL(13,2) NOT NULL DEFAULT 0,
  total_order_collected DECIMAL(13,2) NOT NULL DEFAULT 0,
  combined_total DECIMAL(13,2) NOT NULL DEFAULT 0,
  payment_history TEXT,
  admin_uuid VARCHAR(255),
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_trainer_id (trainer_id)
);
