-- Migration 0059: Add billing address to orders table

ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_address JSON AFTER shipping;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_name VARCHAR(255) AFTER billing_address;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255) AFTER billing_name;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_phone VARCHAR(20) AFTER billing_email;

-- Create index for faster queries (using IF NOT EXISTS for idempotency)
CREATE INDEX IF NOT EXISTS idx_orders_billing_phone ON orders(billing_phone);
