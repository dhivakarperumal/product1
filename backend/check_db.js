const db = require('./src/config/db');

async function test() {
  try {
    const [rows] = await db.query("DESCRIBE attendance");
    console.log(JSON.stringify(rows));
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

test();
