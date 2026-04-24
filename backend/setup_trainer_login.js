const fs = require('fs');
const path = require('path');
const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function runMigration() {
  try {
    console.log('🚀 Running migration 0062 to add password_hash to staff table...\n');
    
    const migrationPath = path.join(__dirname, 'src/config/migrations/0062_add_password_to_staff.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.query(statement);
          console.log('✅ Executed:', statement.substring(0, 50) + '...');
        } catch (err) {
          // Column might already exist, that's ok
          if (err.code !== 'ER_DUP_FIELDNAME') {
            throw err;
          }
          console.log('⚠️  Column already exists, skipping...');
        }
      }
    }
    
    console.log('\n✅ Migration completed!\n');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    throw err;
  }
}

async function setTrainerPasswords() {
  try {
    console.log('🔐 Setting passwords for trainers without passwords...\n');
    
    // Get all trainers without passwords
    const [trainers] = await db.query(
      `SELECT id, email, username, name FROM staff 
       WHERE role = 'trainer' AND (password_hash IS NULL OR password_hash = '')`
    );

    if (trainers.length === 0) {
      console.log('✅ All trainers already have passwords set!');
      return;
    }

    console.log(`Found ${trainers.length} trainers without passwords:\n`);
    
    // For each trainer, use their name as password or a default
    for (const trainer of trainers) {
      // Use a default password pattern
      const defaultPassword = `${trainer.name?.toLowerCase().replace(/\s/g, '') || 'trainer'}@123`;
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      await db.query(
        `UPDATE staff SET password_hash = ? WHERE id = ?`,
        [hashedPassword, trainer.id]
      );
      
      console.log(`✅ Trainer: ${trainer.name}`);
      console.log(`   Email/Username: ${trainer.email || trainer.username}`);
      console.log(`   Temporary Password: ${defaultPassword}`);
      console.log(`   Status: Password set (hash: ${hashedPassword.substring(0, 20)}...)\n`);
    }

    console.log(`✅ Successfully set passwords for ${trainers.length} trainers!`);
  } catch (err) {
    console.error('❌ Error setting trainer passwords:', err.message);
    throw err;
  }
}

async function main() {
  try {
    await runMigration();
    await setTrainerPasswords();
    console.log('\n🎉 Trainer login setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
  }
}

main();
