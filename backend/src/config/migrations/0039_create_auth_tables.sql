-- Migration 0039: Create authentication tables

-- Create superadmins table if not exists
CREATE TABLE IF NOT EXISTS superadmins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  username VARCHAR(100),
  mobile VARCHAR(20),
  role VARCHAR(50) DEFAULT 'super admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username)
);

-- Create members authentication table (separate from gym_members)
CREATE TABLE IF NOT EXISTS members_auth (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  username VARCHAR(100),
  mobile VARCHAR(20),
  role VARCHAR(50) DEFAULT 'member',
  admin_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_admin_id (admin_id),
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);