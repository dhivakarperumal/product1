-- Migration 0009: create services table

CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id VARCHAR(50) UNIQUE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255),
  short_desc TEXT,
  description TEXT,
  hero_image TEXT,
  points TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_services_slug ON services(slug);
CREATE INDEX idx_services_service_id ON services(service_id);
