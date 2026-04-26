const db = require('./src/config/db');
const jwt = require('jsonwebtoken');

async function run() {
  try {
    console.log('=== TESTING ASSIGNMENTS API LOGIC ===\n');

    // Get all assignments
    const [allAssignments] = await db.query(`
      SELECT a.*,
             m.id as member_db_id,
             m.name as member_name,
             m.email as member_email,
             m.phone as member_mobile,
             m.weight as member_weight,
             s.name as current_trainer_name,
             s.role as trainer_source
      FROM trainer_assignments a
      LEFT JOIN users u ON u.id = a.user_id
      LEFT JOIN members m ON (m.email = u.email AND m.email IS NOT NULL AND m.email != '')
                              OR (m.phone = u.mobile AND m.phone IS NOT NULL AND m.phone != '')
      LEFT JOIN staff s ON s.id = a.trainer_id
      ORDER BY a.updated_at DESC
    `);

    console.log(`Total assignments (no filter): ${allAssignments.length}`);
    allAssignments.slice(0, 3).forEach((a, i) => {
      console.log(`  [${i+1}] user_id=${a.user_id}, trainer_id=${a.trainer_id}, trainer_name=${a.current_trainer_name}, created_by=${a.created_by}`);
    });

    // Now check what happens with admin filter
    console.log('\n=== WITH ADMIN FILTER ===');
    
    // Get a sample admin's UUID
    const [admins] = await db.query(`
      SELECT id, uuid FROM users WHERE role = 'admin' LIMIT 1
    `);

    if (admins.length > 0) {
      const adminUuid = admins[0].uuid;
      console.log(`Found admin with UUID: ${adminUuid}`);

      const [filteredAssignments] = await db.query(`
        SELECT a.*,
               m.id as member_db_id,
               m.name as member_name,
               m.email as member_email,
               m.phone as member_mobile,
               m.weight as member_weight,
               s.name as current_trainer_name,
               s.role as trainer_source
        FROM trainer_assignments a
        LEFT JOIN users u ON u.id = a.user_id
        LEFT JOIN members m ON (m.email = u.email AND m.email IS NOT NULL AND m.email != '')
                                OR (m.phone = u.mobile AND m.phone IS NOT NULL AND m.phone != '')
        LEFT JOIN staff s ON s.id = a.trainer_id
        WHERE a.created_by = ?
        GROUP BY a.id
        ORDER BY a.updated_at DESC
      `, [adminUuid]);

      console.log(`Assignments for this admin: ${filteredAssignments.length}`);
      filteredAssignments.slice(0, 3).forEach((a, i) => {
        console.log(`  [${i+1}] user_id=${a.user_id}, trainer_name=${a.current_trainer_name}`);
      });
    } else {
      console.log('No admins found in database!');
    }

    // Check if any assignments have NULL created_by
    const [nullCreatedBy] = await db.query(`
      SELECT COUNT(*) as count FROM trainer_assignments WHERE created_by IS NULL
    `);
    console.log(`\nAssignments with NULL created_by: ${nullCreatedBy[0].count}`);

  } catch (err) {
    console.error('ERROR:', err.message);
  }
  process.exit();
}

run();
