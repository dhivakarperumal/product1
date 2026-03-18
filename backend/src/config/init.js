require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

// Create a connection pool without specifying the database first
const adminPool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
});

async function initializeDatabase() {
  const dbName = process.env.DB_NAME || "gymwebsite_db";
  const db = require("./db");

  try {
    console.log("📊 Initializing database...");

    // First, create the database if it doesn't exist
    try {
      console.log(`Creating database ${dbName}...`);
      await adminPool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      console.log(`✅ Database ${dbName} created!`);
    } catch (err) {
      if (err.code === "ER_DB_CREATE_EXISTS") {
        console.log(`✅ Database ${dbName} already exists`);
      } else {
        throw err;
      }
    }

    // Now create tables by running migrations (preferred) or legacy schema.sql
    const migrations = path.join(__dirname, "migrations");
    if (fs.existsSync(migrations)) {
      // run migrations from migrate.js so we can version changes
      console.log("Running migrations from folder:", migrations);
      const { runMigrations } = require("./migrate");
      await runMigrations();
    } else {
      console.log("Creating tables from legacy schema.sql...");
      const schemaPath = path.join(__dirname, "schema.sql");
      if (!fs.existsSync(schemaPath)) {
        throw new Error("schema.sql not found and no migrations directory available");
      }
      const schema = fs.readFileSync(schemaPath, "utf-8");

      // Split by semicolon and execute each statement
      const statements = schema.split(";").filter(stmt => stmt.trim());

      for (const stmt of statements) {
        if (stmt.trim()) {
          await db.query(stmt.trim());
        }
      }

      console.log("✅ Database schema initialized successfully!");
    }

    // Create a default branch if none exists
    const [branchResult] = await db.query("SELECT COUNT(*) as count FROM branches");
    if (branchResult[0].count === 0) {
      await db.query(
        "INSERT INTO branches (name, location, phone, email, manager_name) VALUES (?, ?, ?, ?, ?)",
        ["Main Branch", "City Center", "+91-XXX-XXX-XXXX", "main@gym.com", "Manager Name"]
      );
      console.log("✅ Default branch created!");
    }

    console.log("🎉 Database setup complete!");
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
  } finally {
    await adminPool.end();
    process.exit(0);
  }
}

initializeDatabase();