const db = require('./src/config/db');

(async () => {
  try {
    const [members] = await db.query('SELECT COUNT(*) as count FROM members');
    console.log('Members in DB:', members[0].count);
    
    const [admins] = await db.query('SELECT id, email, user_uuid, role FROM users WHERE role = "admin" LIMIT 5');
    console.log('Admin users:', JSON.stringify(admins, null, 2));
    
    const [superAdmins] = await db.query('SELECT * FROM superadmins LIMIT 1');
    console.log('Super admins:', JSON.stringify(superAdmins, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
