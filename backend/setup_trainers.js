const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function setTrainerPasswordsSimple() {
  try {
    console.log('🔐 Setting passwords for trainers...\n');
    
    // Get all trainers (with or without passwords)
    const [trainers] = await db.query(
      `SELECT id, email, username, name, phone FROM staff 
       WHERE role = 'trainer'`
    );

    if (trainers.length === 0) {
      console.log('ℹ️  No trainers found in staff table');
      process.exit(0);
      return;
    }

    console.log(`Found ${trainers.length} trainers. Setting/updating passwords:\n`);
    
    let updated = 0;
    
    // For each trainer, generate a password based on their info
    for (const trainer of trainers) {
      // Create password: name + @123
      const nameBase = trainer.name?.toLowerCase().replace(/\s+/g, '') || 'trainer';
      const defaultPassword = `${nameBase}@123`;
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      try {
        await db.query(
          `UPDATE staff SET password_hash = ? WHERE id = ?`,
          [hashedPassword, trainer.id]
        );
        
        console.log(`✅ ${trainer.name}`);
        console.log(`   Login with: ${trainer.email || trainer.username}`);
        console.log(`   Password: ${defaultPassword}`);
        console.log('');
        updated++;
      } catch (err) {
        console.log(`⚠️  ${trainer.name}: ${err.message}`);
      }
    }

    console.log(`✅ Successfully set passwords for ${updated}/${trainers.length} trainers!`);
    console.log('\n📝 Share these credentials with trainers and ask them to change password on first login.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

setTrainerPasswordsSimple();
