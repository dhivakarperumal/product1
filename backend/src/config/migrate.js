require('dotenv').config();
const fs = require('fs');
const path = require('path');
let db = require('./db');

const MIGRATION_TABLE = 'schema_migrations';
const migrationsDir = path.join(__dirname, 'migrations');

async function ensureMigrationTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrations() {
  const [result] = await db.query(`SELECT filename FROM ${MIGRATION_TABLE}`);
  return result.map(r => r.filename);
}

async function applyMigration(file) {
  console.log(`👉 applying ${file}`);
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
  
  // Split by semicolon and execute each statement
  const statements = sql.split(';').filter(stmt => stmt.trim());
  for (const stmt of statements) {
    if (stmt.trim()) {
      await db.query(stmt.trim());
    }
  }
  
  await db.query(`INSERT INTO ${MIGRATION_TABLE} (filename) VALUES (?)`, [file]);
}

async function runMigrations() {
  // sanity check: if password env var is empty warn user
  if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD === '') {
    console.warn('⚠️ DB_PASSWORD is empty or missing. If your database requires a password, set DB_PASSWORD in your .env file.');
  }

  try {
    // if the database doesn't exist, attempt to create it using the init script
    try {
      await ensureMigrationTable();
    } catch (err) {
      if (err.code === 'ER_NO_DB_ERROR') { // database does not exist
        console.warn('⚠️ Database does not exist, creating it now...');
        const initDb = require('./init');
        // init.js exits after running so spawn a separate process instead
        const spawn = require('child_process').spawnSync;
        const result = spawn(process.execPath, [require.resolve('./init')], { stdio: 'inherit' });
        if (result.status !== 0) {
          throw new Error('init-db script failed');
        }
        // reconnect pool by reloading module
        delete require.cache[require.resolve('./db')];
        db = require('./db');
        // ensure migrations table again
        await ensureMigrationTable();
      } else {
        throw err;
      }
    }

    const applied = await getAppliedMigrations();
    const files = fs
      .readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (!applied.includes(file)) {
        await applyMigration(file);
      } else {
        console.log(`✔ already applied: ${file}`);
      }
    }
    console.log('✅ all migrations executed');
  } catch (err) {
    console.error('migration error:', err.message);
    // don't call process.exit here so that the server process isn't killed
    // migrations are a convenience; if they fail the app can still start
    // and continue running, albeit without updated schema.
    // Rethrow so caller can optionally handle it (the startup IIFE already
    // logs errors).
    throw err;
  } finally {
    // no exit, let caller decide
  }
}

if (require.main === module) {
  // allow running directly from npm script
  (async () => {
    await runMigrations();
    process.exit(0);
  })();
}

module.exports = { runMigrations };
