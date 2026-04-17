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
  
  const [rows] = await conn.query('SELECT id, plan_id, name, LENGTH(plan_id) as len FROM gym_plans ORDER BY id');
  console.log('\nAll Plans:');
  console.log('-'.repeat(100));
  rows.forEach(r => {
    const isUUID = r.len === 36 && r.plan_id.includes('-');
    const status = isUUID ? '? UUID' : '? OLD';
    console.log(`ID: ${r.id.toString().padEnd(3)} | ${status} | Length: ${r.len} | plan_id: ${r.plan_id} | name: ${r.name}`);
  });
  
  console.log('\n' + '-'.repeat(100));
  const [stats] = await conn.query('SELECT COUNT(*) as total, SUM(LENGTH(plan_id) = 36) as uuid_count FROM gym_plans');
  console.log(`Total Plans: ${stats[0].total}`);
  console.log(`UUID Format: ${stats[0].uuid_count} plans`);
  console.log(`Old Format: ${stats[0].total - stats[0].uuid_count} plans`);
  
  await conn.end();
})().catch(e => console.error(e));
