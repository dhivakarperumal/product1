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
  
  // Get member info (Gopi)
  const [members] = await conn.query('SELECT id, name, email, created_by, phone FROM members LIMIT 5');
  console.log('\nMembers:');
  console.log('='.repeat(130));
  members.forEach(m => {
    console.log(`ID: ${m.id} | name: ${m.name || 'NULL'} | email: ${m.email || 'NULL'} | phone: ${m.phone || 'NULL'} | created_by: ${m.created_by || 'NULL'}`);
  });
  
  // Get users info
  const [users] = await conn.query('SELECT id, username, email, created_by FROM users LIMIT 5');
  console.log('\nUsers:');
  console.log('='.repeat(130));
  users.forEach(u => {
    console.log(`ID: ${u.id} | username: ${u.username || 'NULL'} | email: ${u.email || 'NULL'} | created_by: ${u.created_by || 'NULL'}`);
  });
  
  // Get all plans with created_by
  const [plans] = await conn.query('SELECT id, plan_id, name, created_by FROM gym_plans ORDER BY id');
  console.log('\nAll Plans:');
  console.log('='.repeat(130));
  plans.forEach(p => {
    console.log(`ID: ${p.id} | plan_id: ${p.plan_id} | name: ${p.name} | created_by: ${p.created_by}`);
  });
  
  console.log('='.repeat(130));
  
  await conn.end();
})().catch(e => console.error(e));
