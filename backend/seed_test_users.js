const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const testPassword = 'password123';
const hashedPassword = bcrypt.hashSync(testPassword, 10);

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gym_user_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

(async () => {
  try {
    const conn = await pool.getConnection();

    console.log('Creating test users for each role...\n');

    // Test superadmin user (in superadmins table)
    try {
      await conn.query(`
        INSERT INTO superadmins (email, username, password_hash, role)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE password_hash = ?
      `, ['superadmin@gym.com', 'superadmin', hashedPassword, 'super admin', hashedPassword]);
      console.log('✅ Created/Updated superadmin@gym.com in superadmins table');
    } catch (err) {
      console.log('⚠️ Superadmin:', err.message);
    }

    // Test admin user (in users table with role='admin')
    try {
      await conn.query(`
        INSERT INTO users (email, username, password_hash, mobile, role, admin_id)
        VALUES (?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE password_hash = ?, role = ?
      `, ['admin@gym.com', 'admin', hashedPassword, '9876543211', 'admin', hashedPassword, 'admin']);
      console.log('✅ Created/Updated admin@gym.com in users table with role=admin');
    } catch (err) {
      console.log('⚠️ Admin:', err.message);
    }

    // Test member user (in members_auth table)
    try {
      await conn.query(`
        INSERT INTO members_auth (email, username, password_hash, mobile, role, admin_id)
        VALUES (?, ?, ?, ?, ?, NULL)
        ON DUPLICATE KEY UPDATE password_hash = ?, role = ?
      `, ['member@gym.com', 'member', hashedPassword, '9876543212', 'member', hashedPassword, 'member']);
      console.log('✅ Created/Updated member@gym.com in members_auth table with role=member');
    } catch (err) {
      console.log('⚠️ Member:', err.message);
    }

    // Test trainer user (in members_auth table)
    try {
      await conn.query(`
        INSERT INTO members_auth (email, username, password_hash, mobile, role, admin_id)
        VALUES (?, ?, ?, ?, ?, NULL)
        ON DUPLICATE KEY UPDATE password_hash = ?, role = ?
      `, ['trainer@gym.com', 'trainer', hashedPassword, '9876543213', 'trainer', hashedPassword, 'trainer']);
      console.log('✅ Created/Updated trainer@gym.com in members_auth table with role=trainer');
    } catch (err) {
      console.log('⚠️ Trainer:', err.message);
    }

    conn.release();
    pool.end();
    console.log('\n✅ Test users setup complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
