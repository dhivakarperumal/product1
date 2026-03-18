-- Migration 0024: make order_items.image a TEXT column to store longer data

ALTER TABLE order_items
  MODIFY COLUMN image TEXT;
