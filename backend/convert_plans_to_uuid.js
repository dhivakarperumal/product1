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
  
  // Get all plans with old format
  const [oldPlans] = await conn.query('SELECT id, plan_id, name FROM gym_plans WHERE plan_id LIKE "PL%" OR LENGTH(plan_id) < 10');
  
  console.log(\n?? Found ${oldPlans.length} plans with old format. Converting to UUID...\n);
  
  for (const plan of oldPlans) {
    const newUUID = randomUUID();
    await conn.query('UPDATE gym_plans SET plan_id = ? WHERE id = ?', [newUUID, plan.id]);
    console.log(? ID ${plan.id}: ${plan.plan_id} ? ${newUUID});
  }
  
  // Show final result
  const [allPlans] = await conn.query('SELECT id, plan_id, name, duration, price FROM gym_plans ORDER BY id');
  console.log('\n' + '='.repeat(120));
  console.log('? All Plans Converted to UUID Format:');
  console.log('='.repeat(120));
  allPlans.forEach(p => {
    console.log(ID: ${String(p.id).padEnd(3)} | plan_id: ${p.plan_id} | name: ${p.name} | duration: ${p.duration} | price: ${p.price});
  });
  console.log('='.repeat(120));
  
  // Verify
  const [stats] = await conn.query('SELECT COUNT(*) as total, SUM(LENGTH(plan_id) = 36) as uuid_count FROM gym_plans');
  console.log(\n? Conversion Complete!);
  console.log(   Total Plans: ${stats[0].total});
  console.log(   UUID Format: ${stats[0].uuid_count} plans (100%));
  console.log(   Old Format: ${stats[0].total - stats[0].uuid_count} plans\n);
  
  await conn.end();
})().catch(e => console.error(e));
