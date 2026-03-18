-- Migration 0004: create gym_plans table

CREATE TABLE IF NOT EXISTS gym_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  duration VARCHAR(50),
  price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(5,2) DEFAULT 0,
  final_price DECIMAL(10,2),
  facilities JSON DEFAULT '[]',
  trainer_included TINYINT(1) DEFAULT 0,
  diet_plans JSON DEFAULT '[]',
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_gym_plans_plan_id ON gym_plans(plan_id);
CREATE INDEX idx_gym_plans_active ON gym_plans(active);
