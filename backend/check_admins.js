const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gym_user_db'
  });
  
  const [rows] = await conn.query("SELECT id, username, email, role, user_uuid, admin_uuid FROM users WHERE role = 'admin' LIMIT 10");
  console.log(JSON.stringify(rows, null, 2));
  
  await conn.end();
}

main().catch(console.error);