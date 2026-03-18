-- Migration 0005: create gym_facilities table

CREATE TABLE IF NOT EXISTS gym_facilities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  short_description VARCHAR(255),
  description TEXT,
  hero_image TEXT,
  equipments JSON DEFAULT '[]',
  workouts JSON DEFAULT '[]',
  facilities JSON DEFAULT '[]',
  gallery JSON DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_gym_facilities_slug ON gym_facilities(slug);
