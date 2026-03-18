require('dotenv').config();
const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  try {
    const migrationsDir = path.join(__dirname, 'src/config/migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    // ensure table exists to track applied migrations
    await db.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         filename VARCHAR(255) PRIMARY KEY,
         applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
       )`
    );

    for (const file of files) {
      const [existing] = await db.query(
        'SELECT filename FROM schema_migrations WHERE filename = ?',
        [file]
      );
      if (existing.length > 0) {
        console.log(`Skipping already applied migration: ${file}`);
        continue;
      }

      const migrationFile = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationFile, 'utf-8');
      console.log(`Applying migration ${file}...`);
      await db.query(sql);

      await db.query(
        `INSERT INTO schema_migrations (filename) VALUES (?)`,
        [file]
      );
      console.log(`✅ ${file} applied`);
    }

    console.log('All migrations processed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

applyMigration();
