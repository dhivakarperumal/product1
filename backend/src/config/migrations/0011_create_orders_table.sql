-- Migration 0011: create orders table

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(100) UNIQUE NOT NULL,
  user_id INT,
  status VARCHAR(50) NOT NULL DEFAULT 'orderPlaced',
  payment_status VARCHAR(50) DEFAULT 'pending',
  total DECIMAL(10,2) DEFAULT 0,
  order_type VARCHAR(50),
  shipping JSON,
  pickup JSON,
  order_track JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
