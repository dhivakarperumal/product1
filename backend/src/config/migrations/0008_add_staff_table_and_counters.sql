-- Migration 0008: create staff table and counters table

CREATE TABLE IF NOT EXISTS counters (
  name VARCHAR(100) PRIMARY KEY,
  current INT DEFAULT 0
);

-- staff table
CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(50) UNIQUE,
  username VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  role VARCHAR(100),
  department VARCHAR(100),
  gender VARCHAR(50),
  blood_group VARCHAR(10),
  dob DATE,
  joining_date DATE,
  qualification TEXT,
  experience TEXT,
  shift VARCHAR(100),
  salary DECIMAL(12,2),
  address TEXT,
  emergency_name VARCHAR(255),
  emergency_phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  time_in VARCHAR(10),
  time_out VARCHAR(10),
  photo TEXT,
  aadhar_doc TEXT,
  id_doc TEXT,
  certificate_doc TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_employee_id ON staff(employee_id);
CREATE INDEX idx_staff_role ON staff(role);
