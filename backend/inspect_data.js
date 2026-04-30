const pool = require("./src/config/db");

async function inspectData() {
  try {
    console.log('\n=== USERS TABLE ===\n');
    
    const [users] = await pool.query('SELECT id, username, email FROM users LIMIT 20');
    console.log(`Total users in database: ${users.length}`);
    users.forEach(u => {
      console.log(`  ID: ${u.id}, Username: ${u.username}, Email: ${u.email}`);
    });
    
    console.log('\n=== MEMBERS TABLE ===\n');
    
    const [members] = await pool.query('SELECT id, name, email FROM members LIMIT 20');
    console.log(`Total members in database: ${members.length}`);
    members.forEach(m => {
      console.log(`  ID: ${m.id}, Name: ${m.name}, Email: ${m.email}`);
    });
    
    console.log('\n=== MEMBERSHIPS WITH NULL userId ===\n');
    
    const [nullMemberships] = await pool.query(`
      SELECT 
        m.id, 
        m.member_name,
        m.member_email,
        m.memberId,
        m.planName
      FROM memberships m
      WHERE m.userId IS NULL
      ORDER BY m.id
    `);
    
    console.log(`Memberships with NULL userId: ${nullMemberships.length}`);
    nullMemberships.forEach(m => {
      console.log(`  Membership ${m.id}: ${m.member_name} (${m.member_email}) - Plan: ${m.planName}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

inspectData();
