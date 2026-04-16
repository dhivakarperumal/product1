const db = require('./src/config/db');
(async () => {
  try {
    const [cols] = await db.query('SHOW COLUMNS FROM members');
    console.log('COLUMNS', cols.map(c => c.Field).join(', '));
    const [rows] = await db.query('SELECT id, email, username, phone, mobile, password_hash, password, role FROM members LIMIT 5');
    console.log('ROWS', JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('ERR', err.code, err.message);
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
