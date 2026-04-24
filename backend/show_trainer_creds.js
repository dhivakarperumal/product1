const db = require('./src/config/db');

async function showTrainerCredentials() {
  try {
    console.log('📋 TRAINER LOGIN CREDENTIALS\n');
    console.log('='.repeat(60));
    
    const [trainers] = await db.query(
      `SELECT id, email, username, name FROM staff WHERE role = 'trainer' ORDER BY name`
    );

    if (trainers.length === 0) {
      console.log('No trainers found!');
      process.exit(0);
      return;
    }

    console.log(`\nFound ${trainers.length} trainers:\n`);
    
    trainers.forEach((trainer, index) => {
      console.log(`${index + 1}. ${trainer.name}`);
      console.log(`   Email: ${trainer.email}`);
      console.log(`   Username: ${trainer.username || '(not set)'}`);
      
      // Generate expected password
      const nameBase = trainer.name?.toLowerCase().replace(/\s+/g, '');
      console.log(`   Password: ${nameBase}@123`);
      console.log(`   Login Options:`);
      console.log(`     - Use email: ${trainer.email}`);
      if (trainer.username) {
        console.log(`     - Use username: ${trainer.username}`);
      }
      console.log('');
    });

    console.log('='.repeat(60));
    console.log('\n⚠️  IMPORTANT: Make sure you are using the CORRECT PASSWORD');
    console.log('The password format is: [firstname in lowercase]@123\n');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

showTrainerCredentials();
