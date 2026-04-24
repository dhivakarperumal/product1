require("dotenv").config({ path: ".env.local" });
const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "gym_user_db",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || ""
};

async function checkMembers() {
  try {
    const conn = await mysql.createConnection(dbConfig);
    
    console.log("\n=== CHECKING EXISTING MEMBERS ===\n");
    const [members] = await conn.execute("SELECT * FROM members LIMIT 10");
    
    if (members.length === 0) {
      console.log("No members found in database.");
    } else {
      console.log(`Found ${members.length} members:`);
      console.table(members);
    }
    
    await conn.end();
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

checkMembers();
