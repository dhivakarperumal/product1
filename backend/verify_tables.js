const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gym_user_db',
});

(async () => {
  const conn = await pool.getConnection();
  
  // Check which tables exist
  const [tables] = await conn.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
     WHERE TABLE_SCHEMA='gym_user_db' AND TABLE_NAME IN ('members_auth', 'superadmins', 'members')`
  );
  
  console.log('Auth-related tables in database:');
  tables.forEach(t => console.log('  -', t.TABLE_NAME));
  
  // Check data in each table
  if (tables.find(t => t.TABLE_NAME === 'superadmins')) {
    const [superadmins] = await conn.query('SELECT COUNT(*) as count FROM superadmins');
    console.log('\nsuperadmins count:', superadmins[0].count);
  }
  
  if (tables.find(t => t.TABLE_NAME === 'members_auth')) {
    const [members] = await conn.query('SELECT COUNT(*) as count FROM members_auth');
    console.log('members_auth count:', members[0].count);
  }
  
  if (tables.find(t => t.TABLE_NAME === 'members')) {
    const [members] = await conn.query('SELECT COUNT(*) as count FROM members');
    console.log('members count:', members[0].count);
  }
  
  conn.release();
  pool.end();
})();
