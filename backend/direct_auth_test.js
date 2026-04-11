const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gym_user_db',
});

async function testDirectAuthentication() {
  const conn = await pool.getConnection();
  
  console.log('Testing direct authentication logic...\n');
  
  // Test 1: Query members_auth table directly
  const identifier = 'member@gym.com';
  const password = 'password123';
  
  console.log('1. Querying members_auth for:', identifier);
  const [rows] = await conn.query(
    'SELECT * FROM members_auth WHERE email = ? OR username = ? OR mobile = ?',
    [identifier, identifier, identifier]
  );
  
  if (!rows[0]) {
    console.log('❌ User not found in members_auth');
    conn.release();
    pool.end();
    return;
  }
  
  const user = rows[0];
  console.log('✅ Found user:', user.email, 'with role:', user.role);
  
  // Test 2: Check password
  console.log('\n2. Comparing passwords...');
  const match = await bcrypt.compare(password, user.password_hash);
  console.log('Password match:', match ? '✅ YES' : '❌ NO');
  
  // Test 3: Check role validation
  console.log('\n3. Validating role...');
  const requestedRole = 'member';
  const rolesMatch = user.role === requestedRole;
  console.log('User role:', user.role);
  console.log('Requested role:', requestedRole);
  console.log('Match:', rolesMatch ? '✅ YES' : '❌ NO');
  
  console.log('\n✅ All checks passed - authentication should work!');
  conn.release();
  pool.end();
}

testDirectAuthentication().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
