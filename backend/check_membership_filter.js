const db = require('./src/config/db');

(async() => {
  const [rows] = await db.query('SELECT id, member_email, created_by FROM memberships LIMIT 3');
  console.log('Memberships:');
  rows.forEach(r => console.log(r));
  
  const [admins] = await db.query('SELECT id, admin_uuid FROM users WHERE role = "admin" LIMIT 1');
  console.log('\nAdmin UUIDs:', admins[0]);
  
  process.exit(0);
})();
