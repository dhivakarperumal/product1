const db = require('./src/config/db');

async function run() {
  try {
    // Get all admins
    const [admins] = await db.query(`
      SELECT id, email, username, role FROM users WHERE role = 'admin'
    `);

    console.log('Admin accounts in database:');
    admins.forEach(a => {
      console.log(`  - ${a.email} (${a.username}) - Role: ${a.role}`);
    });

    // Get all staff/trainers
    const [staff] = await db.query(`
      SELECT id, email, username, name, role FROM staff
    `);

    console.log('\nStaff/Trainers in database:');
    staff.forEach(s => {
      console.log(`  - ${s.email || s.username} (${s.name}) - Role: ${s.role}`);
    });

    // Get first few members with passwords
    const [members] = await db.query(`
      SELECT id, email, username, name FROM members
    `);

    console.log('\nMembers in database:');
    members.slice(0, 10).forEach(m => {
      console.log(`  - ${m.email || m.username} (${m.name})`);
    });

  } catch (err) {
    console.error('ERROR:', err.message);
  }
  process.exit();
}

run();
