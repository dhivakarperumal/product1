const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gym_user_db',
});

(async () => {
  const conn = await pool.getConnection();
  const identifier = 'member@gym.com';
  const [rows] = await conn.query(
    'SELECT id, email, username, mobile, role, password_hash FROM members_auth WHERE email = ? OR username = ? OR mobile = ?',
    [identifier, identifier, identifier]
  );
  console.log('Query result for identifier: ' + identifier);
  if (rows[0]) {
    console.log('✅ Found:');
    console.log('  ID:', rows[0].id);
    console.log('  Email:', rows[0].email);
    console.log('  Username:', rows[0].username);
    console.log('  Role:', rows[0].role);
    console.log('  Has password_hash:', !!rows[0].password_hash);
  } else {
    console.log('❌ NOT FOUND');
  }
  
  // Also check all rows in members_auth
  const [allRows] = await conn.query('SELECT id, email, username, role FROM members_auth');
  console.log('\nAll members_auth users:');
  allRows.forEach(r => console.log('  ' + r.email + ' (' + r.role + ')'));
  
  conn.release();
  pool.end();
})();
