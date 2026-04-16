
const db = require('./src/config/db');
(async () => {
  try {
    const [cols] = await db.query('SHOW COLUMNS FROM members_auth');
    console.log(JSON.stringify({cols: cols.map(c => c.Field)}));
    const [rows] = await db.query('SELECT id, email, username, mobile, password_hash, role FROM members_auth WHERE email = ? OR mobile = ? OR username = ? LIMIT 10', ['gopi@gmail.com', '9123564780', 'gopi']);
    console.log(JSON.stringify({rows}));
  } catch (err) {
    console.error(JSON.stringify({err: {code: err.code, message: err.message, stack: err.stack}}));
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
