-- Migration 0015: add product_name and product_image snapshot columns to cart_items table

ALTER TABLE cart_items
  ADD COLUMN product_name VARCHAR(255) DEFAULT NULL,
  ADD COLUMN product_image TEXT DEFAULT NULL;