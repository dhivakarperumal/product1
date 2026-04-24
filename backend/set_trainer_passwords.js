const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function setTrainerPasswords() {
  try {
    console.log('Fetching trainers without passwords...');
    
    // Get all trainers without passwords
    const [trainers] = await db.query(
      `SELECT id, email, username, name FROM staff 
       WHERE role = 'trainer' AND (password_hash IS NULL OR password_hash = '')`
    );

    if (trainers.length === 0) {
      console.log('✅ All trainers already have passwords set!');
      process.exit(0);
      return;
    }

    console.log(`Found ${trainers.length} trainers without passwords:\n`);
    
    // For each trainer, use their phone/mobile as password or a default
    for (const trainer of trainers) {
      // Use a default password pattern: first 6 chars of name + birth year or number
      const defaultPassword = `${trainer.name?.toLowerCase().replace(/\s/g, '') || 'trainer'}@123`;
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      await db.query(
        `UPDATE staff SET password_hash = ? WHERE id = ?`,
        [hashedPassword, trainer.id]
      );
      
      console.log(`✅ Set password for trainer: ${trainer.name} (${trainer.email || trainer.username})`);
      console.log(`   Temp Password: ${defaultPassword}`);
      console.log('   (Please ask trainer to change password on first login)\n');
    }

    console.log(`✅ Successfully set passwords for ${trainers.length} trainers!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error setting trainer passwords:', err.message);
    process.exit(1);
  }
}

setTrainerPasswords();
