-- Migration 0017: create diet_plans table

CREATE TABLE IF NOT EXISTS diet_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trainer_id INT NOT NULL,
  trainer_name VARCHAR(100),
  trainer_source VARCHAR(50),
  member_id INT NOT NULL,
  member_name VARCHAR(100),
  title VARCHAR(255),
  total_calories INT,
  duration INT,
  days JSON,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);