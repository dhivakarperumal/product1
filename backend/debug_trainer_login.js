const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function debugTrainerLogin() {
  try {
    console.log('🔍 Debugging trainer login issue...\n');
    
    // Get all trainers
    const [trainers] = await db.query(
      `SELECT id, employee_id, email, username, name, role, password_hash FROM staff WHERE role = 'trainer'`
    );

    console.log('Trainers in staff table:');
    console.log('========================\n');
    
    for (const trainer of trainers) {
      console.log(`Name: ${trainer.name}`);
      console.log(`Employee ID: ${trainer.employee_id}`);
      console.log(`Email: ${trainer.email}`);
      console.log(`Username: ${trainer.username}`);
      console.log(`Role: ${trainer.role}`);
      console.log(`Password Hash Set: ${trainer.password_hash ? 'YES' : 'NO'}`);
      
      // Test password matching with expected password
      if (trainer.password_hash) {
        const expectedPassword = `${trainer.name?.toLowerCase().replace(/\s+/g, '')}@123`;
        const matches = await bcrypt.compare(expectedPassword, trainer.password_hash);
        console.log(`Expected Password: ${expectedPassword}`);
        console.log(`Password Matches: ${matches ? '✅ YES' : '❌ NO'}`);
      }
      console.log('---\n');
    }

    // Test specific lookup for "deepu"
    console.log('\n🔎 Testing lookup for "deepu":\n');
    const [found] = await db.query(
      `SELECT * FROM staff WHERE role = 'trainer' AND (email = ? OR username = ?)`,
      ['deepu', 'deepu']
    );
    
    if (found.length > 0) {
      console.log('✅ Found trainer:', found[0].name);
    } else {
      console.log('❌ Not found with exact match "deepu"');
      
      // Try broader search
      const [likeResults] = await db.query(
        `SELECT id, email, username, name FROM staff WHERE role = 'trainer' AND (email LIKE ? OR username LIKE ?)`,[
          '%deepu%',
          '%deepu%'
        ]
      );
      
      if (likeResults.length > 0) {
        console.log('Found with partial match:');
        likeResults.forEach(t => {
          console.log(`- ${t.name} (email: ${t.email}, username: ${t.username})`);
        });
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

debugTrainerLogin();
