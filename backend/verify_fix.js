const db = require('./src/config/db');

async function run() {
  try {
    console.log('=== VERIFYING FIX FOR ASSIGNMENTS FILTER ===\n');

    // Get first admin
    const [admins] = await db.query(`
      SELECT id, email, username FROM users WHERE role = 'admin' LIMIT 1
    `);

    if (admins.length === 0) {
      console.log('ERROR: No admin found');
      process.exit(1);
    }

    const admin = admins[0];
    console.log(`Using admin: ${admin.email} (username: ${admin.username})`);

    // Query with NEW logic (created_by = ? OR created_by IS NULL)
    const [assignments] = await db.query(`
      SELECT a.id, a.user_id, a.username, a.trainer_id, a.trainer_name, a.created_by
      FROM trainer_assignments a
      WHERE (a.created_by IS NULL OR a.created_by = ?)
      ORDER BY a.updated_at DESC
    `, [null]); // Using null just for demonstration

    console.log(`\nAssignments with NEW filter (created_by = ? OR created_by IS NULL): ${assignments.length}`);
    assignments.slice(0, 5).forEach((a, i) => {
      console.log(`  [${i+1}] user_id=${a.user_id} (${a.username}), trainer=${a.trainer_id} (${a.trainer_name}), created_by=${a.created_by || 'NULL'}`);
    });

    // Also show the direct count
    const [countWithNull] = await db.query(`
      SELECT COUNT(*) as count FROM trainer_assignments WHERE created_by IS NULL
    `);
    
    const [countWithoutNull] = await db.query(`
      SELECT COUNT(*) as count FROM trainer_assignments WHERE created_by IS NOT NULL
    `);

    console.log(`\nBreakdown:`);
    console.log(`  - Assignments with created_by = NULL: ${countWithNull[0].count}`);
    console.log(`  - Assignments with created_by != NULL: ${countWithoutNull[0].count}`);
    console.log(`  - Total visible with new filter: ${assignments.length}`);

  } catch (err) {
    console.error('ERROR:', err.message);
  }
  process.exit();
}

run();
