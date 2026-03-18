-- Migration 0018: create order_items table

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL,
  product_id INT,
  product_name VARCHAR(255),
  price DECIMAL(10,2),
  qty INT DEFAULT 1,
  size VARCHAR(50),
  color VARCHAR(50),
  image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);
