-- Migration 0013: create trainer_assignments table

CREATE TABLE IF NOT EXISTS trainer_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  username VARCHAR(100),
  user_email VARCHAR(100),
  plan_id VARCHAR(50),
  plan_name VARCHAR(100),
  plan_duration VARCHAR(50),
  plan_start_date DATE,
  plan_end_date DATE,
  plan_price DECIMAL(10,2) DEFAULT 0,
  trainer_id INT NOT NULL,
  trainer_name VARCHAR(100),
  trainer_source VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_plan (user_id, plan_id)
);
