require("dotenv").config({ path: ".env.local" });
const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "gym_user_db",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || ""
};

async function showAllMembersData() {
  try {
    const conn = await mysql.createConnection(dbConfig);
    
    console.log("\n=== MEMBERS TABLE SCHEMA ===\n");
    const [schema] = await conn.execute(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'members' AND TABLE_SCHEMA = DATABASE()
       ORDER BY ORDINAL_POSITION`
    );
    
    console.table(schema);
    
    console.log("\n=== ALL MEMBERS DATA ===\n");
    const [members] = await conn.execute("SELECT * FROM members ORDER BY id DESC");
    
    if (members.length === 0) {
      console.log("No members found in database.");
    } else {
      console.log(`Found ${members.length} members:\n`);
      members.forEach((member, index) => {
        console.log(`\n--- Member ${index + 1} ---`);
        Object.entries(member).forEach(([key, value]) => {
          console.log(`${key}: ${value}`);
        });
      });
      
      console.log("\n\n=== MEMBERS TABLE (SUMMARY) ===\n");
      console.table(members);
    }
    
    await conn.end();
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

showAllMembersData();
