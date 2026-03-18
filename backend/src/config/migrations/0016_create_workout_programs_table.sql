-- Migration 0016: create workout_programs table

CREATE TABLE IF NOT EXISTS workout_programs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trainer_id INT NOT NULL,
  trainer_name VARCHAR(100),
  trainer_source VARCHAR(50),
  member_id INT NOT NULL,
  member_name VARCHAR(100),
  category VARCHAR(100),
  level VARCHAR(50),
  goal VARCHAR(255),
  duration_weeks INT,
  days JSON,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);