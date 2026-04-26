const db = require('./src/config/db');

async function run() {
  try {
    console.log('=== ASSIGNMENTS DIAGNOSTIC ===\n');

    // Check table exists and schema
    const [columns] = await db.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'trainer_assignments' AND TABLE_SCHEMA = DATABASE()
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('TABLE SCHEMA:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (NULL: ${col.IS_NULLABLE}, KEY: ${col.COLUMN_KEY})`);
    });
    console.log('');

    // Count assignments
    const [countResult] = await db.query('SELECT COUNT(*) as count FROM trainer_assignments');
    const count = countResult[0].count;
    console.log(`TOTAL ASSIGNMENTS: ${count}\n`);

    // Show sample assignments
    if (count > 0) {
      const [assignments] = await db.query(`
        SELECT id, user_id, username, user_email, plan_id, plan_name, trainer_id, trainer_name, status, created_by, updated_at
        FROM trainer_assignments
        ORDER BY updated_at DESC
        LIMIT 10
      `);
      
      console.log('SAMPLE ASSIGNMENTS:');
      assignments.forEach((a, idx) => {
        console.log(`  [${idx + 1}] User: ${a.user_id} (${a.username}), Plan: ${a.plan_id} (${a.plan_name}), Trainer: ${a.trainer_id} (${a.trainer_name}), Status: ${a.status}`);
        console.log(`       Email: ${a.user_email}, Created By: ${a.created_by}, Updated: ${a.updated_at}`);
      });
    } else {
      console.log('NO ASSIGNMENTS FOUND - This is the problem!');
    }
    console.log('');

    // Check memberships
    const [memberCount] = await db.query('SELECT COUNT(*) as count FROM memberships');
    console.log(`TOTAL MEMBERSHIPS: ${memberCount[0].count}\n`);

    // Check trainers
    const [staffCount] = await db.query("SELECT COUNT(*) as count FROM staff WHERE role = 'trainer'");
    console.log(`TOTAL TRAINERS: ${staffCount[0].count}\n`);

    // Sample memberships
    const [sampleMembers] = await db.query(`
      SELECT id, userId, user_id, planId, plan_id, planName, member_name
      FROM memberships
      LIMIT 5
    `);
    
    console.log('SAMPLE MEMBERSHIPS:');
    sampleMembers.forEach((m, idx) => {
      console.log(`  [${idx + 1}] ID: ${m.id}, UserId: ${m.userId || m.user_id}, PlanId: ${m.planId || m.plan_id} (${m.planName}), Member: ${m.member_name}`);
    });

  } catch (err) {
    console.error('ERROR:', err.message);
  }
  process.exit();
}

run();
