require('dotenv').config();
const db = require('./src/config/db');

async function fix() {
  try {
    // Remove the failed migration record
    await db.query('DELETE FROM schema_migrations WHERE filename = ?', ['0023_update_gym_plans_table.sql']);
    console.log('Old migration record removed');

    // Apply the migration manually with separate statements
    await db.query('ALTER TABLE gym_plans ADD COLUMN IF NOT EXISTS duration VARCHAR(50)');
    console.log('✅ Added duration column');

    await db.query('ALTER TABLE gym_plans ADD COLUMN IF NOT EXISTS trainer_included TINYINT(1) DEFAULT 0');
    console.log('✅ Added trainer_included column');

    await db.query('ALTER TABLE gym_plans ADD COLUMN IF NOT EXISTS facilities JSON');
    console.log('✅ Added facilities column');

    await db.query('ALTER TABLE gym_plans ADD COLUMN IF NOT EXISTS features JSON');
    console.log('✅ Added features column');

    // Record the migration as applied
    await db.query('INSERT INTO schema_migrations (filename) VALUES (?)', ['0023_update_gym_plans_table.sql']);

    console.log('✅ All gym_plans columns added successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fix();
