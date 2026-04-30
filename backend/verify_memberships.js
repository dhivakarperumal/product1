const pool = require("./src/config/db");

async function verifyMemberships() {
  try {
    console.log('\n=== VERIFYING MEMBERSHIPS FOR TRAINER ASSIGNMENT ===\n');
    
    // Fetch memberships like the frontend does (getAllMemberships)
    const [memberships] = await pool.query(`
      SELECT m.*, 
             u.username, 
             u.email AS user_email, 
             u.mobile AS user_mobile, 
             u.role,
             gm.name AS member_name,
             gm.phone AS member_phone,
             gm.email AS member_email,
             s.name AS trainer_full_name,
             s.employee_id AS trainer_emp_id,
             s.email AS trainer_email,
             s.phone AS trainer_phone
      FROM memberships m
      LEFT JOIN users u ON m.userId = u.id
      LEFT JOIN members gm ON m.memberId = gm.id
      LEFT JOIN staff s ON m.trainerId = s.id
      ORDER BY m.createdAt DESC
      LIMIT 20
    `);
    
    console.log(`Total memberships: ${memberships.length}\n`);
    
    // Check if all have valid userId
    let validCount = 0;
    let invalidCount = 0;
    
    memberships.forEach(m => {
      if (m.userId) {
        validCount++;
      } else {
        invalidCount++;
      }
    });
    
    console.log(`Memberships with valid userId: ${validCount}`);
    console.log(`Memberships with NULL userId: ${invalidCount}\n`);
    
    // Check if members can be selected for trainer assignment
    console.log('Sample memberships (first 5):');
    memberships.slice(0, 5).forEach((m, idx) => {
      const resolvedUserId = m.userId || null;
      const resolvedUsername = m.member_name || m.username || "No Name";
      const resolvedEmail = m.member_email || m.user_email || m.email || "";
      
      console.log(`\n${idx + 1}. ${resolvedUsername} (ID: ${m.id})`);
      console.log(`   userId: ${resolvedUserId}`);
      console.log(`   Can assign trainer: ${resolvedUserId ? '✓ YES' : '✗ NO'}`);
      console.log(`   Plan: ${m.planName}`);
      console.log(`   Current trainer: ${m.trainer_full_name || 'Not assigned'}`);
    });
    
    console.log('\n=== VALIDATION COMPLETE ===\n');
    console.log(validCount === memberships.length && memberships.length > 0 
      ? '✓ All memberships are ready for trainer assignment!' 
      : '✗ Some memberships still have issues');
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

verifyMemberships();
