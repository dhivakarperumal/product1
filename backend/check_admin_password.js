const db = require('./src/config/db');

(async () => {
  try {
    const [admins] = await db.query('SELECT id, email, password_hash FROM users WHERE role = "admin" LIMIT 3');
    console.log('Admin passwords:');
    admins.forEach(admin => {
      console.log(`${admin.email}: password_hash=${admin.password_hash ? 'SET' : 'NOT SET'}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
