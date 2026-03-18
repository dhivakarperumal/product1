const pool = require("./src/config/db");

async function fixTable() {
  try {
    console.log("Checking and updating users table...");
    
    // Add google_id column
    try {
      await pool.query("ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE AFTER role");
      console.log("Added google_id column");
    } catch (err) {
      if (err.code === 'ER_DUP_COLUMN_NAME') {
        console.log("google_id column already exists");
      } else {
        throw err;
      }
    }

    // Add picture column
    try {
      await pool.query("ALTER TABLE users ADD COLUMN picture TEXT AFTER google_id");
      console.log("Added picture column");
    } catch (err) {
      if (err.code === 'ER_DUP_COLUMN_NAME') {
        console.log("picture column already exists");
      } else {
        throw err;
      }
    }

    console.log("Table update finished.");
    process.exit(0);
  } catch (error) {
    console.error("Error updating table:", error);
    process.exit(1);
  }
}

fixTable();
