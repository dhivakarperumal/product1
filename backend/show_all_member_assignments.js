require("dotenv").config({ path: ".env.local" });
const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "gym_user_db",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || ""
};

async function showAllAssignmentsForDuplicateMembers() {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    
    console.log("\n=== SHOWING ALL ASSIGNMENTS FOR MEMBERS WITH SAME NAME & EMAIL ===\n");
    
    // First, find members that have multiple assignments
    const [memberGroups] = await conn.execute(`
      SELECT DISTINCT m.id, m.name, m.email
      FROM members m
      ORDER BY m.name, m.email
    `);
    
    console.log(`Total unique members: ${memberGroups.length}\n`);
    
    // For each member, show all their trainer assignments
    for (const member of memberGroups) {
      const [assignments] = await conn.execute(`
        SELECT 
          ta.id,
          ta.member_id,
          m.name,
          m.email,
          t.name as trainer_name,
          p.plan_name,
          ta.start_date,
          ta.end_date,
          ta.status,
          ta.created_at
        FROM trainer_assignments ta
        JOIN members m ON ta.member_id = m.id
        JOIN trainers t ON ta.trainer_id = t.id
        JOIN plans p ON ta.plan_id = p.id
        WHERE m.id = ?
        ORDER BY ta.created_at DESC
      `, [member.id]);
      
      if (assignments.length > 0) {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`Member: ${member.name} | Email: ${member.email}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`Total Assignments: ${assignments.length}\n`);
        console.table(assignments);
      }
    }
    
    await conn.end();
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

showAllAssignmentsForDuplicateMembers();
