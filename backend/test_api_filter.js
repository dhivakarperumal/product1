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

  const adminUuid = 'be6476df-3400-11f1-8931-87bb173ff820';
  
  console.log('\n' + '='.repeat(130));
  console.log('Testing Plan Filter - What Backend Should Return:');
  console.log('='.repeat(130));
  
  // Test 1: No filter (what ALL users should see)
  const [allPlans] = await conn.query('SELECT id, plan_id, name, price, created_by FROM gym_plans ORDER BY id');
  console.log(`\n1️⃣ No Filter - All Plans in Database: ${allPlans.length} plans`);
  allPlans.forEach(p => {
    console.log(`   ID: ${p.id} | plan_id: ${p.plan_id.substring(0, 20)}... | name: ${p.name} | created_by: ${p.created_by}`);
  });
  
  // Test 2: With created_by filter (what Gopi should see)
  const [filteredPlans] = await conn.query(
    'SELECT id, plan_id, name, price, created_by FROM gym_plans WHERE created_by = ? ORDER BY id',
    [adminUuid]
  );
  console.log(`\n2️⃣ Filtered by created_by=${adminUuid}`);
  console.log(`   Expected Result: ${filteredPlans.length} plans`);
  filteredPlans.forEach(p => {
    console.log(`   ID: ${p.id} | plan_id: ${p.plan_id.substring(0, 20)}... | name: ${p.name}`);
  });
  
  // Test 3: Check what the getAllPlans function should do
  console.log(`\n3️⃣ Simulating getAllPlans() with no auth:`);
  const [noAuthPlans] = await conn.query('SELECT COUNT(*) as total FROM gym_plans');
  console.log(`   Returns: ${noAuthPlans[0].total} plans (ALL plans - no filter)`);
  
  // Test 4: Check if Gopi exists and has correct created_by
  const [gopiMember] = await conn.query(
    'SELECT id, name, email, created_by FROM members WHERE name = ?',
    ['Gopi']
  );
  console.log(`\n4️⃣ Gopi Member Info:`);
  if (gopiMember.length > 0) {
    const member = gopiMember[0];
    console.log(`   ID: ${member.id}`);
    console.log(`   Name: ${member.name}`);
    console.log(`   Email: ${member.email}`);
    console.log(`   created_by: ${member.created_by}`);
    console.log(`   ✓ Matches plan admin? ${member.created_by === adminUuid ? 'YES' : 'NO'}`);
  } else {
    console.log(`   ✗ Gopi not found!`);
  }
  
  console.log('\n' + '='.repeat(130));
  
  await conn.end();
})().catch(e => console.error('ERROR:', e.message));
