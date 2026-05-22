require("dotenv").config({ path: ".env.local" });
const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "gym_user_db",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || ""
};

async function checkMembersSchema() {
  try {
    const conn = await mysql.createConnection(dbConfig);
    
    console.log("\n=== MEMBERS TABLE SCHEMA ===\n");
    const [columns] = await conn.execute(
      `DESCRIBE members`
    );
    
    console.log("Column Details:");
    columns.forEach(col => {
      console.log(`${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default || 'NULL'}`);
    });
    
    await conn.end();
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

checkMembersSchema();
