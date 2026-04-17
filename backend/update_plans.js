const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const { randomUUID } = require('crypto');
dotenv.config();
(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gym_user_db'
  });
  
  // Get all plans with old format (length <= 10 or contains 'PL')
  const [rows] = await conn.query('SELECT id, plan_id FROM gym_plans WHERE LENGTH(plan_id) <= 10 OR plan_id LIKE "PL%"');
  
  console.log(`Found ${rows.length} plans with old format. Converting to UUID...`);
  
  for (const row of rows) {
    const newUUID = randomUUID();
    await conn.query('UPDATE gym_plans SET plan_id = ? WHERE id = ?', [newUUID, row.id]);
    console.log(`? ID ${row.id}: ${row.plan_id} ? ${newUUID}`);
  }
  
  // Verify conversion
  const [stats] = await conn.query('SELECT COUNT(*) as total, SUM(LENGTH(plan_id) = 36) as uuid_count FROM gym_plans');
  console.log(`\n? Conversion complete!`);
  console.log(`Total Plans: ${stats[0].total}`);
  console.log(`UUID Format: ${stats[0].uuid_count} plans`);
  console.log(`Old Format: ${stats[0].total - stats[0].uuid_count} plans`);
  
  // Show final result
  const [final] = await conn.query('SELECT id, plan_id, name FROM gym_plans ORDER BY id');
  console.log('\nFinal Plan List:');
  console.log('-'.repeat(90));
  final.forEach(r => console.log(`ID: ${r.id} | plan_id: ${r.plan_id} | name: ${r.name}`));
  
  await conn.end();
})().catch(e => console.error(e));
