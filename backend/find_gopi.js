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
  
  // Search for Gopi
  console.log('\nSearching for Gopi...\n');
  const [memberGopi] = await conn.query('SELECT * FROM members WHERE name LIKE "%Gopi%" OR email LIKE "%gopi%"');
  console.log('Members named Gopi:');
  memberGopi.forEach(m => {
    console.log(`ID: ${m.id} | name: ${m.name} | email: ${m.email} | created_by: ${m.created_by}`);
  });
  
  const [userGopi] = await conn.query('SELECT * FROM users WHERE username LIKE "%Gopi%" OR email LIKE "%gopi%"');
  console.log('\nUsers named Gopi:');
  userGopi.forEach(u => {
    console.log(`ID: ${u.id} | username: ${u.username} | email: ${u.email} | created_by: ${u.created_by}`);
  });
  
  // List ALL members to see who's logged in
  const [allMembers] = await conn.query('SELECT id, name, email, created_by FROM members');
  console.log('\n' + '='.repeat(130));
  console.log('All Members in Database:');
  console.log('='.repeat(130));
  allMembers.forEach(m => {
    const adminUuid = m.created_by === 'be6476df-3400-11f1-8931-87bb173ff820' ? '✓ HAS PLANS' : '✗ NO PLANS';
    console.log(`ID: ${m.id} | name: ${m.name} | email: ${m.email} | created_by: ${m.created_by} | ${adminUuid}`);
  });
  
  await conn.end();
})().catch(e => console.error(e));
