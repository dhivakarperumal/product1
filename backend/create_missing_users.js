const pool = require("./src/config/db");
const bcrypt = require('bcryptjs');

async function createMissingUserAccounts() {
  try {
    console.log('\n=== CREATING USER ACCOUNTS FOR MEMBERS ===\n');
    
    // Get all members that don't have a corresponding user account
    const [membersWithoutUsers] = await pool.query(`
      SELECT DISTINCT
        gm.id,
        gm.name,
        gm.email
      FROM members gm
      LEFT JOIN users u ON u.email = gm.email
      WHERE u.id IS NULL
      AND gm.email IS NOT NULL
      AND gm.email != ''
    `);
    
    console.log(`Found ${membersWithoutUsers.length} members without user accounts\n`);
    
    let created = 0;
    
    for (const member of membersWithoutUsers) {
      console.log(`Creating user for member: ${member.name} (${member.email})`);
      
      // Generate a default password
      const defaultPassword = 'Member@123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      // Create username from email (take part before @)
      const username = member.email.split('@')[0] || member.name.toLowerCase().replace(/\s+/g, '_');
      
      try {
        const [result] = await pool.query(
          `INSERT INTO users (username, email, password_hash, role)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
          [username, member.email, hashedPassword, 'member']
        );
        
        const userId = result.insertId;
        console.log(`  ✓ Created user ID ${userId} with username: ${username}`);
        
        // Now update memberships that reference this member
        const [updateResult] = await pool.query(
          `UPDATE memberships
           SET userId = ?
           WHERE member_email = ? AND userId IS NULL`,
          [userId, member.email]
        );
        
        if (updateResult.affectedRows > 0) {
          console.log(`  ✓ Updated ${updateResult.affectedRows} membership(s) with userId ${userId}`);
        }
        
        created++;
      } catch (err) {
        console.log(`  ✗ Error creating user: ${err.message}`);
      }
      console.log('');
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Created: ${created} user accounts`);
    
    // Verify the fix
    const [remaining] = await pool.query('SELECT COUNT(*) as count FROM memberships WHERE userId IS NULL');
    console.log(`Remaining memberships with NULL userId: ${remaining[0].count}`);
    
    if (remaining[0].count === 0) {
      console.log('\n✓ SUCCESS! All memberships now have valid userId values!');
    } else {
      console.log('\n⚠ Some memberships still have NULL userId:');
      const [stillNull] = await pool.query(`
        SELECT m.id, m.member_name, m.member_email
        FROM memberships m
        WHERE m.userId IS NULL
      `);
      
      stillNull.forEach(m => {
        console.log(`  - Membership ${m.id}: ${m.member_name} (${m.member_email})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createMissingUserAccounts();
