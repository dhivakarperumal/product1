const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function setTrainerPasswords() {
  try {
    console.log('🔐 Setting passwords for existing trainers...\n');
    console.log('=' .repeat(60));

    // Get all trainers without passwords
    const [trainers] = await db.query(
      `SELECT id, email, username, phone, name FROM staff 
       WHERE role = 'trainer' AND (password_hash IS NULL OR password_hash = '')`
    );

    if (trainers.length === 0) {
      console.log('✅ All trainers already have passwords set!');
      return;
    }

    console.log(`Found ${trainers.length} trainers without passwords:\n`);

    for (const trainer of trainers) {
      // Use phone number as password if available, otherwise use a default
      let password = trainer.phone || '123456';
      
      // Hash the password
      const hash = await bcrypt.hash(password, 10);
      
      // Update the trainer
      await db.query(
        `UPDATE staff SET password_hash = ? WHERE id = ?`,
        [hash, trainer.id]
      );

      console.log(`✅ ${trainer.name}`);
      console.log(`   📧 Email: ${trainer.email}`);
      console.log(`   👤 Username: ${trainer.username}`);
      console.log(`   🔑 Login password: ${password}`);
      console.log(`   📝 Hash: ${hash.substring(0, 40)}...\n`);
    }

    // Verify all trainers now have passwords
    const [updated] = await db.query(
      `SELECT COUNT(*) as total FROM staff 
       WHERE role = 'trainer' AND password_hash IS NOT NULL AND password_hash != ''`
    );

    console.log('=' .repeat(60));
    console.log(`\n✅ All ${updated[0].total} trainers now have passwords set!`);
    console.log('\n📋 Test Login Instructions:');
    console.log('   1. Go to http://localhost:5173 (or your frontend URL)');
    console.log('   2. Click on "Trainer" login option');
    console.log('   3. Use one of the emails/usernames above');
    console.log('   4. Password is their phone number (or 123456 if no phone)\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await db.end();
  }
}

setTrainerPasswords();
