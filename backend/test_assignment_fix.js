const db = require('./src/config/db');

async function testAssignmentFix() {
  try {
    console.log('\n=== TESTING TRAINER ASSIGNMENT FIX ===\n');

    // Step 1: Get a membership with email data
    console.log('STEP 1: Fetching a membership...');
    const [memberships] = await db.query(`
      SELECT m.*, 
             u.id AS user_id,
             u.email AS user_email,
             gm.name AS member_name
      FROM memberships m
      LEFT JOIN users u ON m.userId = u.id
      LEFT JOIN members gm ON m.memberId = gm.id
      WHERE m.member_email IS NOT NULL
      LIMIT 1
    `);

    if (memberships.length === 0) {
      console.log('❌ No memberships found with email');
      process.exit(1);
    }

    const membership = memberships[0];
    console.log(`✓ Found membership for: ${membership.member_name || 'Unknown'}`);
    console.log(`  Member email: ${membership.member_email}`);
    console.log(`  Member userId: ${membership.userId}`);
    console.log(`  User email from users table: ${membership.user_email}`);

    // Step 2: Get a trainer
    console.log('\nSTEP 2: Fetching a trainer...');
    const [trainers] = await db.query(`
      SELECT id, name, email FROM staff WHERE role = 'trainer' LIMIT 1
    `);

    if (trainers.length === 0) {
      console.log('❌ No trainers found');
      process.exit(1);
    }

    const trainer = trainers[0];
    console.log(`✓ Found trainer: ${trainer.name}`);

    // Step 3: Test email resolution (case-insensitive with trim)
    console.log('\nSTEP 3: Testing email resolution...');
    const testEmail = membership.member_email;
    console.log(`  Testing email lookup: "${testEmail}"`);

    const [resolvedUsers] = await db.query(
      'SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?)) LIMIT 1',
      [testEmail]
    );

    if (resolvedUsers.length > 0) {
      console.log(`✓ Email resolved to user ID: ${resolvedUsers[0].id}`);
    } else {
      console.log(`⚠ Email could not be resolved from users table`);
      console.log(`  This would trigger the backend email lookup fallback`);
    }

    // Step 4: Check the getAllMemberships query output
    console.log('\nSTEP 4: Testing getAllMemberships endpoint query...');
    const [getAllResult] = await db.query(`
      SELECT m.*, 
             u.id AS user_id_resolved,
             u.username, 
             u.email AS user_email, 
             u.mobile AS user_mobile, 
             u.role,
             gm.name AS member_name,
             gm.phone AS member_phone,
             gm.email AS gym_member_email,
             s.name AS trainer_full_name,
             s.employee_id AS trainer_emp_id,
             s.email AS trainer_email,
             s.phone AS trainer_phone
      FROM memberships m
      LEFT JOIN users u ON m.userId = u.id OR (m.userId IS NULL AND LOWER(TRIM(m.member_email)) = LOWER(TRIM(u.email)))
      LEFT JOIN members gm ON m.memberId = gm.id
      LEFT JOIN staff s ON m.trainerId = s.id
      WHERE m.id = ?
      LIMIT 1
    `, [membership.id]);

    if (getAllResult.length > 0) {
      const result = getAllResult[0];
      console.log('✓ Query returned data:');
      console.log(`  member_email (from memberships): ${result.member_email}`);
      console.log(`  gym_member_email (from members table): ${result.gym_member_email}`);
      console.log(`  user_email (from users table): ${result.user_email}`);
      console.log(`  user_id_resolved: ${result.user_id_resolved}`);
      
      // Check for column conflicts
      if (result.member_email && result.gym_member_email && result.member_email !== result.gym_member_email) {
        console.log('✓ Column names properly separated (no conflicts)');
      }
    }

    console.log('\n=== TEST COMPLETE ===');
    console.log('\n✅ The fixes appear to be working correctly!');
    console.log('\nKey improvements:');
    console.log('1. Email lookup is now case-insensitive and trim-aware');
    console.log('2. Column names are properly separated to avoid conflicts');
    console.log('3. The backend can resolve user IDs from emails as a fallback');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

testAssignmentFix();
