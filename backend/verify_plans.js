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
  const [rows] = await conn.query('SELECT id, plan_id, name, description, duration, price, created_at FROM gym_plans ORDER BY id');
  console.log('All Plans in gym_plans table:');
  console.log('='.repeat(150));
  rows.forEach(r => {
    const planIdLen = r.plan_id.length;
    const isUUID = planIdLen === 36;
    const uuidStatus = isUUID ? 'UUID' : 'OLD';
    console.log('ID: ' + r.id + ' | plan_id: ' + r.plan_id + ' [' + uuidStatus + '] | Name: ' + r.name + ' | Duration: ' + r.duration + ' | Price: ' + r.price + ' | Created: ' + r.created_at);
  });
  console.log('='.repeat(150));
  // Count UUID vs old format
  const [stats] = await conn.query('SELECT COUNT(*) as total, SUM(LENGTH(plan_id) = 36) as uuid_count FROM gym_plans');
  console.log('Summary:');
  console.log('  Total Plans: ' + stats[0].total);
  console.log('  UUID Format: ' + stats[0].uuid_count);
  console.log('  Old Format: ' + (stats[0].total - stats[0].uuid_count));
  await conn.end();
})().catch(e => console.error(e));
