const db = require('./src/config/db');

async function run() {
  try {
    console.log('='.repeat(80));
    console.log('DEBUG: Assigned Trainers Data Check');
    console.log('='.repeat(80));

    // Check memberships
    console.log('\n1️⃣  MEMBERSHIPS TABLE:');
    const [memberships] = await db.query(`
      SELECT 
        m.id,
        m.userId,
        m.user_id,
        m.memberId,
        m.member_id,
        m.planName,
        m.planDuration,
        u.id AS user_id_from_users,
        u.username,
        u.email
      FROM memberships m
      LEFT JOIN users u ON m.userId = u.id
      LIMIT 10
    `);
    
    console.log(`Found ${memberships.length} memberships:`);
    memberships.forEach((m, i) => {
      console.log(`  [${i+1}] ID=${m.id}, userId=${m.userId}, user_id=${m.user_id}, Plan=${m.planName}`);
      console.log(`      UserMatch: userId(${m.userId}) -> users.id(${m.user_id_from_users}), username=${m.username}`);
    });

    // Check trainer_assignments
    console.log('\n2️⃣  TRAINER_ASSIGNMENTS TABLE:');
    const [assignments] = await db.query(`
      SELECT 
        a.id,
        a.user_id,
        a.username,
        a.plan_id,
        a.plan_name,
        a.trainer_id,
        a.trainer_name,
        a.status,
        u.id AS users_table_id,
        u.username AS users_table_username
      FROM trainer_assignments a
      LEFT JOIN users u ON a.user_id = u.id
      LIMIT 10
    `);
    
    console.log(`Found ${assignments.length} assignments:`);
    assignments.forEach((a, i) => {
      console.log(`  [${i+1}] ID=${a.id}, user_id=${a.user_id}, Plan=${a.plan_name}, Trainer=${a.trainer_name}`);
      console.log(`      UserMatch: user_id(${a.user_id}) -> users.id(${a.users_table_id}), username=${a.users_table_username}`);
    });

    // Check if users with memberships have assignments
    console.log('\n3️⃣  MATCHING MEMBERSHIPS WITH ASSIGNMENTS:');
    const [matches] = await db.query(`
      SELECT 
        m.id AS membership_id,
        m.userId,
        m.planName,
        COUNT(a.id) AS assignment_count,
        GROUP_CONCAT(a.trainer_name) AS trainer_names
      FROM memberships m
      LEFT JOIN trainer_assignments a ON m.userId = a.user_id AND m.planId = a.plan_id
      GROUP BY m.id, m.userId, m.planName
      LIMIT 10
    `);
    
    console.log(`Checking ${matches.length} membership/assignment pairs:`);
    matches.forEach((m, i) => {
      const status = m.assignment_count > 0 ? '✅ ASSIGNED' : '❌ UNASSIGNED';
      console.log(`  [${i+1}] ${status} - Membership(${m.membership_id}), userId=${m.userId}, Plan=${m.planName}`);
      if (m.trainer_names) {
        console.log(`      Trainers: ${m.trainer_names}`);
      }
    });

    // Check staff/trainers table
    console.log('\n4️⃣  STAFF/TRAINERS TABLE:');
    const [staff] = await db.query(`
      SELECT id, name, username, email, role
      FROM staff
      WHERE role = 'trainer'
      LIMIT 10
    `);
    
    console.log(`Found ${staff.length} trainers in staff table:`);
    staff.forEach((s, i) => {
      console.log(`  [${i+1}] ID=${s.id}, Name=${s.name}, Username=${s.username}, Email=${s.email}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ Debug complete - Check console output above for data structure');
    console.log('='.repeat(80));

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

run();
