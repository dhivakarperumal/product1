const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function run() {
  try {
    // Get the gym_1 admin
    const [admins] = await db.query('SELECT id, email, username, password_hash FROM users WHERE email = "gym_1@gmail.com"');

    if (admins.length === 0) {
      console.log('Admin not found');
      process.exit(1);
    }

    const admin = admins[0];
    console.log(`Admin: ${admin.email}`);
    console.log(`Current password_hash: ${admin.password_hash ? 'SET' : 'NOT SET'}`);

    // Set password to password123
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, admin.id]);

    console.log(`✓ Set password to: ${password}`);

  } catch (err) {
    console.error('ERROR:', err.message);
  }
  process.exit();
}

run();
