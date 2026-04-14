const db = require('./src/config/db');
(async () => {
  try {
    const [rows] = await db.query('SELECT id, user_id, member_id, name, phone, email FROM members WHERE id = 27 LIMIT 1');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
