-- Migration 0045: Add created_by/updated_by to products and remove admin ownership columns

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS created_by CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by CHAR(36) NULL;

ALTER TABLE products
  DROP FOREIGN KEY IF EXISTS fk_products_created_by,
  DROP FOREIGN KEY IF EXISTS fk_products_updated_by;

ALTER TABLE products
  MODIFY COLUMN created_by CHAR(36) NULL,
  MODIFY COLUMN updated_by CHAR(36) NULL;

-- Populate the new audit columns from existing ownership fields when possible
UPDATE products p
JOIN users u ON p.admin_id = u.id
SET p.created_by = u.user_uuid,
    p.updated_by = u.user_uuid
WHERE p.admin_id IS NOT NULL
  AND u.user_uuid IS NOT NULL;

UPDATE products p
JOIN users u ON p.admin_uuid = u.user_uuid
SET p.created_by = u.user_uuid,
    p.updated_by = u.user_uuid
WHERE p.admin_uuid IS NOT NULL
  AND p.created_by IS NULL
  AND u.user_uuid IS NOT NULL;

ALTER TABLE products
  DROP COLUMN IF EXISTS admin_id,
  DROP COLUMN IF EXISTS admin_uuid;

ALTER TABLE products
  DROP INDEX IF EXISTS idx_products_created_by,
  DROP INDEX IF EXISTS idx_products_updated_by;

ALTER TABLE products
  ADD INDEX IF NOT EXISTS idx_products_created_by (created_by),
  ADD INDEX IF NOT EXISTS idx_products_updated_by (updated_by);
