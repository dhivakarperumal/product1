const db = require('./src/config/db');

(async () => {
  try {
    const [rows] = await db.query('SELECT * FROM memberships ORDER BY createdAt DESC LIMIT 20');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
