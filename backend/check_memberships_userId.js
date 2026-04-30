const pool = require("./src/config/db");

async function checkMemberships() {
  try {
    console.log('\n=== CHECKING MEMBERSHIPS WITH NULL userId ===\n');
    
    // Check memberships with NULL userId
    const [nullUserIdMemberships] = await pool.query(`
      SELECT 
        m.id, 
        m.userId, 
        m.memberId,
        m.member_name,
        m.member_email,
        u.id as user_id,
        u.email,
        u.username
      FROM memberships m
      LEFT JOIN users u ON u.email = m.member_email
      WHERE m.userId IS NULL
      LIMIT 20
    `);
    
    console.log(`Found ${nullUserIdMemberships.length} memberships with NULL userId:\n`);
    nullUserIdMemberships.forEach(m => {
      console.log(`Membership ID: ${m.id}`);
      console.log(`  Current userId: ${m.userId}`);
      console.log(`  Member name: ${m.member_name}`);
      console.log(`  Member email: ${m.member_email}`);
      console.log(`  Potential user_id found: ${m.user_id}`);
      console.log(`  User email: ${m.email}`);
      console.log('---');
    });

    console.log('\n=== CHECKING MEMBERS WITHOUT USER RECORDS ===\n');
    
    // Check members that don't have corresponding users
    const [membersWithoutUsers] = await pool.query(`
      SELECT 
        gm.id,
        gm.name,
        gm.email,
        COUNT(m.id) as membership_count
      FROM members gm
      LEFT JOIN users u ON u.email = gm.email
      LEFT JOIN memberships m ON m.memberId = gm.id
      WHERE u.id IS NULL
      GROUP BY gm.id
      LIMIT 20
    `);
    
    console.log(`Found ${membersWithoutUsers.length} members without user records:\n`);
    membersWithoutUsers.forEach(m => {
      console.log(`Member ID: ${m.id}`);
      console.log(`  Name: ${m.name}`);
      console.log(`  Email: ${m.email}`);
      console.log(`  Has memberships: ${m.membership_count}`);
      console.log('---');
    });

    console.log('\n=== SUMMARY ===\n');
    
    const [totalMemberships] = await pool.query('SELECT COUNT(*) as count FROM memberships');
    const [membershipsWithUserId] = await pool.query('SELECT COUNT(*) as count FROM memberships WHERE userId IS NOT NULL');
    const [membershipsNullUserId] = await pool.query('SELECT COUNT(*) as count FROM memberships WHERE userId IS NULL');
    
    console.log(`Total memberships: ${totalMemberships[0].count}`);
    console.log(`Memberships with userId: ${membershipsWithUserId[0].count}`);
    console.log(`Memberships with NULL userId: ${membershipsNullUserId[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkMemberships();
