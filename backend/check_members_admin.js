const db = require('./src/config/db');

(async () => {
  try {
    // Check members and their created_by values
    const [members] = await db.query('SELECT id, name, created_by, phone FROM members LIMIT 5');
    console.log('Members:');
    console.log(JSON.stringify(members, null, 2));
    
    // Check admin users and their UUIDs
    const [admins] = await db.query('SELECT id, email, user_uuid, role FROM users WHERE role = "admin"');
    console.log('\nAdmin users:');
    console.log(JSON.stringify(admins, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
