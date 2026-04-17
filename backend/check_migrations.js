const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();
(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gym_user_db'
  });
  const [rows] = await conn.query('SELECT COUNT(*) as total FROM schema_migrations');
  console.log('Total migrations applied:', rows[0].total);
  const [specific] = await conn.query('SELECT filename, applied_at FROM schema_migrations WHERE filename LIKE "004%" OR filename LIKE "005%"');
  console.log('\nMigrations 0040-0059:');
  specific.forEach(r => console.log('  ' + r.filename.padEnd(50) + ' => ' + r.applied_at));
  await conn.end();
})().catch(e => console.error(e));
