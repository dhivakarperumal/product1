const db = require('./src/config/db');

async function checkStaffSchema() {
  try {
    console.log('🔍 Checking staff table schema...\n');
    
    // Get column information
    const [columns] = await db.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'staff' AND TABLE_SCHEMA = DATABASE()
       ORDER BY ORDINAL_POSITION`
    );

    console.log('Staff table columns:');
    console.log('='.repeat(50));
    columns.forEach(col => {
      console.log(`${col.COLUMN_NAME.padEnd(25)} ${col.COLUMN_TYPE.padEnd(20)} ${col.IS_NULLABLE}`);
    });

    console.log('\n' + '='.repeat(50));

    // Check if password_hash column exists
    const hasPasswordHash = columns.some(col => col.COLUMN_NAME === 'password_hash');
    console.log(`\n✅ password_hash column exists: ${hasPasswordHash ? 'YES' : 'NO'}`);

    // Check a trainer record
    console.log('\n🔍 Checking trainer data:\n');
    const [trainers] = await db.query(
      `SELECT id, name, email, password_hash FROM staff WHERE name = 'Deepu' LIMIT 1`
    );

    if (trainers.length > 0) {
      const trainer = trainers[0];
      console.log(`Trainer: ${trainer.name}`);
      console.log(`Email: ${trainer.email}`);
      console.log(`Password Hash Exists: ${trainer.password_hash ? 'YES' : 'NO'}`);
      if (trainer.password_hash) {
        console.log(`Hash Preview: ${trainer.password_hash.substring(0, 30)}...`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkStaffSchema();
