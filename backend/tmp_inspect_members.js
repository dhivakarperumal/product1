require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const c = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gym_user_db',
    waitForConnections: true,
    connectionLimit: 2,
  });

  const [cols] = await c.query('SHOW COLUMNS FROM members');
  console.log('MEMBERS COLS', JSON.stringify(cols, null, 2));
  const [members] = await c.query('SELECT id, created_by, email, role FROM members ORDER BY id DESC LIMIT 20');
  console.log('MEMBERS', JSON.stringify(members, null, 2));
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
