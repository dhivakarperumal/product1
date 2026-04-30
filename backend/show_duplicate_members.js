require("dotenv").config({ path: ".env.local" });
const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "gym_user_db",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || ""
};

async function showDuplicateMembers() {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    
    console.log("\n=== MEMBERS WITH SAME NAME AND EMAIL ===\n");
    
    // Query to find members with same name and email
    const [duplicates] = await conn.execute(`
      SELECT 
        name, 
        email,
        COUNT(*) as duplicate_count,
        GROUP_CONCAT(id SEPARATOR ', ') as member_ids
      FROM members
      GROUP BY name, email
      HAVING COUNT(*) > 1
      ORDER BY duplicate_count DESC, name
    `);
    
    if (duplicates.length === 0) {
      console.log("✓ No duplicate members found (same name and email)");
    } else {
      console.log(`Found ${duplicates.length} duplicate groups:\n`);
      console.table(duplicates);
      
      // Show detailed info for each duplicate group
      console.log("\n=== DETAILED MEMBER INFO ===\n");
      for (const dup of duplicates) {
        console.log(`Name: "${dup.name}" | Email: "${dup.email}" | Count: ${dup.duplicate_count}`);
        console.log(`Member IDs: ${dup.member_ids}`);
        
        // Get full details of all members in this group
        const [members] = await conn.execute(
          "SELECT id, name, email, phone, created_at, updated_at FROM members WHERE name = ? AND email = ?",
          [dup.name, dup.email]
        );
        console.table(members);
        console.log("---\n");
      }
    }
    
    await conn.end();
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

showDuplicateMembers();
