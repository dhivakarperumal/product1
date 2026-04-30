const db = require('./src/config/db');

async function run() {
  try {
    // Query users with email containing 'admin@gym.com'
    const [users] = await db.query(
      'SELECT id, name, username, email, role, created_at FROM users WHERE email LIKE ? OR username LIKE ? ORDER BY id ASC',
      ['%admin%', '%admin%']
    );

    console.log('\n' + '='.repeat(80));
    console.log('ALL USERS WITH "ADMIN" IN NAME OR EMAIL');
    console.log('='.repeat(80) + '\n');

    if (users.length === 0) {
      console.log('❌ No users found with "admin" in name or email\n');
    } else {
      console.log(`✅ Found ${users.length} user(s):\n`);
      
      users.forEach((user, index) => {
        console.log(`[${index + 1}] ID: ${user.id}`);
        console.log(`    Name: ${user.name || 'N/A'}`);
        console.log(`    Username: ${user.username || 'N/A'}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Role: ${user.role || 'N/A'}`);
        console.log(`    Created: ${user.created_at}`);
        console.log('');
      });
    }

    // Also show the specific admin@gym.com user
    const [adminUsers] = await db.query(
      'SELECT id, name, username, email, role, created_at FROM users WHERE email = ?',
      ['admin@gym.com']
    );

    console.log('='.repeat(80));
    console.log('USER WITH EMAIL: admin@gym.com');
    console.log('='.repeat(80) + '\n');

    if (adminUsers.length === 0) {
      console.log('❌ No user found with email admin@gym.com\n');
    } else {
      adminUsers.forEach((user, index) => {
        console.log(`[${index + 1}] ID: ${user.id}`);
        console.log(`    Name: ${user.name || 'N/A'}`);
        console.log(`    Username: ${user.username || 'N/A'}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Role: ${user.role || 'N/A'}`);
        console.log(`    Created: ${user.created_at}`);
        console.log('');
      });
    }

  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    process.exit();
  }
}

run();
