-- Migration 0068: Drop deprecated trainer_assignments table

-- Once trainer assignment data is fully migrated into memberships, remove the legacy table.
DROP TABLE IF EXISTS trainer_assignments;
