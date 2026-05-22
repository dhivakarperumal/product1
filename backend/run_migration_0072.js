require("dotenv").config({ path: ".env.local" });
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "gym_user_db",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || ""
};

async function runMigration() {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    
    // Check if migration has already been applied
    const [existing] = await conn.execute(
      'SELECT filename FROM schema_migrations WHERE filename = ?',
      ['0072_add_date_of_birth_to_members.sql']
    );
    
    if (existing.length > 0) {
      console.log('✓ Migration 0072 already applied');
      await conn.end();
      return;
    }
    
    // Read and execute the migration
    const migrationFile = path.join(__dirname, 'src/config/migrations/0072_add_date_of_birth_to_members.sql');
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
    
    console.log('Running migration 0072...\n');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 80)}...`);
        await conn.execute(statement);
      }
    }
    
    // Record the migration
    await conn.execute(
      'INSERT INTO schema_migrations (filename, applied_at) VALUES (?, NOW())',
      ['0072_add_date_of_birth_to_members.sql']
    );
    
    console.log('\n✓ Migration 0072 applied successfully!');
    
    // Show the updated schema
    console.log('\n=== UPDATED MEMBERS TABLE SCHEMA ===\n');
    const [schema] = await conn.execute(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'members' AND TABLE_SCHEMA = DATABASE()
       ORDER BY ORDINAL_POSITION`
    );
    console.table(schema);
    
    await conn.end();
  } catch (err) {
    console.error('Error running migration:', err.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

runMigration();
