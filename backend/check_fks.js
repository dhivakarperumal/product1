const db = require('./src/config/db');

async function checkFK() {
  try {
    const [rows] = await db.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'attendance' 
        AND TABLE_SCHEMA = 'gymwebsite_db' 
        AND COLUMN_NAME = 'member_id' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    console.log(JSON.stringify(rows));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkFK();
