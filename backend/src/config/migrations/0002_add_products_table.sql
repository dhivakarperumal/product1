-- migration 0002: add products table

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100) NOT NULL,
  description TEXT,
  ratings INT DEFAULT 0,
  weight JSON DEFAULT '[]',
  size JSON DEFAULT '[]',
  gender JSON DEFAULT '[]',
  mrp DECIMAL(10,2) DEFAULT 0,
  offer INT DEFAULT 0,
  offer_price DECIMAL(10,2) DEFAULT 0,
  stock JSON DEFAULT '{}',
  images JSON DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
