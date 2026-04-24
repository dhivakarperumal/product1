const db = require('./src/config/db');

async function checkStaffTable() {
  try {
    console.log('🔍 Checking staff table trainer data...\n');
    
    const [trainers] = await db.query(
      `SELECT id, email, username, name, employee_id FROM staff WHERE role = 'trainer'`
    );

    console.log('Trainers in staff table:');
    console.log('========================\n');
    
    trainers.forEach(trainer => {
      console.log(`Name: ${trainer.name}`);
      console.log(`  ID: ${trainer.id}`);
      console.log(`  Employee ID: ${trainer.employee_id}`);
      console.log(`  Email: "${trainer.email}"`);
      console.log(`  Username: "${trainer.username}"`);
      console.log('  Possible login values:');
      if (trainer.email) console.log(`    - ${trainer.email}`);
      if (trainer.username) console.log(`    - ${trainer.username}`);
      console.log('');
    });

    // Test specific lookup attempts
    console.log('\n🧪 Testing lookup with "deepu@gmail.com":');
    const [result1] = await db.query(
      `SELECT * FROM staff WHERE role = 'trainer' AND (email = ? OR username = ?)`,
      ['deepu@gmail.com', 'deepu@gmail.com']
    );
    console.log(`Found: ${result1.length > 0 ? '✅ YES' : '❌ NO'}\n`);

    console.log('🧪 Testing lookup with "deepu":');
    const [result2] = await db.query(
      `SELECT * FROM staff WHERE role = 'trainer' AND (email = ? OR username = ?)`,
      ['deepu', 'deepu']
    );
    console.log(`Found: ${result2.length > 0 ? '✅ YES' : '❌ NO'}`);
    if (result2.length > 0) {
      console.log(`Matched trainer: ${result2[0].name}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkStaffTable();
