const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function testTrainerLoginPassword() {
  try {
    console.log('🔐 Testing trainer password verification...\n');
    
    // Get Deepu's password hash
    const [trainers] = await db.query(
      `SELECT name, email, username, password_hash FROM staff WHERE name = 'Deepu' LIMIT 1`
    );

    if (trainers.length === 0) {
      console.log('❌ Trainer not found');
      process.exit(1);
      return;
    }

    const trainer = trainers[0];
    const storedHash = trainer.password_hash;

    console.log(`Trainer: ${trainer.name}`);
    console.log(`Email: ${trainer.email}`);
    console.log(`Username: ${trainer.username}`);
    console.log(`Password Hash: ${storedHash.substring(0, 30)}...\n`);

    // Test different passwords
    const testPasswords = [
      'deepu@123',      // Expected format
      'deepu',          // Without suffix
      'Deepu@123',      // Capitalized
      'DEEPU@123',      // All caps
      'deepu123',       // Without @
    ];

    console.log('Testing password combinations:\n');
    for (const testPass of testPasswords) {
      const matches = await bcrypt.compare(testPass, storedHash);
      console.log(`Password "${testPass}": ${matches ? '✅ MATCHES' : '❌ NO MATCH'}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n✅ Use this to login:');
    console.log(`Email/Username: ${trainer.email} or ${trainer.username}`);
    console.log(`Password: deepu@123`);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testTrainerLoginPassword();
