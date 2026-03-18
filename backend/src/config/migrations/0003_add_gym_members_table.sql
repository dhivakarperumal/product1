-- Migration 0003: create detailed gym_members table

CREATE TABLE IF NOT EXISTS gym_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100),
  gender VARCHAR(20),
  height DECIMAL(5,2),
  weight DECIMAL(5,2),
  bmi DECIMAL(5,2),
  plan VARCHAR(100),
  duration INT,
  join_date DATE DEFAULT CURDATE(),
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  photo TEXT,
  notes TEXT,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_gym_members_phone ON gym_members(phone);
CREATE INDEX idx_gym_members_member_id ON gym_members(member_id);
