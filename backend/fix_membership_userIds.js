const pool = require("./src/config/db");

async function populateUserIds() {
  try {
    console.log('\n=== POPULATING NULL userId IN MEMBERSHIPS ===\n');
    
    // Get all memberships with NULL userId
    const [nullUserIdMemberships] = await pool.query(`
      SELECT 
        m.id, 
        m.userId, 
        m.member_name,
        m.member_email,
        m.memberId
      FROM memberships m
      WHERE m.userId IS NULL
    `);
    
    console.log(`Found ${nullUserIdMemberships.length} memberships with NULL userId\n`);
    
    let updated = 0;
    let failed = 0;
    let created = 0;
    
    for (const membership of nullUserIdMemberships) {
      console.log(`Processing membership ID ${membership.id}: ${membership.member_name} (${membership.member_email})`);
      
      // Try to find user by email
      if (membership.member_email) {
        const [userByEmail] = await pool.query(
          'SELECT id FROM users WHERE email = ? LIMIT 1',
          [membership.member_email]
        );
        
        if (userByEmail.length > 0) {
          const userId = userByEmail[0].id;
          console.log(`  ✓ Found user ID ${userId} by email`);
          
          // Update membership
          const [result] = await pool.query(
            'UPDATE memberships SET userId = ? WHERE id = ?',
            [userId, membership.id]
          );
          
          if (result.affectedRows > 0) {
            console.log(`  ✓ Updated membership with userId ${userId}`);
            updated++;
          }
        } else {
          console.log(`  ✗ No user found with email: ${membership.member_email}`);
          
          // Try to find in members table and get user info
          const [memberInfo] = await pool.query(
            'SELECT id, name, email FROM members WHERE id = ? OR name = ?',
            [membership.memberId, membership.member_name]
          );
          
          if (memberInfo.length > 0) {
            const member = memberInfo[0];
            console.log(`  → Found member record: ${member.name} (${member.email})`);
            console.log(`  → Will need to create user account for this member`);
          }
          
          failed++;
        }
      } else {
        console.log(`  ✗ No email available`);
        failed++;
      }
      console.log('');
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Updated: ${updated}`);
    console.log(`Failed/No matching user: ${failed}`);
    console.log('');
    
    // Show remaining NULL userId after update
    const [remaining] = await pool.query('SELECT COUNT(*) as count FROM memberships WHERE userId IS NULL');
    console.log(`Remaining memberships with NULL userId: ${remaining[0].count}`);
    
    // Show which memberships still have issues
    if (remaining[0].count > 0) {
      console.log('\nMemberships still without userId:');
      const [stillNull] = await pool.query(`
        SELECT 
          m.id, 
          m.member_name,
          m.member_email,
          m.memberId,
          gm.name,
          gm.email as member_table_email
        FROM memberships m
        LEFT JOIN members gm ON m.memberId = gm.id
        WHERE m.userId IS NULL
      `);
      
      stillNull.forEach(m => {
        console.log(`  - Membership ${m.id}: ${m.member_name} (${m.member_email})`);
        console.log(`    Member: ${m.name}, email: ${m.member_table_email}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

populateUserIds();
