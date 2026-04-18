-- Migration 0061: Ensure user_id is nullable in orders table

ALTER TABLE orders MODIFY COLUMN user_id INT NULL;
ALTER TABLE orders DROP FOREIGN KEY orders_ibfk_1;
ALTER TABLE orders ADD CONSTRAINT orders_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
