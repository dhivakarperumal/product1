const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();
(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "gym_user_db"
  });
  const [total] = await conn.query("SELECT COUNT(*) as cnt FROM schema_migrations");
  console.log("\n=== MIGRATION STATUS REPORT ===");
  console.log("Total migrations applied:", total[0].cnt);
  const [key] = await conn.query("SELECT filename, applied_at FROM schema_migrations WHERE filename LIKE \"004%\" OR filename LIKE \"005%\" ORDER BY filename");
  console.log("\nMigrations 0040-0059:");
  key.forEach(r => console.log("  ?", r.filename, "- Applied:", new Date(r.applied_at).toISOString()));
  await conn.end();
})().catch(e => console.error("ERROR:", e.message));
